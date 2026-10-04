package main

import (
	"errors"
	"io"
	"os"
	"strconv"
	"strings"
	"testing"

	"github.com/kiber-io/apkd/apkd/sources"
)

func TestProgressStatusLine(t *testing.T) {
	prevSuccess := downloadSuccessCount.Load()
	prevErrors := downloadErrorCount.Load()
	defer func() {
		downloadSuccessCount.Store(prevSuccess)
		downloadErrorCount.Store(prevErrors)
	}()

	downloadSuccessCount.Store(3)
	downloadErrorCount.Store(1)

	tq := &TaskQueue{}
	tq.enqueuedTasks.Store(10)
	tq.runningTasks.Store(2)
	tq.completedTasks.Store(4)
	tq.activeDownloadTasks.Store(2)

	got := tq.progressStatusLine()
	want := "Progress: downloaded 3 | in progress 2 | queued 4 | errors 1"
	if got != want {
		t.Fatalf("unexpected progress line:\n got: %q\nwant: %q", got, want)
	}
}

func TestProgressStatusLineClampsQueuedToZero(t *testing.T) {
	prevSuccess := downloadSuccessCount.Load()
	prevErrors := downloadErrorCount.Load()
	defer func() {
		downloadSuccessCount.Store(prevSuccess)
		downloadErrorCount.Store(prevErrors)
	}()

	downloadSuccessCount.Store(0)
	downloadErrorCount.Store(2)

	tq := &TaskQueue{}
	tq.enqueuedTasks.Store(1)
	tq.runningTasks.Store(2)
	tq.completedTasks.Store(1)
	tq.activeDownloadTasks.Store(1)

	got := tq.progressStatusLine()
	want := "Progress: downloaded 0 | in progress 1 | queued 0 | errors 2"
	if got != want {
		t.Fatalf("unexpected progress line:\n got: %q\nwant: %q", got, want)
	}
}

type fakeSource struct {
	name     string
	version  sources.Version
	findErr  error
	download func() (*sources.DownloadStream, error)
}

func (f *fakeSource) MaxParallelsDownloads() int { return 1 }
func (f *fakeSource) Name() string               { return f.name }
func (f *fakeSource) FindByDeveloper(string) ([]string, error) {
	return nil, nil
}
func (f *fakeSource) FindByPackage(string, int) (sources.Version, error) {
	return f.version, f.findErr
}
func (f *fakeSource) Download(sources.Version) (*sources.DownloadStream, error) {
	return f.download()
}

func TestDownloadFallsBackToNextSource(t *testing.T) {
	prevSources, prevDir := activeSources, outputDir
	prevSuccess, prevErrors := downloadSuccessCount.Load(), downloadErrorCount.Load()
	defer func() {
		activeSources, outputDir = prevSources, prevDir
		downloadSuccessCount.Store(prevSuccess)
		downloadErrorCount.Store(prevErrors)
	}()
	downloadSuccessCount.Store(0)
	downloadErrorCount.Store(0)
	outputDir = t.TempDir()

	v := func(code int) sources.Version {
		return sources.Version{PackageName: "com.example", Name: "1." + strconv.Itoa(code), Code: code, Type: sources.APK}
	}
	broken := &fakeSource{name: "broken", version: v(3), download: func() (*sources.DownloadStream, error) {
		return nil, errors.New("403 Forbidden")
	}}
	searchFails := &fakeSource{name: "searchfails", findErr: errors.New("419")}
	good := &fakeSource{name: "good", version: v(2), download: func() (*sources.DownloadStream, error) {
		return &sources.DownloadStream{Body: io.NopCloser(strings.NewReader("PK")), Size: 2}, nil
	}}
	activeSources = []sources.Source{good, searchFails, broken}

	tq := NewTaskQueue(1)
	tq.AddTask(PackageTask{PackageName: "com.example"})
	tq.Wait()

	if got := downloadSuccessCount.Load(); got != 1 {
		t.Fatalf("expected 1 success, got %d (errors %d)", got, downloadErrorCount.Load())
	}
	if got := downloadErrorCount.Load(); got != 0 {
		t.Fatalf("expected no reported errors after fallback, got %d", got)
	}
	entries, _ := os.ReadDir(outputDir)
	if len(entries) != 1 || entries[0].Name() != "com.example-1.2-v2.apk" {
		t.Fatalf("unexpected output files: %v", entries)
	}
}
