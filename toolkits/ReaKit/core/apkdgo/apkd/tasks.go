package main

import (
	"cmp"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"sync/atomic"

	"github.com/kiber-io/apkd/apkd/logging"
	"github.com/kiber-io/apkd/apkd/sources"

	"github.com/vbauerster/mpb/v8"
	"github.com/vbauerster/mpb/v8/decor"
)

var logger = logging.Named("tasks")

type Task any

type PackageTask struct {
	Task
	PackageName string
	VersionCode int
	Bar         *mpb.Bar
}

type VersionTask struct {
	Task
	Version sources.Version
	Source  sources.Source
	Bar     *mpb.Bar
	// Fallbacks are tried in order when downloading from Source fails.
	Fallbacks []VersionCandidate
}

type VersionCandidate struct {
	Version sources.Version
	Source  sources.Source
}

// localDownloadError marks failures that another source cannot fix
// (existing output file, unwritable output path).
type localDownloadError struct {
	error
}

type TaskQueue struct {
	queue               chan Task
	wg                  sync.WaitGroup
	maxWorkers          int
	progress            *mpb.Progress
	statusBar           *mpb.Bar
	enqueuedTasks       atomic.Int64
	runningTasks        atomic.Int64
	completedTasks      atomic.Int64
	activeDownloadTasks atomic.Int64
	stateMu             sync.RWMutex
	processedPackages   map[string]struct{}
	processedDevelopers map[string]map[string]struct{}
}

func NewTaskQueue(maxWorkers int) *TaskQueue {
	wg := sync.WaitGroup{}
	tq := &TaskQueue{
		queue:               make(chan Task, 100),
		maxWorkers:          maxWorkers,
		progress:            mpb.New(mpb.WithAutoRefresh(), mpb.WithWaitGroup(&wg)),
		processedPackages:   make(map[string]struct{}),
		processedDevelopers: make(map[string]map[string]struct{}),
	}
	tq.statusBar = tq.progress.New(0, mpb.NopStyle(),
		mpb.BarFillerTrim(),
		mpb.PrependDecorators(decor.Any(func(decor.Statistics) string {
			return tq.progressStatusLine()
		})),
	)
	tq.statusBar.SetPriority(1_000_000 + tq.statusBar.ID())
	log.SetOutput(tq.progress)

	for range tq.maxWorkers {
		go tq.worker()
	}

	return tq
}

func (tq *TaskQueue) AddTask(task Task) {
	switch t := task.(type) {
	case PackageTask:
		logger.Logd("Adding task: " + t.PackageName)
	case VersionTask:
		logger.Logd("Adding task: " + t.Version.PackageName)
	}
	tq.wg.Add(1)
	tq.enqueuedTasks.Add(1)
	select {
	case tq.queue <- task:
	default:
		// Prevent worker deadlocks when producers are workers and queue is full.
		go func(t Task) {
			tq.queue <- t
		}(task)
	}
}

func (tq *TaskQueue) Wait() {
	tq.wg.Wait()
	if tq.statusBar != nil {
		tq.statusBar.SetTotal(1, true)
	}
	tq.progress.Wait()
	close(tq.queue)
}

func (tq *TaskQueue) markPackageProcessed(packageName string) {
	tq.stateMu.Lock()
	tq.processedPackages[packageName] = struct{}{}
	tq.stateMu.Unlock()
}

func (tq *TaskQueue) reservePackageIfNew(packageName string) bool {
	tq.stateMu.Lock()
	defer tq.stateMu.Unlock()
	if _, exists := tq.processedPackages[packageName]; exists {
		return false
	}
	tq.processedPackages[packageName] = struct{}{}
	return true
}

func (tq *TaskQueue) reserveDeveloperSource(developerID, sourceName string) bool {
	tq.stateMu.Lock()
	defer tq.stateMu.Unlock()
	sourcesByDeveloper, exists := tq.processedDevelopers[developerID]
	if !exists {
		sourcesByDeveloper = make(map[string]struct{})
		tq.processedDevelopers[developerID] = sourcesByDeveloper
	}
	if _, exists = sourcesByDeveloper[sourceName]; exists {
		return false
	}
	sourcesByDeveloper[sourceName] = struct{}{}
	return true
}

func (tq *TaskQueue) worker() {
	for task := range tq.queue {
		tq.runningTasks.Add(1)
		switch t := task.(type) {
		case PackageTask:
			tq.markPackageProcessed(t.PackageName)
			tq.processPackageTask(t)
		case VersionTask:
			tq.markPackageProcessed(t.Version.PackageName)
			tq.processVersionTask(t)
		default:
			reportError(fmt.Sprintf("Unknown task type: %T", t))
		}
		tq.runningTasks.Add(-1)
		tq.completedTasks.Add(1)
		tq.wg.Done()
	}
}

func (tq *TaskQueue) progressStatusLine() string {
	queued := tq.enqueuedTasks.Load() - tq.runningTasks.Load() - tq.completedTasks.Load()
	if queued < 0 {
		queued = 0
	}
	return fmt.Sprintf(
		"Progress: downloaded %d | in progress %d | queued %d | errors %d",
		downloadSuccessCount.Load(),
		tq.activeDownloadTasks.Load(),
		queued,
		downloadErrorCount.Load(),
	)
}

func getDecoratorsForTask(task Task, status string) []decor.Decorator {
	var decorators []decor.Decorator
	wc := decor.WC{C: decor.DSyncSpaceR}

	switch t := task.(type) {
	case PackageTask:
		decorators = append(decorators, decor.Name(t.PackageName, wc), decor.Name("-", wc))
		if t.VersionCode != 0 {
			decorators = append(decorators, decor.Name(fmt.Sprintf("(%d)", t.VersionCode), wc))
		} else {
			decorators = append(decorators, decor.Name("-", wc))
		}
	case VersionTask:
		decorators = append(decorators,
			decor.Name(t.Version.PackageName, wc),
			decor.Name("v"+t.Version.Name, wc),
			decor.Name(fmt.Sprintf("(%d)", t.Version.Code), wc),
			decor.Name(t.Source.Name(), wc),
		)
	}
	if status != "" {
		decorators = append(decorators, decor.Name("["+status+"]", wc))
	}

	return decorators
}

func (tq *TaskQueue) processPackageTask(task PackageTask) {
	bar := tq.progress.AddBar(1,
		mpb.BarQueueAfter(task.Bar),
		mpb.BarRemoveOnComplete(),
		mpb.PrependDecorators(getDecoratorsForTask(task, "search")...),
	)
	if task.Bar != nil {
		p := task.Bar.ID() + 3000
		task.Bar.SetPriority(p)
		tq.removeBar(task.Bar)
	} else {
		p := 3000 - bar.ID()
		bar.SetPriority(p)
	}
	candidates, errs := tq.findVersion(task.PackageName, task.VersionCode)
	if len(candidates) == 0 {
		for _, e := range errs {
			reportError(fmt.Sprintf("Error finding package %s at source %s: %v", e.PackageName, e.SourceName, e.Err))
		}
		if len(errs) == 0 {
			reportError(fmt.Sprintf("Package %s not found in active sources", task.PackageName))
		}
		tq.removeBar(bar)
		return
	}
	// Another source found the package, so search failures are not fatal.
	for _, e := range errs {
		logger.Logw(fmt.Sprintf("Error finding package %s at source %s: %v", e.PackageName, e.SourceName, e.Err))
	}
	version, source := candidates[0].Version, candidates[0].Source
	var wg2 sync.WaitGroup
	wg2.Add(1)
	go func() {
		defer wg2.Done()
		tq.processVersionTask(VersionTask{
			Version:   version,
			Source:    source,
			Bar:       bar,
			Fallbacks: candidates[1:],
		})
	}()
	defer wg2.Wait()
	if batchDeveloperDownloadMode && version.DeveloperId != "" {
		if !tq.reserveDeveloperSource(version.DeveloperId, source.Name()) {
			return
		}
		logger.Logd(fmt.Sprintf("Searching for packages by developer %s at source %s", version.DeveloperId, source.Name()))
		packages, err := source.FindByDeveloper(version.DeveloperId)
		if err != nil {
			reportError(fmt.Sprintf("Error finding packages by developer %s at source %s: %v", version.DeveloperId, source.Name(), err))
			tq.removeBar(bar)
			return
		}
		for _, packageName := range packages {
			if !tq.reservePackageIfNew(packageName) {
				continue
			}
			logger.Logd(fmt.Sprintf("Found package %s by developer %s at source %s", packageName, version.DeveloperId, source.Name()))
			newTask := PackageTask{
				PackageName: packageName,
			}
			bar := tq.progress.AddBar(1,
				mpb.BarRemoveOnComplete(),
				mpb.PrependDecorators(getDecoratorsForTask(newTask, "queued")...),
			)
			newTask.Bar = bar
			p := 5000 + bar.ID()
			bar.SetPriority(p)
			tq.AddTask(newTask)
		}
	}
}

func (tq *TaskQueue) processVersionTask(task VersionTask) {
	bar := tq.progress.AddBar(0,
		mpb.BarQueueAfter(task.Bar),
		mpb.PrependDecorators(getDecoratorsForTask(task, "")...),
		mpb.AppendDecorators(
			decor.Percentage(decor.WC{W: 5}),
			decor.Name(" / "),
			decor.EwmaSpeed(decor.SizeB1024(0), "% .2f", 30),
		),
	)
	if task.Bar != nil {
		tq.removeBar(task.Bar)
		p := 3000 - task.Bar.ID()
		task.Bar.SetPriority(p)
	} else {
		p := 3000 - bar.ID()
		bar.SetPriority(p)
	}
	tq.activeDownloadTasks.Add(1)
	err := tq.downloadVersion(task, bar)
	tq.activeDownloadTasks.Add(-1)
	tq.removeBar(bar)
	if err == nil {
		reportDownloadSuccess()
		logger.Logd(fmt.Sprintf("Package %s downloaded successfully", task.Version.PackageName))
		return
	}
	var localErr localDownloadError
	if errors.As(err, &localErr) || len(task.Fallbacks) == 0 {
		reportError(err.Error())
		return
	}
	next := task.Fallbacks[0]
	logger.Logw(fmt.Sprintf("%v; falling back to source %s (v%s)", err, next.Source.Name(), next.Version.Name))
	tq.processVersionTask(VersionTask{
		Version:   next.Version,
		Source:    next.Source,
		Fallbacks: task.Fallbacks[1:],
	})
}

func (tq *TaskQueue) downloadVersion(task VersionTask, bar *mpb.Bar) error {
	var outFile string
	if outputFileName != "" {
		outFile = outputFileName
	} else {
		if task.Version.Type == "" {
			return fmt.Errorf("file type not found for package %s at source %s", task.Version.PackageName, task.Source.Name())
		}
		outFile = fmt.Sprintf("%s-%s-v%d.%s", task.Version.PackageName, task.Version.Name, task.Version.Code, task.Version.Type)
		outFile = sanitizeFileName(outFile)
	}
	if outputDir != "" {
		outFile = filepath.Join(outputDir, outFile)
	}
	if _, err := os.Stat(outFile); err == nil {
		if !forceDownload {
			return localDownloadError{fmt.Errorf("file %s already exists. Use --force to overwrite", outFile)}
		}
		logger.Logd(fmt.Sprintf("File %s already exists. Removing...", outFile))
		if err := os.Remove(outFile); err != nil {
			return localDownloadError{fmt.Errorf("error removing existing file %s: %w", outFile, err)}
		}
	}
	logger.Logd(fmt.Sprintf("Downloading package %s from source %s to file %s", task.Version.PackageName, task.Source.Name(), outFile))
	stream, err := task.Source.Download(task.Version)
	if err != nil {
		return fmt.Errorf("error downloading package %s from source %s: %w", task.Version.PackageName, task.Source.Name(), err)
	}
	// Prefer Content-Length from the response (authoritative). Fall back to
	// source-reported metadata size, which is sometimes inaccurate. Zero means
	// unknown: the bar tracks bytes without a target percentage.
	barSize := stream.Size
	if barSize <= 0 {
		barSize = int64(task.Version.Size) //nolint:gosec // G115: APK sizes never approach int64 max
	}
	if barSize < 0 {
		barSize = 0
	}
	bar.SetTotal(barSize, false)
	progressReader := bar.ProxyReader(stream.Body)
	defer progressReader.Close()

	source, isRuStore := task.Source.(*sources.RuStore)
	downloadPath := outFile
	if isRuStore {
		downloadPath = outFile + ".download"
		if err := os.Remove(downloadPath); err != nil && !os.IsNotExist(err) {
			return localDownloadError{fmt.Errorf("error removing existing temporary file %s: %w", downloadPath, err)}
		}
	}

	file, err := os.Create(downloadPath)
	if err != nil {
		return localDownloadError{fmt.Errorf("error creating file %s: %w", downloadPath, err)}
	}
	// Drop partial output so a fallback source (same file name) or the caller
	// never mistakes it for a finished package.
	if _, err = io.Copy(file, progressReader); err != nil {
		_ = file.Close()
		_ = os.Remove(downloadPath)
		return fmt.Errorf("error saving file %s from source %s: %w", downloadPath, task.Source.Name(), err)
	}
	if err := file.Close(); err != nil {
		_ = os.Remove(downloadPath)
		return localDownloadError{fmt.Errorf("error closing file %s: %w", downloadPath, err)}
	}
	if isRuStore {
		// workaround for rustore: sometimes it responds with a zip file in which the APK is stored
		if err := source.ExtractApkFromZip(downloadPath, outFile); err != nil {
			_ = os.Remove(outFile)
			return fmt.Errorf("error extracting APK from zip file %s: %w", downloadPath, err)
		}
	}
	return nil
}

func (tq *TaskQueue) removeBar(prevBar *mpb.Bar) {
	if prevBar == nil || prevBar.Aborted() {
		return
	}
	prevBar.Abort(true)
}

// findVersion queries every active source and returns the ones that have the
// package, newest version first. Search errors are returned, not reported, so
// the caller can decide whether they matter.
func (tq *TaskQueue) findVersion(packageName string, versionCode int) ([]VersionCandidate, []sources.Error) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var candidates []VersionCandidate
	var sourcesErrors []sources.Error
	logger.Logd(fmt.Sprintf("Searching for package %s in %d sources", packageName, len(activeSources)))
	for _, source := range activeSources {
		wg.Add(1)
		go func(src sources.Source) {
			defer wg.Done()
			version, err := src.FindByPackage(packageName, versionCode)
			if err != nil {
				var appNotFoundError *sources.AppNotFoundError
				if !errors.As(err, &appNotFoundError) {
					logger.Logd(fmt.Sprintf("Error finding package %s at source %s: %v", packageName, src.Name(), err))
					mu.Lock()
					sourcesErrors = append(sourcesErrors, sources.Error{
						SourceName:  src.Name(),
						PackageName: packageName,
						Err:         err,
					})
					mu.Unlock()
				} else {
					logger.Logd(fmt.Sprintf("Package %s not found at source %s", packageName, src.Name()))
				}
				return
			}
			if onlyApk && version.Type != sources.APK {
				logger.Logd(fmt.Sprintf("Skipping package %s v%s at source %s: type %s (--only-apk)", packageName, version.Name, src.Name(), version.Type))
				return
			}
			if version.Code == 0 {
				return
			}
			logger.Logd(fmt.Sprintf("Found package %s v%s (%v) at source %s", packageName, version.Name, version.Code, src.Name()))
			mu.Lock()
			candidates = append(candidates, VersionCandidate{Version: version, Source: src})
			mu.Unlock()
		}(source)
	}

	wg.Wait()

	slices.SortStableFunc(candidates, func(a, b VersionCandidate) int {
		if c := cmp.Compare(b.Version.Code, a.Version.Code); c != 0 {
			return c
		}
		return strings.Compare(a.Source.Name(), b.Source.Name())
	})
	slices.SortStableFunc(sourcesErrors, func(a, b sources.Error) int {
		return strings.Compare(a.SourceName, b.SourceName)
	})

	return candidates, sourcesErrors
}
