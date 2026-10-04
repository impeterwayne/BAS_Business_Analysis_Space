package sources

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	neturl "net/url"
	"path"
	"strconv"
	"strings"

	"github.com/kiber-io/apkd/apkd/network"
	fakeUserAgent "github.com/lib4u/fake-useragent"
)

// ApkPure resolves packages through the d.apkpure.com direct-download endpoint.
// It answers /b/XAPK/<pkg>?version=latest (or ?versionCode=N) with a 302 to a
// signed CDN URL whose path and query carry everything a Version needs:
//
//	https://data.winudf.com/XAPK/<base64url("<pkg>_<code>_<hash>")>?filename=<Title>_<name>_APKPure.xapk&full_size=<bytes>&...
//
// A 404 means the package is unknown; a 302 anywhere else (the app's versions
// page) means the requested versionCode is not available.
type ApkPure struct {
	BaseSource
	config ApkPureConfig
}

type ApkPureConfig struct {
	BaseSourceConfig `yaml:",inline"`
}

func (s *ApkPure) Name() string {
	return "apkpure"
}

func (s *ApkPure) downloadURL(packageName string, versionCode int) string {
	query := "version=latest"
	if versionCode != 0 {
		query = "versionCode=" + strconv.Itoa(versionCode)
	}
	return fmt.Sprintf("%s/b/XAPK/%s?%s", s.config.BaseURL, neturl.PathEscape(packageName), query)
}

func (s *ApkPure) FindByPackage(packageName string, versionCode int) (Version, error) {
	link := s.downloadURL(packageName, versionCode)
	req, err := s.NewRequest("GET", link, nil)
	if err != nil {
		return Version{}, err
	}
	req = network.WithCheckRedirect(req, func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	})
	res, err := s.Http().Do(req)
	if err != nil {
		return Version{}, fmt.Errorf("request failed: %w", err)
	}
	_ = res.Body.Close()

	switch res.StatusCode {
	case http.StatusNotFound:
		return Version{}, &AppNotFoundError{PackageName: packageName}
	case http.StatusFound, http.StatusMovedPermanently, http.StatusSeeOther, http.StatusTemporaryRedirect:
	default:
		return Version{}, fmt.Errorf("error: %s", res.Status)
	}

	location, err := res.Location()
	if err != nil {
		return Version{}, fmt.Errorf("redirect without location: %w", err)
	}
	version, err := parseApkPureLocation(location, packageName)
	if err != nil {
		if versionCode != 0 {
			return Version{}, fmt.Errorf("version code %d not found: %w", versionCode, err)
		}
		return Version{}, err
	}
	if versionCode != 0 && version.Code != versionCode {
		return Version{}, fmt.Errorf("version code %d not found (got %d)", versionCode, version.Code)
	}
	version.Link = link
	return version, nil
}

// parseApkPureLocation extracts version metadata from the CDN redirect target.
func parseApkPureLocation(location *neturl.URL, packageName string) (Version, error) {
	segments := strings.Split(strings.Trim(location.Path, "/"), "/")
	if len(segments) != 2 {
		return Version{}, fmt.Errorf("unexpected redirect to %s", location.Redacted())
	}

	encoded := strings.TrimRight(segments[1], "=")
	decoded, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(encoded)
		if err != nil {
			return Version{}, fmt.Errorf("failed to decode file id %q: %w", segments[1], err)
		}
	}
	rest, ok := strings.CutPrefix(string(decoded), packageName+"_")
	if !ok {
		return Version{}, fmt.Errorf("file id %q does not match package %s", decoded, packageName)
	}
	codeText, _, _ := strings.Cut(rest, "_")
	code, err := parseVersionCodeText(codeText)
	if err != nil {
		return Version{}, err
	}

	query := location.Query()
	filename := query.Get("filename")
	fileType, err := parseApkPureFileType(path.Ext(filename))
	if err != nil {
		return Version{}, err
	}
	name := strings.TrimSuffix(filename, path.Ext(filename))
	name = strings.TrimSuffix(name, "_APKPure")
	if idx := strings.LastIndex(name, "_"); idx >= 0 {
		name = name[idx+1:]
	}
	if name == "" {
		return Version{}, fmt.Errorf("version name not found in filename %q", filename)
	}

	var size uint64
	if rawSize := query.Get("full_size"); rawSize != "" {
		size, _ = strconv.ParseUint(rawSize, 10, 64)
	}

	return Version{
		Name:        name,
		Code:        code,
		Size:        size,
		PackageName: packageName,
		Type:        fileType,
	}, nil
}

func parseVersionCodeText(rawText string) (int, error) {
	versionCodeText := strings.TrimSpace(rawText)
	if versionCodeText == "" {
		return 0, errors.New("version code is empty")
	}
	versionCode, err := strconv.Atoi(versionCodeText)
	if err != nil {
		return 0, fmt.Errorf("invalid version code %q: %w", versionCodeText, err)
	}
	if versionCode <= 0 {
		return 0, fmt.Errorf("invalid version code %q: must be positive", versionCodeText)
	}
	return versionCode, nil
}

func parseApkPureFileType(ext string) (FileType, error) {
	switch strings.ToLower(ext) {
	case ".apk":
		return APK, nil
	case ".xapk":
		return XAPK, nil
	default:
		return "", fmt.Errorf("unknown file type: %q", ext)
	}
}

// Download re-requests the d.apkpure.com link so the signed CDN token is fresh.
func (s *ApkPure) Download(version Version) (*DownloadStream, error) {
	if version.Link == "" {
		return nil, errors.New("empty download link")
	}
	req, err := s.NewRequest("GET", version.Link, nil)
	if err != nil {
		return nil, err
	}
	return createResponseReader(s.Http(), req)
}

func defaultApkPureConfig() ApkPureConfig {
	return ApkPureConfig{
		BaseSourceConfig: BaseSourceConfig{
			BaseURL: "https://d.apkpure.com",
		},
	}
}

func newApkPureSource() (Source, error) {
	s := &ApkPure{}
	s.Source = s
	config, err := ResolveSourceConfig(s.Name(), defaultApkPureConfig())
	if err != nil {
		return nil, fmt.Errorf("failed to decode apkpure config: %w", err)
	}
	s.config = config
	ua, err := fakeUserAgent.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create fake user agent: %w", err)
	}
	// Cloudflare challenges short or non-Chrome UAs on this endpoint.
	randomUA := ua.Filter().Platform(fakeUserAgent.Desktop).Browser(fakeUserAgent.Chrome).Get()
	s.Log().Logd("Using User-Agent: " + randomUA)
	headers := ApplyConfiguredHeaders(http.Header{
		"User-Agent": {randomUA},
	}, config.Headers)
	s.Net = network.DefaultClientForSource(s.Name()).WithDefaultHeaders(headers)
	return s, nil
}

func init() {
	RegisterSourceFactoryWithConfig(newApkPureSource, "apkpure", NewConfigDecoderWithDefaults(
		defaultApkPureConfig(),
		func(c *ApkPureConfig) {
			NormalizeBaseSourceConfig(&c.BaseSourceConfig)
		},
		func(c ApkPureConfig) error {
			return ValidateBaseSourceConfig(c.BaseSourceConfig)
		},
	))
}
