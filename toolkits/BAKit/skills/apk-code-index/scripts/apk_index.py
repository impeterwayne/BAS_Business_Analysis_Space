#!/usr/bin/env python3
"""Index a jadx-decoded APK into small, citeable Markdown files for BA competitor analysis.

Orient with an index, not with the export: the decoded tree of a real app holds tens of thousands
of files, and reading it raw burns the context of whoever does it. This script reads the manifest,
the resources and the app's own source packages once, and writes a handful of files under 250
lines that a scout, the orchestrator and the device walker can share.

Commands
    build  <jadx_root> --out <dir>          write the index (screens, packages, endpoints, signals, tech)
    find   <jadx_root> <regex> [--scope app|all] [--limit N]
                                           map a flow keyword ("chuyển tiền|transfer") to string
                                           resources, the layouts that show them and the classes
                                           that reference them

Works on both jadx layouts: `--export-gradle` (app/src/main/{java,res,AndroidManifest.xml}) and the
default (sources/ + resources/). Standard library only; Python 3.8+.
"""

import argparse
import collections
import datetime
import os
import re
import sys
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ANDROID_NS = "{http://schemas.android.com/apk/res/android}"
APP_NS = "{http://schemas.android.com/apk/res-auto}"
MAX_LINES = 240

# Package prefixes of third-party SDKs and platform libraries. Presence of the directory means the
# SDK is bundled, not that it is used; say "bundled", never "uses".
SDK_MARKERS = collections.OrderedDict([
    ("Analytics / attribution", [
        "com/google/firebase/analytics", "com/appsflyer", "com/adjust/sdk", "io/branch",
        "com/mixpanel", "com/amplitude", "com/clevertap", "com/moengage", "com/segment",
        "com/braze", "com/appboy", "com/kochava", "com/singular", "com/umeng", "com/tencent/bugly",
        "com/facebook/appevents", "com/insider", "com/netcore", "com/webengage"]),
    ("Crash / performance", [
        "com/google/firebase/crashlytics", "io/sentry", "com/bugsnag", "com/newrelic",
        "com/datadog", "com/instabug", "com/google/firebase/perf"]),
    ("Remote config / experiments", [
        "com/google/firebase/remoteconfig", "com/optimizely", "com/launchdarkly",
        "com/statsig", "com/growthbook", "com/split"]),
    ("Push / messaging", [
        "com/google/firebase/messaging", "com/onesignal", "com/huawei/hms/push",
        "com/xiaomi/mipush", "com/pushwoosh", "io/intercom", "com/zendesk", "com/freshchat",
        "com/sendbird", "io/getstream"]),
    ("Ads / monetisation", [
        "com/google/android/gms/ads", "com/applovin", "com/unity3d/ads", "com/ironsource",
        "com/facebook/ads", "com/bytedance/sdk/openadsdk", "com/vungle", "com/mbridge",
        "com/inmobi", "com/chartboost", "com/revenuecat", "com/android/billingclient"]),
    ("Auth / identity", [
        "com/google/android/gms/auth", "com/facebook/login", "com/zing/zalo", "com/linecorp",
        "com/kakao", "com/microsoft/identity", "net/openid/appauth", "com/auth0",
        "androidx/biometric", "com/google/firebase/auth"]),
    ("Payments", [
        "com/stripe", "com/braintreepayments", "com/paypal", "com/razorpay", "com/adyen",
        "com/checkout", "vn/momo", "com/vnpay", "com/zalopay", "com/google/android/gms/wallet"]),
    ("Maps / location", [
        "com/google/android/gms/maps", "com/mapbox", "com/here", "com/google/android/libraries/places"]),
    ("eKYC / camera / scanning", [
        "com/google/mlkit", "com/google/zxing", "com/journeyapps", "com/regula", "com/onfido",
        "com/jumio", "ai/advance", "com/veriff", "com/fpt", "com/vnpt"]),
    ("Web / hybrid", [
        "com/getcapacitor", "org/apache/cordova", "com/facebook/react", "io/flutter",
        "com/tencent/smtt", "com/unity3d/player"]),
])

FRAMEWORK_MARKERS = [
    ("Flutter", ["io/flutter"]),
    ("React Native", ["com/facebook/react"]),
    ("Unity", ["com/unity3d/player"]),
    ("Xamarin / MAUI", ["mono/android", "crc64"]),
    ("Cordova / Capacitor", ["org/apache/cordova", "com/getcapacitor"]),
    ("Jetpack Compose", ["androidx/compose/ui"]),
]

# Not the app's own code even when an activity lives there.
LIBRARY_PREFIXES = (
    "android", "androidx", "kotlin", "kotlinx", "java", "javax", "dagger", "okhttp3", "okio",
    "retrofit2", "io/reactivex", "com/google", "com/facebook", "com/squareup", "com/bumptech",
    "org/jetbrains", "org/intellij", "org/apache", "org/json", "io/grpc", "com/fasterxml",
    "com/airbnb", "io/flutter", "com/unity3d", "com/microsoft", "com/huawei", "com/tencent",
    "com/bytedance", "com/appsflyer", "com/adjust", "io/branch", "com/mixpanel", "com/amplitude",
    "com/clevertap", "com/moengage", "com/onesignal", "io/sentry", "com/stripe", "com/paypal",
    "com/zing", "com/linecorp", "com/kakao", "com/journeyapps", "com/applovin", "com/ironsource",
    "com/mbridge", "com/vungle", "com/inmobi", "com/chartboost", "com/revenuecat", "com/yalantis",
    "com/github", "io/realm", "net/sqlcipher", "org/greenrobot", "com/jakewharton",
)

URL_RE = re.compile(r"""https?://[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+""")
RETROFIT_RE = re.compile(r"""@(GET|POST|PUT|DELETE|PATCH|HEAD)\(\s*(?:value\s*=\s*)?"([^"]*)"\s*\)""")
EVENT_RES = [
    re.compile(r"""\b(?:logEvent|trackEvent|track|recordEvent|sendEvent|logCustom|pushEvent)\(\s*"([A-Za-z0-9_.: -]{3,64})\""""),
    re.compile(r"""\bnew\s+\w*Event\w*\(\s*"([A-Za-z0-9_.: -]{3,64})\""""),
]
FLAG_RE = re.compile(r'''"((?:is_|enable_|disable_|show_|use_|ff_|feature_|exp_|ab_)?[a-z0-9]+(?:_[a-z0-9]+)*_(?:enabled|enable|disabled|flag|toggle|experiment|variant|switch)|(?:enable|disable|ff|feature|exp|ab)_[a-z0-9]+(?:_[a-z0-9]+)+)"''')
REMOTE_CONFIG_RE = re.compile(r'''\b(?:getBoolean|getString|getLong|getDouble|getValue)\(\s*"([a-z][a-z0-9_]{3,63})"\s*\)''')
BINDING_RE = re.compile(r"\b([A-Z][A-Za-z0-9]*?)Binding\.inflate\(")
EXTENDS_RE = re.compile(r"\bclass\s+([A-Za-z0-9_$]+)\s+extends\s+([A-Za-z0-9_.$]+)")
SKIP_URL_HOSTS = ("schemas.android.com", "www.w3.org", "ns.adobe.com", "xmlpull.org",
                  "www.apache.org", "apache.org/licenses", "xml.org", "purl.org", "json-schema.org")


# ---------------------------------------------------------------------------- layout discovery

def find_layout(root):
    """Return (manifest, res_dirs, source_roots) for a jadx output directory."""
    root = os.path.abspath(root)
    manifests, res_dirs, source_roots = [], [], []
    # Record source and res roots without descending into them: they hold most of the files.
    skip = {"lib", "assets", "build", "smali", "unknown", "META-INF", "kotlin"}
    for dirpath, dirnames, filenames in os.walk(root):
        depth = os.path.relpath(dirpath, root).count(os.sep)
        if "AndroidManifest.xml" in filenames:
            manifests.append(os.path.join(dirpath, "AndroidManifest.xml"))
        keep = []
        for d in dirnames:
            full = os.path.join(dirpath, d)
            if d in ("java", "sources"):
                source_roots.append(full)
            elif d == "res":
                if os.path.isdir(os.path.join(full, "values")):
                    res_dirs.append(full)
            elif d not in skip and not d.startswith(".") and depth < 4:
                keep.append(d)
        dirnames[:] = keep
    # The base manifest is the one with the most activities; split APKs carry stubs.
    best, best_count = None, -1
    for m in manifests:
        try:
            with open(m, "rb") as f:
                n = f.read().count(b"<activity")
        except OSError:
            continue
        if n > best_count:
            best, best_count = m, n
    return best, sorted(set(res_dirs), key=len), sorted(set(source_roots), key=len)


def iter_source_files(source_roots, prefixes=None):
    """Yield (abs_path, rel_path_with_slashes) for .java/.kt files, optionally under package prefixes."""
    for sr in source_roots:
        starts = [os.path.join(sr, p.replace("/", os.sep)) for p in prefixes] if prefixes else [sr]
        for start in starts:
            if not os.path.isdir(start):
                continue
            for dirpath, _, filenames in os.walk(start):
                for fn in filenames:
                    if fn.endswith((".java", ".kt")) and fn != "R.java" and not fn.startswith("R$"):
                        full = os.path.join(dirpath, fn)
                        yield full, os.path.relpath(full, sr).replace(os.sep, "/")


def parse_xml(path):
    """Parse an XML file jadx wrote; it sometimes leaves whitespace before the declaration."""
    try:
        with open(path, "rb") as f:
            data = f.read().lstrip(b"\xef\xbb\xbf \t\r\n")
        return ET.fromstring(data)
    except (OSError, ET.ParseError):
        return None


def read_text(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return ""


def cite(path, root, line=None):
    rel = os.path.relpath(path, root).replace(os.sep, "/")
    return f"{rel}:{line}" if line else rel


def line_of(text, index):
    return text.count("\n", 0, index) + 1


# ---------------------------------------------------------------------------- manifest

def a(el, attr, ns=ANDROID_NS):
    return el.get(ns + attr) or el.get(attr) or ""


def gradle_dir_for(manifest):
    """app/ for a --export-gradle layout (app/src/main/AndroidManifest.xml)."""
    return os.path.dirname(os.path.dirname(os.path.dirname(manifest)))


def parse_manifest(path, gradle_dir=None):
    m = parse_xml(path)
    if m is None:
        sys.exit(f"Could not parse {path}")
    info = {
        "package": m.get("package", ""), "versionName": a(m, "versionName"),
        "versionCode": a(m, "versionCode"), "minSdk": "", "targetSdk": "",
        "application": "", "permissions": [], "activities": [], "services": [],
        "receivers": [], "providers": [], "meta": [], "launcher": [],
    }
    for us in m.findall("uses-sdk"):
        info["minSdk"], info["targetSdk"] = a(us, "minSdkVersion"), a(us, "targetSdkVersion")
    for p in m.findall("uses-permission") + m.findall("uses-permission-sdk-23"):
        info["permissions"].append(a(p, "name"))
    app = m.find("application")
    if app is None:
        return info
    info["application"] = a(app, "name")

    # gradle export moves package/version into build.gradle
    if gradle_dir and (not info["package"] or not info["versionName"]):
        for g in ("build.gradle", "build.gradle.kts"):
            text = read_text(os.path.join(gradle_dir, g))
            for key in ("applicationId", "namespace", "versionName", "versionCode", "minSdkVersion",
                        "targetSdkVersion", "minSdk", "targetSdk"):
                mm = re.search(key + r"""\s*=?\s*["']?([\w.]+)["']?""", text)
                if not mm:
                    continue
                k = {"applicationId": "package", "namespace": "package", "minSdkVersion": "minSdk",
                     "targetSdkVersion": "targetSdk"}.get(key, key)
                if not info.get(k):
                    info[k] = mm.group(1)

    pkg = info["package"]

    def full(name):
        if name.startswith("."):
            return pkg + name
        if "." not in name and pkg:
            return pkg + "." + name
        return name

    info["application"] = full(info["application"]) if info["application"] else ""
    for tag, bucket in (("activity", "activities"), ("activity-alias", "activities"),
                        ("service", "services"), ("receiver", "receivers"), ("provider", "providers")):
        for el in app.findall(tag):
            name = full(a(el, "name"))
            if any(e["name"] == name for e in info[bucket]):
                continue  # merged split manifests can declare a component twice
            entry = {"name": name, "exported": a(el, "exported"), "label": a(el, "label"),
                     "target": full(a(el, "targetActivity")) if tag == "activity-alias" else "",
                     "alias": tag == "activity-alias", "filters": []}
            for flt in el.findall("intent-filter"):
                actions = [a(x, "name") for x in flt.findall("action")]
                cats = [a(x, "name") for x in flt.findall("category")]
                datas = []
                for d in flt.findall("data"):
                    datas.append({k: a(d, k) for k in ("scheme", "host", "port", "path", "pathPrefix",
                                                       "pathPattern", "mimeType") if a(d, k)})
                entry["filters"].append({"actions": actions, "categories": cats, "data": datas})
                if "android.intent.action.MAIN" in actions and "android.intent.category.LAUNCHER" in cats:
                    info["launcher"].append(entry["target"] or name)
            info[bucket].append(entry)
    for md in app.findall("meta-data"):
        info["meta"].append(a(md, "name"))  # names only: values can be API keys
    return info


def deep_links(entry):
    """Expand an activity's VIEW/BROWSABLE filters into concrete URI templates."""
    out = []
    for flt in entry["filters"]:
        if "android.intent.action.VIEW" not in flt["actions"]:
            continue
        schemes = [d["scheme"] for d in flt["data"] if d.get("scheme")] or [""]
        hosts = [d["host"] + (":" + d["port"] if d.get("port") else "")
                 for d in flt["data"] if d.get("host")] or [""]
        paths = [d.get("path") or d.get("pathPrefix", "") + ("*" if d.get("pathPrefix") else "")
                 or d.get("pathPattern", "") for d in flt["data"]
                 if d.get("path") or d.get("pathPrefix") or d.get("pathPattern")] or [""]
        browsable = "android.intent.category.BROWSABLE" in flt["categories"]
        for s in schemes:
            if not s:
                continue
            for h in hosts:
                for p in paths:
                    uri = f"{s}://{h}{p}" if h else f"{s}:{p}"
                    out.append((uri, browsable))
    seen, uniq = set(), []
    for u in out:
        if u[0] not in seen:
            seen.add(u[0])
            uniq.append(u)
    return uniq


# ---------------------------------------------------------------------------- resources

def res_id(value):
    return value.replace("@+id/", "").replace("@id/", "")


def parse_navigation(res_dirs):
    graphs = []
    for rd in res_dirs:
        nav = os.path.join(rd, "navigation")
        if not os.path.isdir(nav):
            continue
        for fn in sorted(os.listdir(nav)):
            if not fn.endswith(".xml"):
                continue
            path = os.path.join(nav, fn)
            root = parse_xml(path)
            if root is None:
                continue
            dests = []
            for el in root.iter():
                tag = el.tag.split("}")[-1]
                if tag not in ("fragment", "dialog", "activity", "navigation") or el is root:
                    continue
                dest = {"kind": tag, "id": res_id(a(el, "id")),
                        "class": a(el, "name"), "label": a(el, "label"), "actions": [], "links": []}
                for child in el:
                    ctag = child.tag.split("}")[-1]
                    if ctag == "action":
                        dest["actions"].append(res_id(a(child, "destination", APP_NS)))
                    elif ctag == "deepLink":
                        dest["links"].append(a(child, "uri", APP_NS))
                dests.append(dest)
            graphs.append({"file": path, "start": res_id(a(root, "startDestination", APP_NS)),
                           "dests": dests})
    return graphs


def load_strings(res_dirs, locale_dirs=None):
    """Return {(name, qualifier): (value, path)} for strings.xml in values / values-xx."""
    out = {}
    for rd in res_dirs:
        for d in sorted(os.listdir(rd)):
            if not (d == "values" or d.startswith("values-")):
                continue
            if locale_dirs is not None and d not in locale_dirs:
                continue
            path = os.path.join(rd, d, "strings.xml")
            if not os.path.isfile(path):
                continue
            root = parse_xml(path)
            if root is None:
                continue
            for s in root.findall("string"):
                name = s.get("name")
                if name:
                    out[(name, d)] = ("".join(s.itertext()).strip(), path)
    return out


def load_public_ids(res_dirs):
    """{int id: (type, name)} from res/values/public.xml, to resolve numeric ids left by --no-replace-consts."""
    ids = {}
    for rd in res_dirs:
        root = parse_xml(os.path.join(rd, "values", "public.xml"))
        if root is None:
            continue
        for el in root.findall("public"):
            try:
                ids[int(el.get("id", ""), 16)] = (el.get("type"), el.get("name"))
            except ValueError:
                pass
    return ids


def layout_names(res_dirs):
    names = set()
    for rd in res_dirs:
        for d in os.listdir(rd):
            if d.startswith("layout"):
                names.update(fn[:-4] for fn in os.listdir(os.path.join(rd, d)) if fn.endswith(".xml"))
    return names


RES_FIELD_RE = re.compile(r"\.([a-z][a-z0-9]*_[a-z0-9_]+)\b")
RES_NUM_RE = re.compile(r"\b(0x7f[0-9a-fA-F]{6}|21[0-9]{8})\b")


def res_refs(text, kind, names, public_ids):
    """Resource names of one type a source file references: `R.layout.x`, an obfuscated R class
    (`AbstractC13406f.activity_main`) or a raw numeric id."""
    found = [m for m in RES_FIELD_RE.findall(text) if m in names]
    for num in RES_NUM_RE.findall(text):
        v = public_ids.get(int(num, 16) if num.startswith("0x") else int(num))
        if v and v[0] == kind:
            found.append(v[1])
    return list(dict.fromkeys(found))


# ---------------------------------------------------------------------------- packages

def package_inventory(source_roots, depth=3):
    counts = collections.Counter()
    for sr in source_roots:
        for dirpath, _, filenames in os.walk(sr):
            n = sum(1 for f in filenames if f.endswith((".java", ".kt")))
            if not n:
                continue
            rel = os.path.relpath(dirpath, sr).replace(os.sep, "/")
            counts["/".join(rel.split("/")[:depth])] += n
    return counts


def is_library(prefix):
    return any(prefix == p or prefix.startswith(p + "/") for p in LIBRARY_PREFIXES)


def app_prefixes(info, source_roots):
    """Packages that hold the app's own code.

    Seeds are the manifest package and the launcher activities; the Application class is not a seed
    because license and packer wrappers (pairip, Jiagu) replace it. An activity package counts only
    when it shares its first two segments with a seed, so bundled ad and billing SDKs stay out.
    """
    seeds = []
    for n in info["launcher"]:
        parts = n.split(".")[:-1]
        if len(parts) >= 2:
            seeds.append(parts)
    if info["package"]:
        seeds.append(info["package"].split("."))
    roots2 = {"/".join(p[:2]) for p in seeds}
    votes = collections.Counter()
    for parts in seeds:
        votes["/".join(parts[:3])] += 5
    for e in info["activities"]:
        parts = e["name"].split(".")[:-1]
        if len(parts) >= 2 and "/".join(parts[:2]) in roots2:
            votes["/".join(parts[:3])] += 1
    found = []
    for p, _ in votes.most_common(8):
        if is_library(p):
            continue
        # Collapse to an existing directory, widening to two segments if three does not exist.
        for cand in (p, "/".join(p.split("/")[:2])):
            if any(os.path.isdir(os.path.join(sr, cand.replace("/", os.sep))) for sr in source_roots):
                if cand not in found and not any(cand.startswith(f + "/") for f in found):
                    found = [f for f in found if not f.startswith(cand + "/")] + [cand]
                break
    return found


def detect(source_roots, markers):
    hits = []
    for label, prefixes in markers:
        present = [p for p in prefixes
                   if any(os.path.isdir(os.path.join(sr, p.replace("/", os.sep))) for sr in source_roots)]
        if present:
            hits.append((label, present))
    return hits


# ---------------------------------------------------------------------------- source scan

def scan_sources(root, source_roots, prefixes, class_index, layouts_known=frozenset(), public_ids=None):
    """One pass over the app's own sources: endpoints, events, flags, layouts per class, fragments."""
    endpoints = collections.OrderedDict()   # url/path -> first citation
    events = collections.OrderedDict()
    flags = collections.OrderedDict()
    class_layouts = {}
    fragments = []
    files = 0
    for full, rel in iter_source_files(source_roots, prefixes):
        files += 1
        text = read_text(full)
        cls = rel.rsplit(".", 1)[0].replace("/", ".")
        class_index.setdefault(cls.rsplit(".", 1)[-1], []).append(full)
        for mm in URL_RE.finditer(text):
            url = mm.group(0).rstrip(".,;)'\"")
            if any(h in url for h in SKIP_URL_HOSTS) or len(url) < 12:
                continue
            endpoints.setdefault(url, cite(full, root, line_of(text, mm.start())))
        for mm in RETROFIT_RE.finditer(text):
            key = f"{mm.group(1)} {mm.group(2)}"
            endpoints.setdefault(key, cite(full, root, line_of(text, mm.start())))
        for rx in EVENT_RES:
            for mm in rx.finditer(text):
                events.setdefault(mm.group(1), cite(full, root, line_of(text, mm.start())))
        for rx in (FLAG_RE, REMOTE_CONFIG_RE):
            for mm in rx.finditer(text):
                flags.setdefault(mm.group(1), cite(full, root, line_of(text, mm.start())))
        layouts = res_refs(text, "layout", layouts_known, public_ids or {}) + [
            name for name in (re.sub(r"(?<!^)(?=[A-Z])", "_", b).lower() for b in BINDING_RE.findall(text))
            if name in layouts_known]
        if layouts:
            class_layouts[cls] = list(dict.fromkeys(layouts))[:4]
        mm = EXTENDS_RE.search(text)
        if mm:
            parent = mm.group(2).rsplit(".", 1)[-1]
            # Base classes are often obfuscated (HomeFragment extends AbstractC16985d), so the
            # class's own name counts too.
            if mm.group(1).endswith("Fragment") or parent.endswith("Fragment"):
                fragments.append((cls, parent, cite(full, root, line_of(text, mm.start()))))
    return {"files": files, "endpoints": endpoints, "events": events, "flags": flags,
            "class_layouts": class_layouts, "fragments": fragments}


def class_file(name, source_roots):
    rel = name.replace(".", os.sep)
    for sr in source_roots:
        for ext in (".java", ".kt"):
            p = os.path.join(sr, rel + ext)
            if os.path.isfile(p):
                return p
    return None


# ---------------------------------------------------------------------------- writers

def write_md(path, lines):
    if len(lines) > MAX_LINES:
        extra = len(lines) - MAX_LINES
        lines = lines[:MAX_LINES] + ["", f"_… {extra} more lines cut to keep this file small. "
                                          "Use `apk_index.py find` or grep for the rest._"]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines).rstrip() + "\n")


def short(name, pkg):
    return name[len(pkg):] if pkg and name.startswith(pkg + ".") else name


def cmd_build(args):
    root = os.path.abspath(args.jadx_root)
    manifest, res_dirs, source_roots = find_layout(root)
    if not manifest:
        sys.exit(f"No AndroidManifest.xml under {root}: is this a jadx output directory?")
    os.makedirs(args.out, exist_ok=True)
    info = parse_manifest(manifest, gradle_dir_for(manifest))
    pkg = info["package"]
    prefixes = args.app_prefix or app_prefixes(info, source_roots)
    print(f"manifest: {manifest}\nres: {len(res_dirs)} dir(s)\nsources: {source_roots}\napp packages: {prefixes}")

    inv = package_inventory(source_roots)
    frameworks = detect(source_roots, FRAMEWORK_MARKERS)
    sdks = detect(source_roots, list(SDK_MARKERS.items()))
    class_index = {}
    public_ids = load_public_ids(res_dirs)
    scan = scan_sources(root, source_roots, prefixes, class_index, layout_names(res_dirs), public_ids) if prefixes else {
        "files": 0, "endpoints": {}, "events": {}, "flags": {}, "class_layouts": {}, "fragments": []}
    graphs = parse_navigation(res_dirs)
    strings = load_strings(res_dirs, {"values"})
    for (name, _), (value, _) in strings.items():
        for mm in URL_RE.finditer(value):
            scan["endpoints"].setdefault(mm.group(0), f"@string/{name}")
    today = datetime.date.today().isoformat()

    # ---- screens.md
    L = [f"# Screens: {pkg}", "",
         f"Generated {today} by `apk_index.py build` from `{cite(manifest, root)}`. "
         "Static evidence: a screen listed here exists in the code; it is not proof it is reachable.", "",
         "## Launcher", ""]
    L += [f"- `{x}`" for x in info["launcher"]] or ["- none declared"]
    L += ["", "## Deep links", "",
          "Open with mobilerun `open_deeplink(uri=..., package_name=...)`; replace `*` and `.*` with real values.", "",
          "| URI | Browsable | Activity |", "| :--- | :--- | :--- |"]
    dl_rows = 0
    for e in info["activities"]:
        for uri, browsable in deep_links(e):
            L.append(f"| `{uri}` | {'yes' if browsable else 'no'} | `{short(e['target'] or e['name'], pkg)}` |")
            dl_rows += 1
    for g in graphs:
        for d in g["dests"]:
            for link in d["links"]:
                L.append(f"| `{link}` | nav | `{short(d['class'], pkg)}` (nav `{d['id']}`) |")
                dl_rows += 1
    if not dl_rows:
        L.append("| none | | |")

    own = [e for e in info["activities"] if any(e["name"].replace(".", "/").startswith(p + "/") for p in prefixes)]
    lib = len(info["activities"]) - len(own)
    L += ["", f"## Activities of the app ({len(own)}; {lib} more belong to SDKs)", "",
          "Exported activities can be opened directly with mobilerun `start_app(app_id, activity=...)`; "
          "non-exported ones are reached only through the UI.", "",
          "| Activity | Exported | Layout | Source |", "| :--- | :--- | :--- | :--- |"]
    for e in own:
        name = e["target"] or e["name"]
        f = class_file(name, source_roots)
        lay = ", ".join(scan["class_layouts"].get(name, [])) or "-"
        has_view = any("android.intent.action.VIEW" in fl["actions"] for fl in e["filters"])
        exported = e["exported"] or ("true (implicit)" if e["filters"] else "false")
        L.append(f"| `{short(e['name'], pkg)}`{' (alias)' if e['alias'] else ''}{' [deep link]' if has_view else ''} "
                 f"| {exported} | {lay} | {cite(f, root) if f else '-'} |")
    if graphs:
        L += ["", "## Navigation graphs", ""]
        for g in graphs:
            L.append(f"### {os.path.basename(g['file'])} (start: `{g['start']}`)")
            L.append("")
            for d in g["dests"]:
                acts = ", ".join(x for x in d["actions"] if x) or "-"
                L.append(f"- `{d['id']}` {d['kind']} `{short(d['class'], pkg)}` → {acts}")
            L.append("")
    if scan["fragments"]:
        L += ["", f"## Fragments in app packages ({len(scan['fragments'])})", ""]
        for cls, parent, where in scan["fragments"][:120]:
            lay = ", ".join(scan["class_layouts"].get(cls, [])) or "-"
            L.append(f"- `{short(cls, pkg)}` ({parent}) layout {lay} — {where}")
    write_md(os.path.join(args.out, "screens.md"), L)

    # ---- packages.md
    L = [f"# Packages: {pkg}", "", f"App packages (scope of every scan): {', '.join('`'+p+'`' for p in prefixes) or 'none found'}", "",
         "Feature areas usually show up as sub-packages of the app package (`.../transfer`, `.../kyc`).", "",
         "## App sub-packages by size", "", "| Package | Source files |", "| :--- | ---: |"]
    sub = collections.Counter()
    for sr in source_roots:
        for p in prefixes:
            base = os.path.join(sr, p.replace("/", os.sep))
            if not os.path.isdir(base):
                continue
            for dirpath, _, filenames in os.walk(base):
                n = sum(1 for f in filenames if f.endswith((".java", ".kt")))
                if n:
                    rel = os.path.relpath(dirpath, sr).replace(os.sep, "/").split("/")
                    sub["/".join(rel[:len(p.split('/')) + 2])] += n
    L += [f"| `{k}` | {v} |" for k, v in sub.most_common(80)]
    L += ["", "## Whole tree, top packages", "", "| Package | Source files | Kind |", "| :--- | ---: | :--- |"]
    for k, v in inv.most_common(60):
        kind = "app" if any(k == p or k.startswith(p + "/") or p.startswith(k + "/") for p in prefixes) else (
            "library" if is_library(k) else ("obfuscated" if len(k.split("/")[0]) <= 3 else "other"))
        L.append(f"| `{k}` | {v} | {kind} |")
    write_md(os.path.join(args.out, "packages.md"), L)

    # ---- endpoints.md
    by_host = collections.OrderedDict()
    for url, where in scan["endpoints"].items():
        mm = re.match(r"https?://([^/?#]+)", url)
        host = mm.group(1) if mm else "(relative API paths)"
        by_host.setdefault(host, []).append((url, where))
    L = [f"# Endpoints: {pkg}", "",
         "URL literals and Retrofit paths found in the app packages and default strings. "
         "Hosts hint at backend domains and partner services; a literal is present, not necessarily called.", ""]
    for host, rows in sorted(by_host.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        L += [f"## {host} ({len(rows)})", ""]
        L += [f"- `{u}` — {w}" for u, w in rows[:25]]
        if len(rows) > 25:
            L.append(f"- … {len(rows) - 25} more")
        L.append("")
    write_md(os.path.join(args.out, "endpoints.md"), L)

    # ---- signals.md
    L = [f"# Signals: {pkg}", "",
         "Analytics event names outline the funnel the competitor measures; config keys and flags show "
         "what they switch remotely or A/B test. Names are code evidence, not observed behaviour.", "",
         f"## Analytics events ({len(scan['events'])})", ""]
    L += [f"- `{k}` — {w}" for k, w in list(scan["events"].items())[:110]] or ["- none found"]
    L += ["", f"## Feature flags and remote-config keys ({len(scan['flags'])})", ""]
    L += [f"- `{k}` — {w}" for k, w in list(scan["flags"].items())[:110]] or ["- none found"]
    write_md(os.path.join(args.out, "signals.md"), L)

    # ---- tech.md
    L = [f"# Tech profile: {pkg}", "",
         "| Field | Value |", "| :--- | :--- |",
         f"| Package | `{pkg}` |", f"| Version | {info['versionName']} ({info['versionCode']}) |",
         f"| SDK | min {info['minSdk']} / target {info['targetSdk']} |",
         f"| Application class | `{info['application']}` |",
         f"| Frameworks | {', '.join(f for f, _ in frameworks) or 'native Android (View)'} |",
         f"| Components | {len(info['activities'])} activities, {len(info['services'])} services, "
         f"{len(info['receivers'])} receivers, {len(info['providers'])} providers |", ""]
    if any(f in ("Flutter", "React Native", "Unity", "Xamarin / MAUI") for f, _ in frameworks):
        L += ["> UI is drawn by a cross-platform runtime. Its screens are not Android activities, the "
              "accessibility tree may be empty or thin, and Java/Kotlin code says little about the UI: treat "
              "screenshots as primary evidence and rely on endpoints, strings and assets for the static side.", ""]
    L += ["## Bundled SDKs", "", "Presence of the package, not proof of use.", ""]
    for label, present in sdks:
        L.append(f"- **{label}**: {', '.join('`'+p+'`' for p in present)}")
    if not sdks:
        L.append("- none of the known markers")
    L += ["", f"## Permissions ({len(info['permissions'])})", ""]
    L += [f"- `{p.replace('android.permission.', '')}`" for p in info["permissions"]]
    L += ["", "## Manifest meta-data keys", "", "Names only; values are never copied (they can be API keys).", ""]
    L += [f"- `{x}`" for x in info["meta"][:60]]
    write_md(os.path.join(args.out, "tech.md"), L)

    # ---- _meta.md
    L = [f"# Code index: {pkg}", "",
         "| Field | Value |", "| :--- | :--- |",
         f"| Generated | {today} |", f"| jadx root | `{root}` |",
         f"| Manifest | `{cite(manifest, root)}` |",
         f"| Source roots | {', '.join('`'+cite(s, root)+'`' for s in source_roots)} |",
         f"| App packages | {', '.join('`'+p+'`' for p in prefixes)} |",
         f"| App source files scanned | {scan['files']} |",
         f"| Screens | {len(own)} activities, {len(scan['fragments'])} fragments, {dl_rows} deep links, {len(graphs)} nav graphs |",
         f"| Endpoints | {len(scan['endpoints'])} |", f"| Events / flags | {len(scan['events'])} / {len(scan['flags'])} |",
         f"| Default strings | {len(strings)} |", "",
         "| File | Holds |", "| :--- | :--- |",
         "| `screens.md` | launcher, deep links, activities + layouts, nav graphs, fragments |",
         "| `packages.md` | feature areas by package size |",
         "| `endpoints.md` | backend hosts and API paths |",
         "| `signals.md` | analytics events, feature flags, remote-config keys |",
         "| `tech.md` | version, frameworks, SDKs, permissions |",
         "", "Citations are paths relative to the jadx root, with line numbers."]
    write_md(os.path.join(args.out, "_meta.md"), L)
    print(f"wrote {args.out}: _meta.md screens.md packages.md endpoints.md signals.md tech.md")


def cmd_find(args):
    root = os.path.abspath(args.jadx_root)
    manifest, res_dirs, source_roots = find_layout(root)
    rx = re.compile(args.pattern, re.IGNORECASE)
    strings = load_strings(res_dirs)
    hits = collections.OrderedDict()
    for (name, qual), (value, path) in strings.items():
        if rx.search(value) or rx.search(name):
            hits.setdefault(name, []).append((qual, value, path))
    print(f"# find `{args.pattern}`\n")
    print(f"## String resources ({len(hits)})\n")
    for name, rows in list(hits.items())[:args.limit]:
        # Default, Vietnamese and English first: those are the languages BA deliverables quote.
        rows = sorted(rows, key=lambda r: (r[0] not in ("values", "values-vi", "values-en"), r[0]))
        vals = "; ".join(f"[{q}] {v[:80]}" for q, v, _ in rows[:3])
        print(f"- `@string/{name}` — {vals}")
    names = list(hits)[:args.limit]

    # Layouts that display those strings.
    if names:
        name_rx = re.compile(r"@string/(" + "|".join(map(re.escape, names)) + r")\b")
        print("\n## Layouts showing them\n")
        shown = 0
        for rd in res_dirs:
            for d in os.listdir(rd):
                if not d.startswith(("layout", "menu", "navigation", "xml")):
                    continue
                for fn in os.listdir(os.path.join(rd, d)):
                    p = os.path.join(rd, d, fn)
                    t = read_text(p)
                    for mm in name_rx.finditer(t):
                        print(f"- {cite(p, root, line_of(t, mm.start()))} — `@string/{mm.group(1)}`")
                        shown += 1
                        if shown >= args.limit:
                            break
        if not shown:
            print("- none (the strings may be set from code, or the UI is not XML)")

    # Code that references them, or matches the pattern directly.
    info = parse_manifest(manifest, gradle_dir_for(manifest)) if manifest else {
        "package": "", "activities": [], "application": "", "launcher": []}
    prefixes = None if args.scope == "all" else (args.app_prefix or app_prefixes(info, source_roots))
    public_ids = load_public_ids(res_dirs)
    wanted = set(names)
    print(f"\n## Code ({'all packages' if prefixes is None else ', '.join(prefixes)})\n")
    shown = 0
    for full, rel in iter_source_files(source_roots, prefixes):
        t = read_text(full)
        # R.string.x, an obfuscated R class (AbstractC13406f.x) or a raw id all resolve here.
        refs = res_refs(t, "string", wanted, public_ids) if wanted else []
        mm = rx.search(t)
        if refs or mm:
            pos = mm.start() if mm else t.find("." + refs[0])
            where = line_of(t, pos) if pos >= 0 else None
            what = ", ".join(f"@string/{r}" for r in refs[:3]) or mm.group(0)[:60]
            print(f"- {cite(full, root, where)} — `{what}`")
            shown += 1
        if shown >= args.limit:
            print(f"- … stopped at {args.limit}; narrow the pattern or raise --limit")
            break
    if not shown:
        print("- none")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build", help="write the code index")
    b.add_argument("jadx_root")
    b.add_argument("--out", required=True)
    b.add_argument("--app-prefix", action="append", help="app package dir, e.g. com/mservice (repeatable)")
    f = sub.add_parser("find", help="map a keyword to strings, layouts and classes")
    f.add_argument("jadx_root")
    f.add_argument("pattern")
    f.add_argument("--scope", choices=("app", "all"), default="app")
    f.add_argument("--limit", type=int, default=40)
    f.add_argument("--app-prefix", action="append")
    args = ap.parse_args()
    {"build": cmd_build, "find": cmd_find}[args.cmd](args)


if __name__ == "__main__":
    main()
