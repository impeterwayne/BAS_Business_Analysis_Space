package sources

import (
	neturl "net/url"
	"testing"
)

func TestParseVersionCodeText(t *testing.T) {
	if code, err := parseVersionCodeText(" 123 "); err != nil || code != 123 {
		t.Fatalf("expected 123, got %d %v", code, err)
	}
	for _, bad := range []string{"", "0", "-1", "abc"} {
		if _, err := parseVersionCodeText(bad); err == nil {
			t.Errorf("expected error for %q", bad)
		}
	}
}

func TestParseApkPureLocation(t *testing.T) {
	raw := "https://data.winudf.com/XAPK/Y29tLmJlYXV0eXBsdXMubWFrZXVwZmlsdGVyLnN3ZWV0Y2FtZXJhLnBob3RvXzMzX2FhMWFhMDA" +
		"?_p=Y29tLmJlYXV0eXBsdXMubWFrZXVwZmlsdGVyLnN3ZWV0Y2FtZXJhLnBob3Rv" +
		"&filename=Beauty+Camera+Sweet+Makeup+App_1.2.2_APKPure.xapk&full_size=95024440&is_hot=false"
	location, err := neturl.Parse(raw)
	if err != nil {
		t.Fatal(err)
	}
	v, err := parseApkPureLocation(location, "com.beautyplus.makeupfilter.sweetcamera.photo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if v.Code != 33 || v.Name != "1.2.2" || v.Type != XAPK || v.Size != 95024440 {
		t.Fatalf("unexpected version: %+v", v)
	}
}

func TestParseApkPureLocationApk(t *testing.T) {
	raw := "https://data.winudf.com/APK/b3JnLnRlbGVncmFtLm1lc3Nlbmdlcl83MTA1Ml8zZmY3YzgxMA" +
		"?filename=Telegram_12.10.5_APKPure.apk&full_size=37668135"
	location, _ := neturl.Parse(raw)
	v, err := parseApkPureLocation(location, "org.telegram.messenger")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if v.Code != 71052 || v.Name != "12.10.5" || v.Type != APK {
		t.Fatalf("unexpected version: %+v", v)
	}
}

func TestParseApkPureLocationRejectsVersionsPage(t *testing.T) {
	location, _ := neturl.Parse("https://apkpure.com/beauty-camera-sweet-makeup-app/com.beautyplus.makeupfilter.sweetcamera.photo/versions")
	if _, err := parseApkPureLocation(location, "com.beautyplus.makeupfilter.sweetcamera.photo"); err == nil {
		t.Fatal("expected error for versions page redirect")
	}
}

func TestParseApkPureLocationRejectsOtherPackage(t *testing.T) {
	location, _ := neturl.Parse("https://data.winudf.com/APK/b3JnLnRlbGVncmFtLm1lc3Nlbmdlcl83MTA1Ml8zZmY3YzgxMA?filename=Telegram_12.10.5_APKPure.apk")
	if _, err := parseApkPureLocation(location, "com.example"); err == nil {
		t.Fatal("expected error for mismatched package")
	}
}
