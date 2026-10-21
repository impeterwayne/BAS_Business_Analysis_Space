#!/usr/bin/env node

// src/index.ts
import { spawn as spawn4 } from "child_process";
import { fileURLToPath as fileURLToPath4 } from "url";

// src/utils/keycodes.ts
var KEYCODE_MAP = {
  HOME: 3,
  BACK: 4,
  CALL: 5,
  END_CALL: 6,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  CAMERA: 27,
  ENTER: 66,
  DELETE: 67,
  TAB: 61,
  MENU: 82,
  APP_SWITCH: 187,
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,
  WAKEUP: 224,
  SLEEP: 223,
  MEDIA_PLAY_PAUSE: 85,
  MEDIA_NEXT: 87,
  MEDIA_PREVIOUS: 88,
  BRIGHTNESS_UP: 221,
  BRIGHTNESS_DOWN: 220,
  NOTIFICATION: 83
};
function resolveKeycode(keycode) {
  if (typeof keycode === "number") {
    return keycode;
  }
  const upperKey = keycode.toUpperCase();
  if (KEYCODE_MAP[upperKey] !== void 0) {
    return KEYCODE_MAP[upperKey];
  }
  const parsed = parseInt(keycode, 10);
  if (isNaN(parsed)) {
    throw new Error(`Unknown keycode: ${keycode}`);
  }
  return parsed;
}

// src/cli/commands.ts
var ACTION_COMMANDS = /* @__PURE__ */ new Set([
  "tap",
  "swipe",
  "write",
  "key",
  "scroll",
  "screenshot",
  "ui-dump",
  "clipboard-get",
  "clipboard-set",
  "app-start",
  "app-stop",
  "app-list",
  "device-info",
  "device-list"
]);
function validateActionCommand(cmd, args) {
  if (!ACTION_COMMANDS.has(cmd)) {
    throw new Error(`Unsupported direct command: ${cmd}`);
  }
  if (cmd === "key") {
    resolveKeycode(args[0]);
  }
}

// src/cli/actions.ts
import * as fs3 from "fs";

// src/utils/adb.ts
import * as fs2 from "fs";
import * as path2 from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";

// src/utils/constants.ts
var ADB_PATH = process.env.ADB_PATH || "adb";
var DEFAULT_TIMEOUT = 3e4;
var SCRCPY_SERVER_PORT = 27183;
var SCRCPY_SERVER_PATH_LOCAL = "/data/local/tmp/scrcpy-server.jar";
var SCRCPY_SERVER_VERSION = process.env.SCRCPY_SERVER_VERSION || "4.1";
var CONTROL_MSG_TYPE_INJECT_KEYCODE = 0;
var CONTROL_MSG_TYPE_INJECT_TEXT = 1;
var CONTROL_MSG_TYPE_INJECT_TOUCH_EVENT = 2;
var CONTROL_MSG_TYPE_INJECT_SCROLL_EVENT = 3;
var CONTROL_MSG_TYPE_GET_CLIPBOARD = 8;
var CONTROL_MSG_TYPE_SET_CLIPBOARD = 9;
var CONTROL_MSG_TYPE_START_APP = 16;
var DEVICE_MSG_TYPE_CLIPBOARD = 0;
var ACTION_DOWN = 0;
var ACTION_UP = 1;
var ACTION_MOVE = 2;
var TEXT_MAX_LENGTH = 300;
var JPEG_SOI = 65496;
var JPEG_EOI = 65497;
var MAX_JPEG_BUFFER_SIZE = 10 * 1024 * 1024;
var MAX_CLIPBOARD_BYTES = 1024 * 1024;
var CLIPBOARD_COPY_KEY_NONE = 0;
var DEVICE_META_SIZE = 76;
var DEVICE_NAME_OFFSET = 0;
var VIDEO_WIDTH_OFFSET = 68;
var VIDEO_HEIGHT_OFFSET = 72;

// src/utils/config.ts
import * as fs from "fs";
import * as path from "path";
function loadWorkspaceConfig(startDir = process.cwd()) {
  let currentDir = startDir;
  while (true) {
    const rcPath = path.join(currentDir, ".scrcpyrc");
    if (fs.existsSync(rcPath)) {
      try {
        const content = fs.readFileSync(rcPath, "utf8");
        const parsed = JSON.parse(content);
        const config = {};
        if (parsed.serial && typeof parsed.serial === "string") {
          config.serial = parsed.serial;
        }
        if (parsed.port !== void 0) {
          const portNum = parseInt(parsed.port, 10);
          if (!isNaN(portNum)) {
            config.port = portNum;
          }
        }
        const parsedMaxSize = parsed.maxSize !== void 0 ? parsed.maxSize : parsed.max_size;
        if (parsedMaxSize !== void 0) {
          const val = parseInt(parsedMaxSize, 10);
          if (!isNaN(val)) {
            config.maxSize = val;
          }
        }
        const parsedMaxFps = parsed.maxFps !== void 0 ? parsed.maxFps : parsed.max_fps;
        if (parsedMaxFps !== void 0) {
          const val = parseInt(parsedMaxFps, 10);
          if (!isNaN(val)) {
            config.maxFps = val;
          }
        }
        const parsedVideoBitRate = parsed.videoBitRate !== void 0 ? parsed.videoBitRate : parsed.video_bit_rate;
        if (parsedVideoBitRate !== void 0) {
          const val = parseInt(parsedVideoBitRate, 10);
          if (!isNaN(val)) {
            config.videoBitRate = val;
          }
        }
        const parsedVideoEncoder = parsed.videoEncoder !== void 0 ? parsed.videoEncoder : parsed.video_encoder;
        if (parsedVideoEncoder && typeof parsedVideoEncoder === "string") {
          config.videoEncoder = parsedVideoEncoder;
        }
        if (config.serial || config.port !== void 0 || config.maxSize !== void 0 || config.maxFps !== void 0 || config.videoBitRate !== void 0 || config.videoEncoder !== void 0) {
          return config;
        }
      } catch {
      }
    }
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf8");
        const lines = content.split(/\r?\n/);
        const config = {};
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const index = trimmed.indexOf("=");
          if (index === -1) continue;
          const key = trimmed.substring(0, index).trim();
          const val = trimmed.substring(index + 1).trim();
          const cleanVal = val.replace(/^["']|["']$/g, "");
          if (key === "ANDROID_SERIAL") {
            config.serial = cleanVal;
          } else if (key === "SCRCPY_PORT" || key === "PORT") {
            const portNum = parseInt(cleanVal, 10);
            if (!isNaN(portNum)) {
              config.port = portNum;
            }
          } else if (key === "SCRCPY_MAX_SIZE" || key === "MAX_SIZE") {
            const sizeVal = parseInt(cleanVal, 10);
            if (!isNaN(sizeVal)) {
              config.maxSize = sizeVal;
            }
          } else if (key === "SCRCPY_MAX_FPS" || key === "MAX_FPS") {
            const fpsVal = parseInt(cleanVal, 10);
            if (!isNaN(fpsVal)) {
              config.maxFps = fpsVal;
            }
          } else if (key === "SCRCPY_VIDEO_BIT_RATE" || key === "VIDEO_BIT_RATE") {
            const rateVal = parseInt(cleanVal, 10);
            if (!isNaN(rateVal)) {
              config.videoBitRate = rateVal;
            }
          } else if (key === "SCRCPY_VIDEO_ENCODER" || key === "VIDEO_ENCODER") {
            config.videoEncoder = cleanVal;
          }
        }
        if (config.serial || config.port !== void 0 || config.maxSize !== void 0 || config.maxFps !== void 0 || config.videoBitRate !== void 0 || config.videoEncoder !== void 0) {
          return config;
        }
      } catch {
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return {};
}

// src/utils/adb.ts
var execFileAsync = promisify(execFile);
function getAdbPath() {
  if (process.env.ADB_PATH && fs2.existsSync(process.env.ADB_PATH)) {
    return process.env.ADB_PATH;
  }
  const baseDir = import.meta.dirname || path2.dirname(fileURLToPath(import.meta.url));
  const binName = process.platform === "win32" ? "adb.exe" : "adb";
  const candidateDirs = [
    path2.resolve(baseDir, "../vendor/scrcpy"),
    path2.resolve(baseDir, "../../vendor/scrcpy"),
    path2.resolve(baseDir, "../../../vendor/scrcpy"),
    path2.resolve(baseDir, "./vendor/scrcpy"),
    path2.resolve(process.cwd(), "vendor/scrcpy"),
    path2.resolve(baseDir, "../vendor"),
    path2.resolve(baseDir, "../../vendor"),
    path2.resolve(baseDir, "../../../vendor"),
    path2.resolve(baseDir, "./vendor"),
    path2.resolve(process.cwd(), "vendor")
  ];
  for (const dir of candidateDirs) {
    const candidate = path2.join(dir, binName);
    if (fs2.existsSync(candidate)) {
      return candidate;
    }
  }
  return ADB_PATH;
}
async function execAdb(args, timeout = DEFAULT_TIMEOUT) {
  const adbBin = getAdbPath();
  try {
    const { stdout, stderr } = await execFileAsync(adbBin, args, {
      timeout,
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true
    });
    return { stdout: stdout.toString(), stderr: stderr.toString() };
  } catch (error) {
    const err = error;
    throw new Error(
      `ADB command failed: ${adbBin} ${args.join(" ")}
${err.stderr || err.message || String(error)}`,
      { cause: error }
    );
  }
}
async function execAdbRaw(args, timeout = DEFAULT_TIMEOUT) {
  const adbBin = getAdbPath();
  return new Promise((resolve4, reject) => {
    const chunks = [];
    const proc = execFile(adbBin, args, {
      timeout,
      maxBuffer: 50 * 1024 * 1024,
      encoding: "buffer",
      windowsHide: true
    });
    proc.stdout?.on("data", (chunk) => {
      chunks.push(chunk);
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve4(Buffer.concat(chunks));
      } else {
        reject(new Error(`ADB command exited with code ${code}`));
      }
    });
    proc.on("error", (err) => {
      reject(err);
    });
  });
}
async function execAdbShell(serial, command, timeout) {
  const { stdout } = await execAdb(["-s", serial, "shell", command], timeout);
  return stdout.trim();
}
async function getDevices() {
  const { stdout } = await execAdb(["devices", "-l"]);
  const lines = stdout.trim().split("\n").slice(1);
  const devices = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(
      /^(\S+)\s+(\S+)\s+(.*)$/
    );
    if (match) {
      const serial = match[1];
      const state = match[2];
      const info = match[3] || "";
      const modelMatch = info.match(/model:(\S+)/);
      const productMatch = info.match(/product:(\S+)/);
      const transportIdMatch = info.match(/transport_id:(\d+)/);
      devices.push({
        serial,
        state,
        model: modelMatch?.[1],
        product: productMatch?.[1],
        transportId: transportIdMatch?.[1]
      });
    }
  }
  return devices;
}
async function resolveSerial(serial) {
  if (serial) {
    return serial;
  }
  const envSerial = process.env.ANDROID_SERIAL;
  if (envSerial) {
    return envSerial;
  }
  const config = loadWorkspaceConfig();
  if (config.serial) {
    return config.serial;
  }
  const devices = await getDevices();
  if (devices.length === 0) {
    throw new Error("No Android devices connected");
  }
  const authorizedDevices = devices.filter((d) => d.state === "device");
  if (authorizedDevices.length === 0) {
    const unauthorized = devices.find((d) => d.state === "unauthorized");
    if (unauthorized) {
      throw new Error(
        `Device ${unauthorized.serial} is unauthorized. Please authorize USB debugging on the device.`
      );
    }
    throw new Error("No authorized Android devices connected");
  }
  if (authorizedDevices.length > 1) {
    const serials = authorizedDevices.map((d) => d.serial).join(", ");
    throw new Error(
      `Multiple devices connected. Specify serial parameter. Available: [${serials}]`
    );
  }
  return authorizedDevices[0].serial;
}
async function getScreenSize(serial) {
  const output = await execAdbShell(serial, "wm size");
  const match = output.match(/Physical size:\s*(\d+)x(\d+)/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10)
    };
  }
  const overrideMatch = output.match(/Override size:\s*(\d+)x(\d+)/);
  if (overrideMatch) {
    return {
      width: parseInt(overrideMatch[1], 10),
      height: parseInt(overrideMatch[2], 10)
    };
  }
  throw new Error(`Could not parse screen size from output: ${output}`);
}
async function getDeviceProperty(serial, property) {
  return execAdbShell(serial, `getprop ${property}`);
}

// src/utils/clipboard.ts
async function getClipboardViaAdb(serial) {
  try {
    const sdkStr = await getDeviceProperty(serial, "ro.build.version.sdk");
    const sdkLevel = parseInt(sdkStr, 10);
    if (!isNaN(sdkLevel) && sdkLevel >= 31) {
      const result = await execAdbShell(serial, "cmd clipboard get");
      if (result && !result.includes("not found") && !result.includes("Error")) {
        return result.trim();
      }
    }
    const serviceResult = await execAdbShell(serial, "service call clipboard 2");
    if (serviceResult) {
      let text = null;
      let match = serviceResult.match(/result=0[^)]*\)\s*(.+)/i);
      if (match && match[1]) {
        text = match[1].trim();
      }
      if (!text) {
        match = serviceResult.match(/"([^"]*)"/);
        if (match && match[1]) {
          text = match[1];
        }
      }
      if (!text) {
        match = serviceResult.match(/0x([0-9a-fA-F]+)/);
        if (match && match[1]) {
          try {
            text = Buffer.from(match[1], "hex").toString("utf8");
          } catch {
            text = null;
          }
        }
      }
      if (text) {
        text = text.replace(
          /\\(\d{3})/g,
          (_, oct) => String.fromCharCode(parseInt(oct, 8))
        );
        return text;
      }
    }
    return null;
  } catch {
    return null;
  }
}
async function setClipboardViaAdb(serial, text) {
  try {
    const sdkStr = await getDeviceProperty(serial, "ro.build.version.sdk");
    const sdkLevel = parseInt(sdkStr, 10);
    const base64Text = Buffer.from(text).toString("base64");
    if (!isNaN(sdkLevel) && sdkLevel >= 29) {
      await execAdbShell(serial, `echo "${base64Text}" | base64 -d | cmd clipboard set`);
      return true;
    }
    await execAdbShell(
      serial,
      `echo "${base64Text}" | base64 -d | xargs -0 am broadcast -a clipper.set -e text`
    );
    return true;
  } catch {
    return false;
  }
}

// src/daemon/client.ts
import * as http from "http";
function makeClientRequest(port, pathname, method, bodyParams = {}) {
  return new Promise((resolve4, reject) => {
    const serial = typeof bodyParams.serial === "string" ? bodyParams.serial : void 0;
    const query = method === "GET" && serial ? `?serial=${encodeURIComponent(serial)}` : "";
    const options = {
      hostname: "127.0.0.1",
      port,
      path: `${pathname}${query}`,
      method,
      headers: method === "POST" ? { "Content-Type": "application/json" } : {}
    };
    const req = http.request(options, (res) => {
      if (res.headers["content-type"]?.includes("image/")) {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve4({ type: "binary", mimeType: res.headers["content-type"], data: Buffer.concat(chunks) }));
        return;
      }
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve4(JSON.parse(data));
        } catch {
          resolve4(data);
        }
      });
    });
    req.on("error", (err) => reject(err));
    if (method === "POST") {
      req.write(JSON.stringify(bodyParams));
    }
    req.end();
  });
}
function checkDaemonActive(port) {
  return new Promise((resolve4) => {
    const socket = new http.ClientRequest({
      hostname: "127.0.0.1",
      port,
      path: "/device/list",
      method: "GET",
      timeout: 1e3
    });
    socket.on("response", () => resolve4(true));
    socket.on("error", () => resolve4(false));
    socket.on("timeout", () => resolve4(false));
    socket.end();
  });
}

// src/cli/actions.ts
async function routeToDaemon(cmd, args, port, serial) {
  switch (cmd) {
    case "tap": {
      const x = parseInt(args[0], 10);
      const y = parseInt(args[1], 10);
      return makeClientRequest(port, "/tap", "POST", { serial, x, y });
    }
    case "swipe": {
      const x1 = parseInt(args[0], 10);
      const y1 = parseInt(args[1], 10);
      const x2 = parseInt(args[2], 10);
      const y2 = parseInt(args[3], 10);
      const duration = args[4] ? parseInt(args[4], 10) : 300;
      return makeClientRequest(port, "/swipe", "POST", { serial, x1, y1, x2, y2, duration });
    }
    case "write": {
      return makeClientRequest(port, "/write", "POST", { serial, text: args.join(" ") });
    }
    case "key": {
      return makeClientRequest(port, "/key", "POST", { serial, keycode: args[0] });
    }
    case "scroll": {
      const x = parseInt(args[0], 10);
      const y = parseInt(args[1], 10);
      const dx = parseFloat(args[2]);
      const dy = parseFloat(args[3]);
      return makeClientRequest(port, "/scroll", "POST", { serial, x, y, dx, dy });
    }
    case "screenshot": {
      const filepath = args[0] || "screenshot.png";
      const res = await makeClientRequest(port, "/screenshot", "GET", { serial });
      if (res && res.type === "binary") {
        fs3.writeFileSync(filepath, res.data);
        return { status: "success", message: `Screenshot saved to ${filepath}` };
      }
      return res;
    }
    case "ui-dump": {
      const filepath = args[0] || "ui-dump.xml";
      const res = await makeClientRequest(port, "/ui-dump", "GET", { serial });
      if (res.xml) {
        fs3.writeFileSync(filepath, res.xml, "utf8");
        return { status: "success", message: `UI hierarchy saved to ${filepath}` };
      }
      return res;
    }
    case "clipboard-get": {
      return makeClientRequest(port, "/clipboard/get", "GET", { serial });
    }
    case "clipboard-set": {
      return makeClientRequest(port, "/clipboard/set", "POST", { serial, text: args.join(" ") });
    }
    case "app-start": {
      return makeClientRequest(port, "/app/start", "POST", { serial, packageName: args[0] });
    }
    case "app-stop": {
      return makeClientRequest(port, "/app/stop", "POST", { serial, packageName: args[0] });
    }
    case "app-list": {
      return makeClientRequest(port, "/app/list", "GET", { serial });
    }
    case "device-info": {
      return makeClientRequest(port, "/device/info", "GET", { serial });
    }
    case "device-list": {
      return makeClientRequest(port, "/device/list", "GET");
    }
    default:
      throw new Error(`Unsupported daemon command: ${cmd}`);
  }
}
async function executeDirectAdb(cmd, args, serial) {
  console.log(`[scrcpy-cli] Daemon offline. Executing direct ADB command for "${cmd}"...`);
  switch (cmd) {
    case "tap": {
      const x = parseInt(args[0], 10);
      const y = parseInt(args[1], 10);
      await execAdbShell(serial, `input tap ${x} ${y}`);
      return { status: "success", method: "adb" };
    }
    case "swipe": {
      const x1 = parseInt(args[0], 10);
      const y1 = parseInt(args[1], 10);
      const x2 = parseInt(args[2], 10);
      const y2 = parseInt(args[3], 10);
      const duration = args[4] ? parseInt(args[4], 10) : 300;
      await execAdbShell(serial, `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
      return { status: "success", method: "adb" };
    }
    case "write": {
      const text = args.join(" ");
      const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/ /g, "%s");
      await execAdbShell(serial, `input text "${escaped}"`);
      return { status: "success", method: "adb" };
    }
    case "key": {
      const code = resolveKeycode(args[0]);
      await execAdbShell(serial, `input keyevent ${code}`);
      return { status: "success", method: "adb" };
    }
    case "scroll": {
      const x = parseInt(args[0], 10);
      const y = parseInt(args[1], 10);
      const dx = parseFloat(args[2]);
      const dy = parseFloat(args[3]);
      const duration = 300;
      const distance = 100;
      const endX = Math.max(0, Math.round(x + dx * distance));
      const endY = Math.max(0, Math.round(y + dy * distance));
      await execAdbShell(serial, `input swipe ${x} ${y} ${endX} ${endY} ${duration}`);
      return { status: "success", method: "adb" };
    }
    case "screenshot": {
      const filepath = args[0] || "screenshot.png";
      const pngBuffer = await execAdbRaw(["-s", serial, "exec-out", "screencap", "-p"]);
      fs3.writeFileSync(filepath, pngBuffer);
      return { status: "success", message: `Screenshot saved to ${filepath}` };
    }
    case "ui-dump": {
      const filepath = args[0] || "ui-dump.xml";
      const dumpRes = await execAdbShell(serial, "uiautomator dump");
      const match = dumpRes.match(/UI hierchary dumped to:\s*(\S+)/i) || dumpRes.match(/dumped to:\s*(\S+)/i);
      const remotePath = match ? match[1] : "/sdcard/window_dump.xml";
      const xml = await execAdbShell(serial, `cat ${remotePath}`);
      fs3.writeFileSync(filepath, xml, "utf8");
      return { status: "success", message: `UI hierarchy saved to ${filepath}` };
    }
    case "clipboard-get": {
      const text = await getClipboardViaAdb(serial);
      return { clipboard: text || "", source: "adb" };
    }
    case "clipboard-set": {
      const success = await setClipboardViaAdb(serial, args.join(" "));
      return { status: success ? "success" : "failed", method: "adb" };
    }
    case "app-start": {
      const cleanPkg = args[0].startsWith("+") ? args[0].slice(1) : args[0];
      if (args[0].startsWith("+")) {
        await execAdbShell(serial, `am force-stop ${cleanPkg}`);
      }
      await execAdbShell(serial, `monkey -p ${cleanPkg} -c android.intent.category.LAUNCHER 1`);
      return { status: "success", method: "adb" };
    }
    case "app-stop": {
      await execAdbShell(serial, `am force-stop ${args[0]}`);
      return { status: "success", method: "adb" };
    }
    case "app-list": {
      const stdout = await execAdbShell(serial, "pm list packages");
      const packages = stdout.split("\n").map((l) => l.replace(/^package:/, "").trim()).filter(Boolean);
      return { packages };
    }
    case "device-info": {
      const model = await getDeviceProperty(serial, "ro.product.model");
      const sdk = await getDeviceProperty(serial, "ro.build.version.sdk");
      const release = await getDeviceProperty(serial, "ro.build.version.release");
      const size = await getScreenSize(serial);
      return { serial, model, sdk, release, screenSize: size };
    }
    case "device-list": {
      const devices = await getDevices();
      return { devices };
    }
    default:
      throw new Error(`Unsupported direct command: ${cmd}`);
  }
}
function printResponse(res) {
  if (Buffer.isBuffer(res)) {
    process.stdout.write(res);
  } else {
    console.log(JSON.stringify(res, null, 2));
  }
}
function printHelp() {
  console.log(`
scrcpy-cli - Command Line Interface for Android device control

Usage:
  scrcpy-cli [options] <command> [args]

Options:
  -s, --serial <serial>          Target Android device serial
  --port <port>                  Daemon port (default: 27184)
  --max-size <size>              Max video size for scrcpy session
  --max-fps <fps>                Max video FPS for scrcpy session
  --video-bit-rate <rate>        Video bitrate for scrcpy session
  --video-encoder <encoder>      Video encoder for scrcpy session
Management Commands:
  update [version]               Update scrcpy binaries (default: latest GitHub release)
  version                        Show scrcpy-cli and scrcpy binary versions

Daemon Commands:
  daemon start                   Start background daemon
  daemon stop                    Stop background daemon
  daemon status                  Check daemon status
  daemon run                     Run daemon in foreground

Action Commands:
  mirror [scrcpy-args]           Launch desktop scrcpy mirror window (aliases: view, gui)
  tap <x> <y>                    Tap screen coordinate
  swipe <x1> <y1> <x2> <y2> [ms] Swipe from one point to another
  write <text>                   Type text on device
  key <keycode>                  Press keycode or named key
  scroll <x> <y> <dx> <dy>       Scroll at coordinate
  screenshot [file]              Save screenshot to file
  ui-dump [file]                 Save UI hierarchy XML
  clipboard-get                  Get clipboard text
  clipboard-set <text>           Set clipboard text
  app-start <package>            Start app package
  app-stop <package>             Stop app package
  app-list                       List installed packages
  device-info                    Show Android device information
  device-list                    List connected Android devices
`);
}

// src/daemon/server.ts
import * as http2 from "http";

// src/utils/scrcpy/protocol.ts
function serializeInjectKeycode(action, keycode, repeat = 0, metaState = 0) {
  const buffer = Buffer.alloc(14);
  let offset = 0;
  buffer.writeUInt8(CONTROL_MSG_TYPE_INJECT_KEYCODE, offset++);
  buffer.writeUInt8(action, offset++);
  buffer.writeInt32BE(keycode, offset);
  offset += 4;
  buffer.writeInt32BE(repeat, offset);
  offset += 4;
  buffer.writeInt32BE(metaState, offset);
  return buffer;
}
function serializeInjectText(text) {
  const textBytes = Buffer.from(text, "utf8");
  if (textBytes.length > TEXT_MAX_LENGTH) {
    throw new Error(`Text too long: ${textBytes.length} bytes (max ${TEXT_MAX_LENGTH})`);
  }
  const buffer = Buffer.alloc(5 + textBytes.length);
  let offset = 0;
  buffer.writeUInt8(CONTROL_MSG_TYPE_INJECT_TEXT, offset++);
  buffer.writeUInt32BE(textBytes.length, offset);
  offset += 4;
  textBytes.copy(buffer, offset);
  return buffer;
}
var floatToU16FP = (f) => {
  f = Math.max(0, Math.min(f, 1));
  const u = Math.round(f * 65536);
  return Math.min(u, 65535);
};
var floatToI16FP = (f) => {
  f = Math.max(-1, Math.min(f, 1));
  const i = Math.round(f * 32768);
  return Math.max(-32768, Math.min(i, 32767));
};
function serializeInjectTouchEvent(action, pointerId, x, y, screenWidth, screenHeight, pressure, buttons = 0, actionButton = 0) {
  const buffer = Buffer.alloc(32);
  buffer.writeUInt8(CONTROL_MSG_TYPE_INJECT_TOUCH_EVENT, 0);
  buffer.writeUInt8(action, 1);
  buffer.writeBigUInt64BE(BigInt.asUintN(64, pointerId), 2);
  buffer.writeInt32BE(x, 10);
  buffer.writeInt32BE(y, 14);
  buffer.writeUInt16BE(screenWidth, 18);
  buffer.writeUInt16BE(screenHeight, 20);
  buffer.writeUInt16BE(floatToU16FP(pressure), 22);
  buffer.writeUInt32BE(actionButton, 24);
  buffer.writeUInt32BE(buttons, 28);
  return buffer;
}
function serializeInjectScrollEvent(x, y, screenWidth, screenHeight, hScroll, vScroll, buttons = 0) {
  const buffer = Buffer.alloc(21);
  buffer.writeUInt8(CONTROL_MSG_TYPE_INJECT_SCROLL_EVENT, 0);
  buffer.writeInt32BE(x, 1);
  buffer.writeInt32BE(y, 5);
  buffer.writeUInt16BE(screenWidth, 9);
  buffer.writeUInt16BE(screenHeight, 11);
  const hNorm = Math.max(-1, Math.min(hScroll / 16, 1));
  const vNorm = Math.max(-1, Math.min(vScroll / 16, 1));
  buffer.writeInt16BE(floatToI16FP(hNorm), 13);
  buffer.writeInt16BE(floatToI16FP(vNorm), 15);
  buffer.writeUInt32BE(buttons, 17);
  return buffer;
}
function serializeGetClipboard(copyKey = CLIPBOARD_COPY_KEY_NONE) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt8(CONTROL_MSG_TYPE_GET_CLIPBOARD, 0);
  buffer.writeUInt8(copyKey, 1);
  return buffer;
}
function serializeSetClipboard(sequence, text, paste = false) {
  const textBytes = Buffer.from(text, "utf8");
  const buffer = Buffer.alloc(14 + textBytes.length);
  buffer.writeUInt8(CONTROL_MSG_TYPE_SET_CLIPBOARD, 0);
  buffer.writeBigUInt64BE(sequence, 1);
  buffer.writeUInt8(paste ? 1 : 0, 9);
  buffer.writeUInt32BE(textBytes.length, 10);
  textBytes.copy(buffer, 14);
  return buffer;
}
function serializeStartApp(packageName) {
  const nameBytes = Buffer.from(packageName, "utf8");
  if (nameBytes.length > 255) {
    throw new Error(`Package name too long: ${nameBytes.length} bytes (max 255)`);
  }
  const buffer = Buffer.alloc(2 + nameBytes.length);
  buffer.writeUInt8(CONTROL_MSG_TYPE_START_APP, 0);
  buffer.writeUInt8(nameBytes.length, 1);
  nameBytes.copy(buffer, 2);
  return buffer;
}

// src/utils/scrcpy/video.ts
import { spawn } from "child_process";
import * as fs4 from "fs";
import { createRequire } from "module";
var findFfmpeg = () => {
  if (process.env.FFMPEG_PATH && fs4.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  try {
    const ffmpegStatic = createRequire(import.meta.url)("ffmpeg-static");
    if (ffmpegStatic && fs4.existsSync(ffmpegStatic)) return ffmpegStatic;
  } catch {
  }
  return "ffmpeg";
};
function startVideoStream(session, videoSocket, initialData) {
  const ffmpegPath = findFfmpeg();
  const ffmpeg = spawn(ffmpegPath, [
    "-probesize",
    "1024",
    "-flags",
    "low_delay",
    "-f",
    "h264",
    "-i",
    "pipe:0",
    "-f",
    "image2pipe",
    "-vcodec",
    "mjpeg",
    "-q:v",
    "5",
    "-flush_packets",
    "1",
    "pipe:1"
  ], {
    windowsHide: true
  });
  session.videoProcess = ffmpeg;
  session.videoSocket = videoSocket;
  let jpegBuffer = Buffer.alloc(0);
  let firstFrameReceived = false;
  let resolveFirstFrame = null;
  let rejectFirstFrame = null;
  const firstFramePromise = new Promise((resolve4, reject) => {
    resolveFirstFrame = resolve4;
    rejectFirstFrame = reject;
  });
  const firstFrameTimeout = setTimeout(() => {
    if (!firstFrameReceived) {
      const msg = `[scrcpy] [${session.serial}] Timeout waiting for first video frame, proceeding without it`;
      console.error(msg);
      firstFrameReceived = true;
      resolveFirstFrame?.();
    }
  }, 1e4);
  ffmpeg.stdout?.on("data", (chunk) => {
    jpegBuffer = Buffer.concat([jpegBuffer, chunk]);
    if (jpegBuffer.length > MAX_JPEG_BUFFER_SIZE) {
      console.error(`[scrcpy] [${session.serial}] JPEG buffer exceeded max size, resetting`);
      jpegBuffer = Buffer.alloc(0);
      return;
    }
    let soiIdx = -1;
    for (let i = 0; i < jpegBuffer.length - 1; i++) {
      if (jpegBuffer.readUInt16BE(i) === JPEG_SOI) {
        soiIdx = i;
        break;
      }
    }
    if (soiIdx === -1) {
      return;
    }
    if (soiIdx > 0) {
      jpegBuffer = jpegBuffer.subarray(soiIdx);
    }
    while (jpegBuffer.length > 4) {
      let eoiIdx = -1;
      for (let i = 2; i < jpegBuffer.length - 1; i++) {
        if (jpegBuffer.readUInt16BE(i) === JPEG_EOI) {
          eoiIdx = i;
          break;
        }
      }
      if (eoiIdx === -1) {
        break;
      }
      const frame = jpegBuffer.subarray(0, eoiIdx + 2);
      session.frameBuffer = Buffer.from(frame);
      jpegBuffer = jpegBuffer.subarray(eoiIdx + 2);
      if (!firstFrameReceived) {
        firstFrameReceived = true;
        clearTimeout(firstFrameTimeout);
        const msg = `[scrcpy] [${session.serial}] First video frame received, session fully ready`;
        console.error(msg);
        resolveFirstFrame?.();
      }
    }
  });
  ffmpeg.stderr?.on("data", (data) => {
    console.error(`[scrcpy] [${session.serial}] ffmpeg stderr: ${data.toString().trim()}`);
  });
  ffmpeg.on("error", (err) => {
    console.error(`[scrcpy] ffmpeg error for ${session.serial}:`, err.message);
    if (session.videoSocket) {
      session.videoSocket.destroy();
      session.videoSocket = null;
    }
    session.frameBuffer = null;
    session.videoProcess = null;
    if (!firstFrameReceived) {
      firstFrameReceived = true;
      clearTimeout(firstFrameTimeout);
      rejectFirstFrame?.(err);
    }
  });
  ffmpeg.on("exit", (code) => {
    session.videoProcess = null;
    if (code !== 0 && code !== null) {
      console.error(`[scrcpy] ffmpeg exited with code ${code} for ${session.serial}`);
      if (session.videoSocket) {
        session.videoSocket.destroy();
        session.videoSocket = null;
      }
      session.frameBuffer = null;
      if (!firstFrameReceived) {
        firstFrameReceived = true;
        clearTimeout(firstFrameTimeout);
        rejectFirstFrame?.(new Error(`ffmpeg exited with code ${code}`));
      }
    }
  });
  videoSocket.on("error", (err) => {
    console.error(`[scrcpy] Video socket error for ${session.serial}:`, err.message);
    session.videoSocket = null;
  });
  videoSocket.on("close", () => {
    session.videoSocket = null;
  });
  if (ffmpeg.stdin) {
    ffmpeg.stdin.on("error", (err) => {
      if (err.code === "EPIPE") {
        console.error(`[scrcpy] ffmpeg stdin EPIPE for ${session.serial}`);
      } else {
        console.error(`[scrcpy] ffmpeg stdin error for ${session.serial}:`, err.message);
      }
    });
    const MAX_H264_BUFFER = 2 * 1024 * 1024;
    let streamBuffer = initialData && initialData.length > 0 ? initialData : Buffer.alloc(0);
    const processStream = () => {
      while (streamBuffer.length >= 12) {
        const packetSize = streamBuffer.readUInt32BE(8);
        const totalLength = 12 + packetSize;
        if (streamBuffer.length < totalLength) {
          break;
        }
        const packet = streamBuffer.subarray(12, totalLength);
        if (ffmpeg.stdin && !ffmpeg.stdin.destroyed) {
          try {
            ffmpeg.stdin.write(packet);
          } catch {
          }
        }
        session.h264Buffer = Buffer.concat([session.h264Buffer, packet]);
        if (session.h264Buffer.length > MAX_H264_BUFFER) {
          session.h264Buffer = session.h264Buffer.subarray(
            session.h264Buffer.length - MAX_H264_BUFFER
          );
        }
        if (session.viewerStdin) {
          const vs = session.viewerStdin;
          if (!vs.destroyed) {
            try {
              vs.write(packet);
            } catch {
              session.viewerStdin = null;
            }
          }
        }
        streamBuffer = streamBuffer.subarray(totalLength);
      }
    };
    processStream();
    videoSocket.on("data", (chunk) => {
      streamBuffer = Buffer.concat([streamBuffer, chunk]);
      processStream();
    });
  }
  return firstFramePromise;
}

// src/utils/scrcpy/server.ts
import { spawn as spawn3, execSync } from "child_process";
import * as fs7 from "fs";
import * as path5 from "path";
import * as net from "net";
import { fileURLToPath as fileURLToPath3 } from "url";

// src/utils/scrcpy/updater.ts
import { execFileSync as execFileSync2 } from "child_process";
import * as fs6 from "fs";
import * as path4 from "path";

// src/utils/scrcpy/client.ts
import { spawn as spawn2, execFileSync } from "child_process";
import * as fs5 from "fs";
import * as path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
function getPlatformAsset(version = SCRCPY_SERVER_VERSION) {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "win32") {
    return {
      name: `scrcpy-win64-v${version}.zip`,
      type: "zip",
      binName: "scrcpy.exe",
      subDir: `scrcpy-win64-v${version}`
    };
  } else if (platform === "darwin") {
    const isArm = arch === "arm64";
    const name = isArm ? `scrcpy-macos-aarch64-v${version}.tar.gz` : `scrcpy-macos-x86_64-v${version}.tar.gz`;
    return {
      name,
      type: "tar.gz",
      binName: "scrcpy",
      subDir: isArm ? `scrcpy-macos-aarch64-v${version}` : `scrcpy-macos-x86_64-v${version}`
    };
  } else if (platform === "linux") {
    return {
      name: `scrcpy-linux-x86_64-v${version}.tar.gz`,
      type: "tar.gz",
      binName: "scrcpy",
      subDir: `scrcpy-linux-x86_64-v${version}`
    };
  }
  return null;
}
function getBundledClientPaths() {
  const baseDir = import.meta.dirname || path3.dirname(fileURLToPath2(import.meta.url));
  const binName = process.platform === "win32" ? "scrcpy.exe" : "scrcpy";
  const relativeDirs = [
    path3.resolve(baseDir, "../vendor/scrcpy"),
    path3.resolve(baseDir, "../../vendor/scrcpy"),
    path3.resolve(baseDir, "../../../vendor/scrcpy"),
    path3.resolve(baseDir, "./vendor/scrcpy"),
    path3.resolve(process.cwd(), "vendor/scrcpy"),
    path3.resolve(baseDir, "../vendor"),
    path3.resolve(baseDir, "../../vendor"),
    path3.resolve(baseDir, "../../../vendor"),
    path3.resolve(baseDir, "./vendor"),
    path3.resolve(process.cwd(), "vendor"),
    path3.resolve(baseDir)
  ];
  const paths = [];
  for (const dir of relativeDirs) {
    paths.push(path3.join(dir, binName));
  }
  return paths;
}
function getCacheClientDir(version = SCRCPY_SERVER_VERSION) {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const cacheBase = process.env.XDG_CACHE_HOME || (process.env.LOCALAPPDATA ? path3.join(process.env.LOCALAPPDATA, "scrcpy-cli") : path3.join(homeDir, ".cache", "scrcpy-cli"));
  return path3.join(cacheBase, `client-v${version}`);
}
function findScrcpyClient() {
  const envPath = process.env.SCRCPY_PATH || process.env.SCRCPY_BIN;
  if (envPath && fs5.existsSync(envPath)) {
    return envPath;
  }
  for (const p of getBundledClientPaths()) {
    if (fs5.existsSync(p)) {
      return p;
    }
  }
  const runtimeInfo = getRuntimeVersionInfo();
  if (runtimeInfo?.clientPath && fs5.existsSync(runtimeInfo.clientPath)) {
    return runtimeInfo.clientPath;
  }
  const binName = process.platform === "win32" ? "scrcpy.exe" : "scrcpy";
  const cacheDir = getCacheClientDir();
  const cachedBin = path3.join(cacheDir, binName);
  if (fs5.existsSync(cachedBin)) {
    return cachedBin;
  }
  return null;
}
function extractArchive(archivePath, destDir, asset) {
  if (!fs5.existsSync(destDir)) {
    fs5.mkdirSync(destDir, { recursive: true });
  }
  const tempExtractDir = path3.join(destDir, "_temp_extract");
  if (fs5.existsSync(tempExtractDir)) {
    fs5.rmSync(tempExtractDir, { recursive: true, force: true });
  }
  fs5.mkdirSync(tempExtractDir, { recursive: true });
  try {
    if (asset.type === "zip") {
      if (process.platform === "win32") {
        execFileSync("tar", ["-xf", archivePath, "-C", tempExtractDir]);
      } else {
        execFileSync("unzip", ["-q", "-o", archivePath, "-d", tempExtractDir]);
      }
    } else {
      execFileSync("tar", ["-xzf", archivePath, "-C", tempExtractDir]);
    }
    const subDirPath = path3.join(tempExtractDir, asset.subDir);
    const sourceDir = fs5.existsSync(subDirPath) ? subDirPath : tempExtractDir;
    for (const item of fs5.readdirSync(sourceDir)) {
      const srcItem = path3.join(sourceDir, item);
      const dstItem = path3.join(destDir, item);
      if (fs5.existsSync(dstItem)) {
        fs5.rmSync(dstItem, { recursive: true, force: true });
      }
      fs5.cpSync(srcItem, dstItem, { recursive: true });
    }
  } finally {
    if (fs5.existsSync(tempExtractDir)) {
      fs5.rmSync(tempExtractDir, { recursive: true, force: true });
    }
  }
}
async function ensureScrcpyClient(version = SCRCPY_SERVER_VERSION) {
  const existing = findScrcpyClient();
  if (existing) {
    return existing;
  }
  const asset = getPlatformAsset(version);
  if (!asset) {
    throw new Error(
      `No prebuilt scrcpy client binary available for platform ${process.platform}/${process.arch}`
    );
  }
  const cacheDir = getCacheClientDir(version);
  const targetBin = path3.join(cacheDir, asset.binName);
  if (fs5.existsSync(targetBin)) {
    return targetBin;
  }
  const url = `https://github.com/Genymobile/scrcpy/releases/download/v${version}/${asset.name}`;
  const tempArchive = path3.join(cacheDir, `_download_${asset.name}`);
  console.error(`[scrcpy] Downloading scrcpy client v${version} (${asset.name})...`);
  try {
    if (!fs5.existsSync(cacheDir)) {
      fs5.mkdirSync(cacheDir, { recursive: true });
    }
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 1024) {
      throw new Error(`File size unexpectedly small (${buffer.length} bytes)`);
    }
    fs5.writeFileSync(tempArchive, buffer);
    console.error(`[scrcpy] Extracting scrcpy client to ${cacheDir}...`);
    extractArchive(tempArchive, cacheDir, asset);
    console.error(`[scrcpy] Successfully set up scrcpy client at ${targetBin}`);
    return targetBin;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `scrcpy client not found and automated download failed: ${message}. Please set SCRCPY_PATH environment variable or install scrcpy.`,
      { cause: error }
    );
  } finally {
    if (fs5.existsSync(tempArchive)) {
      fs5.rmSync(tempArchive, { force: true });
    }
  }
}
async function launchScrcpyClient(options = {}) {
  const { serial, args = [], detached = true, serverPath } = options;
  const clientPath = await ensureScrcpyClient();
  const scrcpyArgs = [];
  if (serial) {
    scrcpyArgs.push("-s", serial);
  }
  scrcpyArgs.push(...args);
  const clientDir = path3.dirname(clientPath);
  let resolvedServer = serverPath;
  if (!resolvedServer) {
    const clientServer = path3.join(clientDir, "scrcpy-server");
    const clientServerJar = path3.join(clientDir, "scrcpy-server.jar");
    if (fs5.existsSync(clientServer)) {
      resolvedServer = clientServer;
    } else if (fs5.existsSync(clientServerJar)) {
      resolvedServer = clientServerJar;
    } else {
      const runtimeInfo = getRuntimeVersionInfo();
      if (runtimeInfo?.serverPath && fs5.existsSync(runtimeInfo.serverPath)) {
        resolvedServer = runtimeInfo.serverPath;
      } else {
        const envServer = process.env.SCRCPY_SERVER_PATH;
        if (envServer && fs5.existsSync(envServer)) {
          resolvedServer = envServer;
        }
      }
    }
  }
  const childEnv = {
    ...process.env,
    PATH: `${clientDir}${path3.delimiter}${process.env.PATH || ""}`
  };
  if (resolvedServer) {
    childEnv.SCRCPY_SERVER_PATH = resolvedServer;
  } else {
    delete childEnv.SCRCPY_SERVER_PATH;
  }
  const child = spawn2(clientPath, scrcpyArgs, {
    detached,
    stdio: detached ? "ignore" : "inherit",
    cwd: clientDir,
    env: childEnv
  });
  if (detached) {
    child.unref();
  }
  return child;
}

// src/utils/scrcpy/updater.ts
function getRuntimeCacheDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const cacheBase = process.env.XDG_CACHE_HOME || (process.env.LOCALAPPDATA ? path4.join(process.env.LOCALAPPDATA, "scrcpy-cli") : path4.join(homeDir, ".cache", "scrcpy-cli"));
  return path4.join(cacheBase, "runtime");
}
function getRuntimeVersionConfigPath() {
  if (process.env.SCRCPY_RUNTIME_CONFIG) {
    return process.env.SCRCPY_RUNTIME_CONFIG;
  }
  return path4.join(getRuntimeCacheDir(), "version.json");
}
function getRuntimeVersionInfo() {
  const configPath = getRuntimeVersionConfigPath();
  if (!fs6.existsSync(configPath)) {
    return null;
  }
  try {
    const data = JSON.parse(fs6.readFileSync(configPath, "utf8"));
    if (data.version && data.serverPath && fs6.existsSync(data.serverPath)) {
      return data;
    }
  } catch {
  }
  return null;
}
async function fetchLatestScrcpyVersion() {
  const url = "https://api.github.com/repos/Genymobile/scrcpy/releases/latest";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "scrcpy-cli",
        "Accept": "application/vnd.github.v3+json"
      }
    });
    if (!res.ok) {
      throw new Error(`GitHub API returned HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.tag_name) {
      return data.tag_name.replace(/^v/, "");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[updater] Could not query latest GitHub release: ${msg}`);
  }
  return SCRCPY_SERVER_VERSION;
}
async function downloadFile(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download ${url} (HTTP ${res.status}: ${res.statusText})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 1024) {
    throw new Error(`Downloaded file too small (${buffer.length} bytes)`);
  }
  fs6.writeFileSync(dest, buffer);
  return buffer;
}
function extractArchive2(archivePath, destDir, asset) {
  if (!fs6.existsSync(destDir)) {
    fs6.mkdirSync(destDir, { recursive: true });
  }
  const tempExtractDir = path4.join(destDir, "_temp_extract");
  if (fs6.existsSync(tempExtractDir)) {
    fs6.rmSync(tempExtractDir, { recursive: true, force: true });
  }
  fs6.mkdirSync(tempExtractDir, { recursive: true });
  try {
    if (asset.type === "zip") {
      if (process.platform === "win32") {
        execFileSync2("tar", ["-xf", archivePath, "-C", tempExtractDir]);
      } else {
        execFileSync2("unzip", ["-q", "-o", archivePath, "-d", tempExtractDir]);
      }
    } else {
      execFileSync2("tar", ["-xzf", archivePath, "-C", tempExtractDir]);
    }
    const subDirPath = path4.join(tempExtractDir, asset.subDir);
    const sourceDir = fs6.existsSync(subDirPath) ? subDirPath : tempExtractDir;
    for (const item of fs6.readdirSync(sourceDir)) {
      const srcItem = path4.join(sourceDir, item);
      const dstItem = path4.join(destDir, item);
      if (fs6.existsSync(dstItem)) {
        fs6.rmSync(dstItem, { recursive: true, force: true });
      }
      fs6.cpSync(srcItem, dstItem, { recursive: true });
    }
  } finally {
    if (fs6.existsSync(tempExtractDir)) {
      fs6.rmSync(tempExtractDir, { recursive: true, force: true });
    }
  }
}
async function updateScrcpy(targetVersion) {
  const version = targetVersion ? targetVersion.replace(/^v/, "") : await fetchLatestScrcpyVersion();
  const runtimeDir = getRuntimeCacheDir();
  if (!fs6.existsSync(runtimeDir)) {
    fs6.mkdirSync(runtimeDir, { recursive: true });
  }
  const versionDir = path4.join(runtimeDir, `v${version}`);
  if (!fs6.existsSync(versionDir)) {
    fs6.mkdirSync(versionDir, { recursive: true });
  }
  let clientPath = null;
  let serverPath = path4.join(versionDir, "scrcpy-server");
  const asset = getPlatformAsset(version);
  if (asset) {
    const clientUrl = `https://github.com/Genymobile/scrcpy/releases/download/v${version}/${asset.name}`;
    const tempArchive = path4.join(versionDir, `_download_${asset.name}`);
    console.log(`[scrcpy update] Downloading scrcpy bundle v${version} (${asset.name})...`);
    try {
      await downloadFile(clientUrl, tempArchive);
      console.log(`[scrcpy update] Extracting scrcpy bundle...`);
      extractArchive2(tempArchive, versionDir, asset);
      const expectedBin = path4.join(versionDir, asset.binName);
      if (fs6.existsSync(expectedBin)) {
        clientPath = expectedBin;
      }
      if (fs6.existsSync(path4.join(versionDir, "scrcpy-server"))) {
        serverPath = path4.join(versionDir, "scrcpy-server");
      }
    } finally {
      if (fs6.existsSync(tempArchive)) {
        fs6.rmSync(tempArchive, { force: true });
      }
    }
  } else {
    const serverUrl = `https://github.com/Genymobile/scrcpy/releases/download/v${version}/scrcpy-server-v${version}`;
    console.log(`[scrcpy update] Downloading scrcpy-server v${version}...`);
    await downloadFile(serverUrl, serverPath);
  }
  const info = {
    version,
    clientPath,
    serverPath,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  fs6.writeFileSync(getRuntimeVersionConfigPath(), JSON.stringify(info, null, 2), "utf8");
  console.log(`[scrcpy update] Successfully updated scrcpy to v${version}`);
  return { version, clientPath, serverPath };
}

// src/utils/scrcpy/server.ts
function getBundledServerPaths() {
  const baseDir = import.meta.dirname || path5.dirname(fileURLToPath3(import.meta.url));
  const filenames = ["scrcpy-server.jar", "scrcpy-server"];
  const relativeDirs = [
    path5.resolve(baseDir, "../vendor/scrcpy"),
    path5.resolve(baseDir, "../../vendor/scrcpy"),
    path5.resolve(baseDir, "../../../vendor/scrcpy"),
    path5.resolve(baseDir, "./vendor/scrcpy"),
    path5.resolve(process.cwd(), "vendor/scrcpy"),
    path5.resolve(baseDir, "../vendor"),
    path5.resolve(baseDir, "../../vendor"),
    path5.resolve(baseDir, "../../../vendor"),
    path5.resolve(baseDir, "./vendor"),
    path5.resolve(process.cwd(), "vendor"),
    path5.resolve(baseDir)
  ];
  const paths = [];
  for (const dir of relativeDirs) {
    for (const name of filenames) {
      paths.push(path5.join(dir, name));
    }
  }
  return paths;
}
function getCacheServerPath(version = SCRCPY_SERVER_VERSION) {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const cacheBase = process.env.XDG_CACHE_HOME || (process.env.LOCALAPPDATA ? path5.join(process.env.LOCALAPPDATA, "scrcpy-cli") : path5.join(homeDir, ".cache", "scrcpy-cli"));
  return path5.join(cacheBase, `scrcpy-server-v${version}.jar`);
}
function findScrcpyServer() {
  const envPath = process.env.SCRCPY_SERVER_PATH;
  if (envPath && fs7.existsSync(envPath)) {
    return envPath;
  }
  for (const p of getBundledServerPaths()) {
    if (fs7.existsSync(p)) {
      return p;
    }
  }
  const runtimeInfo = getRuntimeVersionInfo();
  if (runtimeInfo?.serverPath && fs7.existsSync(runtimeInfo.serverPath)) {
    return runtimeInfo.serverPath;
  }
  const cachePath = getCacheServerPath();
  if (fs7.existsSync(cachePath)) {
    return cachePath;
  }
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const commonPaths = [
    "/usr/local/share/scrcpy/scrcpy-server",
    "/usr/share/scrcpy/scrcpy-server"
  ];
  if (homeDir) {
    commonPaths.unshift(path5.join(homeDir, ".local", "share", "scrcpy", "scrcpy-server"));
  }
  for (const p of commonPaths) {
    if (fs7.existsSync(p)) {
      return p;
    }
  }
  return null;
}
async function ensureScrcpyServer(version = SCRCPY_SERVER_VERSION) {
  const existing = findScrcpyServer();
  if (existing) {
    return existing;
  }
  const cachePath = getCacheServerPath(version);
  const cacheDir = path5.dirname(cachePath);
  if (!fs7.existsSync(cacheDir)) {
    fs7.mkdirSync(cacheDir, { recursive: true });
  }
  const url = `https://github.com/Genymobile/scrcpy/releases/download/v${version}/scrcpy-server-v${version}`;
  console.error(`[scrcpy] Downloading scrcpy-server v${version} from GitHub releases...`);
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 1024) {
      throw new Error(`File size unexpectedly small (${buffer.length} bytes)`);
    }
    fs7.writeFileSync(cachePath, buffer);
    console.error(`[scrcpy] Downloaded scrcpy-server to ${cachePath}`);
    return cachePath;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `scrcpy-server not found and automated download failed: ${message}. Please set SCRCPY_SERVER_PATH environment variable or check internet connection.`,
      { cause: error }
    );
  }
}
function detectScrcpyVersion(serverPath) {
  const envVersion = process.env.SCRCPY_SERVER_VERSION;
  if (envVersion) {
    return envVersion;
  }
  const activeServerPath = serverPath || findScrcpyServer();
  if (activeServerPath) {
    const runtimeInfo = getRuntimeVersionInfo();
    if (runtimeInfo && activeServerPath === runtimeInfo.serverPath) {
      return runtimeInfo.version;
    }
    const versionMatch = activeServerPath.match(/scrcpy-server-v(\d+\.\d+(?:\.\d+)?)/) || activeServerPath.match(/v(\d+\.\d+(?:\.\d+)?)/);
    if (versionMatch) {
      return versionMatch[1];
    }
    const isBundledOrCached = getBundledServerPaths().includes(activeServerPath) || activeServerPath.includes("vendor") || activeServerPath.includes(".cache") || activeServerPath.includes("scrcpy-cli");
    if (isBundledOrCached) {
      return SCRCPY_SERVER_VERSION;
    }
  }
  try {
    const output = execSync("scrcpy --version 2>/dev/null", {
      timeout: 5e3,
      encoding: "utf8"
    });
    const match = output.match(/scrcpy\s+(\d+\.\d+(?:\.\d+)?)/);
    if (match) {
      return match[1];
    }
  } catch {
  }
  return SCRCPY_SERVER_VERSION;
}
function generateScid() {
  return Math.floor(Math.random() * 2147483647) + 1;
}
function getSocketName(scid) {
  if (scid === -1) {
    return "scrcpy";
  }
  return `scrcpy_${scid.toString(16).padStart(8, "0")}`;
}
async function pushScrcpyServer(serial, serverPath) {
  await execAdb(["-s", serial, "push", serverPath, SCRCPY_SERVER_PATH_LOCAL], 3e4);
}
async function setupPortForwarding(serial, port, scid) {
  const socketName = getSocketName(scid);
  await execAdb(
    ["-s", serial, "forward", `tcp:${port}`, `localabstract:${socketName}`]
  );
}
async function removePortForwarding(serial, port) {
  try {
    await execAdb(["-s", serial, "forward", "--remove", `tcp:${port}`]);
  } catch {
  }
}
async function startScrcpyServer(serial, scid, options = {}, serverPath) {
  const {
    maxSize = 0,
    maxFps = 0,
    videoBitRate = 0,
    videoEncoder
  } = options;
  const version = detectScrcpyVersion(serverPath);
  console.error(`[scrcpy] Using scrcpy server version: ${version}`);
  const serverArgs = [
    "-s",
    serial,
    "shell",
    `CLASSPATH=${SCRCPY_SERVER_PATH_LOCAL}`,
    "app_process",
    "/",
    "com.genymobile.scrcpy.Server",
    version,
    `scid=${scid.toString(16).padStart(8, "0")}`,
    `log_level=verbose`
  ];
  if (maxSize > 0) {
    serverArgs.push(`max_size=${maxSize}`);
  }
  if (maxFps > 0) {
    serverArgs.push(`max_fps=${maxFps}`);
  }
  if (videoBitRate > 0) {
    serverArgs.push(`video_bit_rate=${videoBitRate}`);
  }
  if (videoEncoder) {
    serverArgs.push(`video_encoder=${videoEncoder}`);
  }
  serverArgs.push(
    "tunnel_forward=true",
    "audio=false"
  );
  return new Promise((resolve4, reject) => {
    const child = spawn3(getAdbPath(), serverArgs, {
      detached: true,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true
    });
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        const msg = data.toString().trim();
        if (msg) {
          console.error(`[scrcpy-server] ${msg}`);
        }
      });
    }
    child.once("error", (err) => {
      reject(new Error(
        `Failed to start scrcpy server for ${serial}: ${err.message}`,
        { cause: err }
      ));
    });
    child.once("spawn", () => {
      child.unref();
      resolve4();
    });
  });
}
var connectAndVerify = async (port, timeout = 1e4) => new Promise((resolve4, reject) => {
  const socket = net.createConnection({ port, host: "127.0.0.1" });
  let settled = false;
  const timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    socket.destroy();
    reject(new Error(`Connection timeout to port ${port}`));
  }, timeout);
  const fail = (err) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    socket.destroy();
    reject(err);
  };
  socket.on("error", (err) => fail(
    new Error(`Socket error connecting to port ${port}`, { cause: err })
  ));
  socket.on("connect", () => {
    socket.once("data", (chunk) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (chunk.length > 1) {
        socket.unshift(chunk.subarray(1));
      }
      socket.pause();
      resolve4(socket);
    });
    socket.once("close", () => fail(
      new Error("Socket closed before dummy byte received")
    ));
  });
});
var connectToServer = async (port, timeout = 1e4) => new Promise((resolve4, reject) => {
  const socket = net.createConnection({ port, host: "127.0.0.1" });
  const timer = setTimeout(() => {
    socket.destroy();
    reject(new Error(`Connection timeout to port ${port}`));
  }, timeout);
  socket.on("connect", () => {
    clearTimeout(timer);
    resolve4(socket);
  });
  socket.on("error", (err) => {
    clearTimeout(timer);
    reject(new Error(`Socket error connecting to port ${port}`, { cause: err }));
  });
});

// src/utils/scrcpy/session.ts
var sessions = /* @__PURE__ */ new Map();
function getSession(serial) {
  return sessions.get(serial);
}
function hasActiveSession(serial) {
  const session = sessions.get(serial);
  return !!session?.controlSocket && !session.controlSocket.destroyed;
}
function getLatestFrame(serial) {
  const session = sessions.get(serial);
  return session?.frameBuffer ?? null;
}
var receiveDeviceMeta = async (socket, port) => new Promise((resolve4, reject) => {
  const timer = setTimeout(() => {
    socket.off("data", onData);
    socket.off("error", onError);
    reject(new Error(`Timeout waiting for device metadata on port ${port}`));
  }, 1e4);
  let buffer = Buffer.alloc(0);
  const onData = (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    if (buffer.length >= DEVICE_META_SIZE) {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
      const deviceName = buffer.subarray(DEVICE_NAME_OFFSET, DEVICE_NAME_OFFSET + 64).toString("utf8").replace(/\0+$/, "");
      console.error(`[scrcpy] Device name: ${deviceName}`);
      const width = buffer.readUInt32BE(VIDEO_WIDTH_OFFSET);
      const height = buffer.readUInt32BE(VIDEO_HEIGHT_OFFSET);
      console.error(`[scrcpy] Screen size: ${width}x${height}`);
      const overflow = buffer.length > DEVICE_META_SIZE ? Buffer.from(buffer.subarray(DEVICE_META_SIZE)) : Buffer.alloc(0);
      resolve4({ width, height, overflow });
    }
  };
  const onError = (err) => {
    clearTimeout(timer);
    socket.off("data", onData);
    socket.off("error", onError);
    reject(new Error(
      `Socket error receiving device metadata on port ${port}`,
      { cause: err }
    ));
  };
  socket.on("data", onData);
  socket.on("error", onError);
  socket.resume();
});
var startDeviceMessageHandler = (session) => {
  if (!session.controlSocket) return;
  let messageBuffer = Buffer.alloc(0);
  session.controlSocket.on("data", (data) => {
    messageBuffer = Buffer.concat([messageBuffer, data]);
    while (messageBuffer.length >= 5) {
      const msgType = messageBuffer.readUInt8(0);
      if (msgType === DEVICE_MSG_TYPE_CLIPBOARD) {
        const textLength = messageBuffer.readUInt32BE(1);
        if (textLength > MAX_CLIPBOARD_BYTES) {
          console.error(
            `[scrcpy] [${session.serial}] Clipboard payload too large: ${textLength} bytes (max ${MAX_CLIPBOARD_BYTES}), resetting buffer`
          );
          messageBuffer = Buffer.alloc(0);
          break;
        }
        if (messageBuffer.length < 5 + textLength) break;
        const text = messageBuffer.toString("utf8", 5, 5 + textLength);
        session.clipboardContent = text;
        messageBuffer = messageBuffer.subarray(5 + textLength);
      } else {
        console.error(
          `[scrcpy] [${session.serial}] Unknown device message type: ${msgType}, resetting buffer`
        );
        messageBuffer = Buffer.alloc(0);
      }
    }
  });
};
async function startSession(serial, options = {}) {
  const serverPath = await ensureScrcpyServer();
  const s = await resolveSerial(serial);
  if (hasActiveSession(s)) {
    return sessions.get(s);
  }
  await pushScrcpyServer(s, serverPath);
  const port = SCRCPY_SERVER_PORT;
  const scid = generateScid();
  await setupPortForwarding(s, port, scid);
  try {
    await startScrcpyServer(s, scid, options, serverPath);
  } catch (err) {
    await removePortForwarding(s, port);
    throw err;
  }
  const connectTimeout = 1e4;
  const retryInterval = 100;
  const deadline = Date.now() + connectTimeout;
  let socket = null;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      socket = await connectAndVerify(port, 2e3);
      break;
    } catch (err) {
      lastError = err;
      await new Promise((resolve4) => setTimeout(resolve4, retryInterval));
    }
  }
  if (!socket) {
    try {
      await execAdbShell(s, `pkill -f scrcpy-server`);
    } catch {
    }
    try {
      await removePortForwarding(s, port);
    } catch {
    }
    throw new Error(
      `Failed to connect to scrcpy server on port ${port} within ${connectTimeout}ms`,
      { cause: lastError }
    );
  }
  let session = null;
  try {
    let controlSocket = null;
    let lastControlError = null;
    const controlConnectDeadline = Date.now() + 5e3;
    while (Date.now() < controlConnectDeadline) {
      try {
        const remaining = controlConnectDeadline - Date.now();
        if (remaining <= 0) break;
        controlSocket = await connectToServer(port, remaining);
        break;
      } catch (err) {
        lastControlError = err;
        await new Promise((resolve4) => setTimeout(resolve4, 100));
      }
    }
    if (!controlSocket) {
      socket.destroy();
      throw new Error(
        `Failed to connect control socket on port ${port} for device ${s} within timeout`,
        { cause: lastControlError }
      );
    }
    const { width, height, overflow } = await receiveDeviceMeta(socket, port);
    session = {
      serial: s,
      scid,
      controlSocket,
      videoSocket: socket,
      videoProcess: null,
      frameBuffer: null,
      screenSize: { width, height },
      clipboardContent: null,
      viewerProcess: null,
      viewerStdin: null,
      h264Buffer: Buffer.alloc(0)
    };
    const currentSession = session;
    sessions.set(s, currentSession);
    try {
      await startVideoStream(currentSession, socket, overflow);
    } catch (err) {
      const msg = `[scrcpy] Video stream failed for ${s}, session partially ready:`;
      console.error(msg, err.message);
    }
    controlSocket.on("close", () => {
      currentSession.controlSocket = null;
    });
    controlSocket.on("error", (err) => {
      console.error(`[scrcpy] Control socket error for ${s}:`, err.message);
      currentSession.controlSocket = null;
    });
    startDeviceMessageHandler(currentSession);
    return currentSession;
  } catch (err) {
    if (session) {
      sessions.delete(s);
    }
    socket.destroy();
    try {
      await execAdbShell(s, `pkill -f scrcpy-server`);
    } catch {
    }
    await removePortForwarding(s, port);
    throw err;
  }
}
async function stopSession(serial) {
  const s = await resolveSerial(serial);
  const session = sessions.get(s);
  if (!session) {
    return;
  }
  if (session.videoSocket) {
    session.videoSocket.destroy();
    session.videoSocket = null;
  }
  if (session.controlSocket) {
    session.controlSocket.destroy();
    session.controlSocket = null;
  }
  if (session.videoProcess) {
    session.videoProcess.kill();
    session.videoProcess = null;
  }
  if (session.viewerProcess && !session.viewerProcess.killed) {
    session.viewerProcess.kill();
  }
  session.viewerProcess = null;
  session.viewerStdin = null;
  try {
    await execAdbShell(s, `pkill -f scrcpy-server`);
  } catch {
  }
  await removePortForwarding(s, SCRCPY_SERVER_PORT);
  sessions.delete(s);
}

// src/utils/scrcpy/control.ts
function sendControlMessage(serial, message) {
  const session = getSession(serial);
  if (!session || !session.controlSocket || session.controlSocket.destroyed) {
    throw new Error(`No active scrcpy session for device ${serial}`);
  }
  session.controlSocket.write(message);
}
var clipboardSequence = BigInt(0);
function getNextClipboardSequence() {
  clipboardSequence = clipboardSequence + BigInt(1);
  return clipboardSequence;
}
async function getClipboardViaScrcpy(serial, timeout = 5e3) {
  const session = getSession(serial);
  if (!session || !session.controlSocket || session.controlSocket.destroyed) {
    throw new Error(`No active scrcpy session for device ${serial}`);
  }
  session.clipboardContent = null;
  const msg = serializeGetClipboard(CLIPBOARD_COPY_KEY_NONE);
  sendControlMessage(serial, msg);
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (session.clipboardContent !== null) {
      return session.clipboardContent;
    }
    await new Promise((resolve4) => setTimeout(resolve4, 50));
  }
  return null;
}
async function setClipboardViaScrcpy(serial, text, paste = false) {
  const session = getSession(serial);
  if (!session || !session.controlSocket || session.controlSocket.destroyed) {
    throw new Error(`No active scrcpy session for device ${serial}`);
  }
  const sequence = getNextClipboardSequence();
  const msg = serializeSetClipboard(sequence, text, paste);
  sendControlMessage(serial, msg);
}
async function startAppViaScrcpy(serial, packageName) {
  const session = getSession(serial);
  if (!session || !session.controlSocket || session.controlSocket.destroyed) {
    throw new Error(`No active scrcpy session for device ${serial}`);
  }
  const msg = serializeStartApp(packageName);
  sendControlMessage(serial, msg);
}

// src/daemon/server.ts
async function handlePostRequest(pathname, params) {
  const serial = await resolveSerial(params.serial);
  const config = loadWorkspaceConfig();
  const defaultMaxSize = config.maxSize !== void 0 ? config.maxSize : 0;
  const defaultMaxFps = config.maxFps !== void 0 ? config.maxFps : 0;
  const defaultVideoBitRate = config.videoBitRate !== void 0 ? config.videoBitRate : 0;
  const defaultVideoEncoder = config.videoEncoder;
  switch (pathname) {
    case "/session/start": {
      const maxSize = params.maxSize !== void 0 ? params.maxSize : defaultMaxSize;
      const maxFps = params.maxFps !== void 0 ? params.maxFps : defaultMaxFps;
      const videoBitRate = params.videoBitRate !== void 0 ? params.videoBitRate : defaultVideoBitRate;
      const videoEncoder = params.videoEncoder !== void 0 ? params.videoEncoder : defaultVideoEncoder;
      const session = await startSession(serial, {
        maxSize,
        maxFps,
        videoBitRate,
        videoEncoder
      });
      return { status: "connected", serial, screenSize: session.screenSize };
    }
    case "/session/stop": {
      await stopSession(serial);
      return { status: "stopped", serial };
    }
    case "/tap": {
      const { x, y } = params;
      if (x === void 0 || y === void 0) throw new Error("Missing x or y");
      if (!hasActiveSession(serial)) {
        await execAdbShell(serial, `input tap ${x} ${y}`);
        return { status: "success", method: "adb" };
      }
      const session = getSession(serial);
      const { width, height } = session.screenSize;
      sendControlMessage(
        serial,
        serializeInjectTouchEvent(ACTION_DOWN, BigInt(-2), x, y, width, height, 1)
      );
      await new Promise((resolve4) => setTimeout(resolve4, 10));
      sendControlMessage(
        serial,
        serializeInjectTouchEvent(ACTION_UP, BigInt(-2), x, y, width, height, 0)
      );
      return { status: "success", method: "scrcpy" };
    }
    case "/swipe": {
      const { x1, y1, x2, y2, duration = 300 } = params;
      if (x1 === void 0 || y1 === void 0 || x2 === void 0 || y2 === void 0) {
        throw new Error("Missing coordinates");
      }
      if (!hasActiveSession(serial)) {
        await execAdbShell(serial, `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
        return { status: "success", method: "adb" };
      }
      const session = getSession(serial);
      const { width, height } = session.screenSize;
      const steps = Math.max(2, Math.floor(duration / 16));
      const dx = (x2 - x1) / steps;
      const dy = (y2 - y1) / steps;
      const stepDelay = duration / steps;
      sendControlMessage(
        serial,
        serializeInjectTouchEvent(ACTION_DOWN, BigInt(-2), x1, y1, width, height, 1)
      );
      await new Promise((resolve4) => setTimeout(resolve4, stepDelay));
      for (let i = 1; i < steps; i++) {
        const x = Math.round(x1 + dx * i);
        const y = Math.round(y1 + dy * i);
        sendControlMessage(
          serial,
          serializeInjectTouchEvent(ACTION_MOVE, BigInt(-2), x, y, width, height, 1)
        );
        await new Promise((resolve4) => setTimeout(resolve4, stepDelay));
      }
      sendControlMessage(
        serial,
        serializeInjectTouchEvent(ACTION_UP, BigInt(-2), x2, y2, width, height, 0)
      );
      return { status: "success", method: "scrcpy" };
    }
    case "/write": {
      const { text } = params;
      if (text === void 0) throw new Error("Missing text");
      if (!hasActiveSession(serial)) {
        const escaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/ /g, "%s");
        await execAdbShell(serial, `input text "${escaped}"`);
        return { status: "success", method: "adb" };
      }
      sendControlMessage(serial, serializeInjectText(text));
      return { status: "success", method: "scrcpy" };
    }
    case "/key": {
      const { keycode } = params;
      if (keycode === void 0) throw new Error("Missing keycode");
      const code = resolveKeycode(keycode);
      if (!hasActiveSession(serial)) {
        await execAdbShell(serial, `input keyevent ${code}`);
        return { status: "success", method: "adb" };
      }
      sendControlMessage(serial, serializeInjectKeycode(ACTION_DOWN, code));
      await new Promise((resolve4) => setTimeout(resolve4, 10));
      sendControlMessage(serial, serializeInjectKeycode(ACTION_UP, code));
      return { status: "success", method: "scrcpy" };
    }
    case "/scroll": {
      const { x, y, dx, dy } = params;
      if (x === void 0 || y === void 0 || dx === void 0 || dy === void 0) {
        throw new Error("Missing coordinates or deltas");
      }
      if (!hasActiveSession(serial)) {
        const duration = 300;
        const distance = 100;
        const endX = Math.max(0, Math.round(x + dx * distance));
        const endY = Math.max(0, Math.round(y + dy * distance));
        await execAdbShell(serial, `input swipe ${x} ${y} ${endX} ${endY} ${duration}`);
        return { status: "success", method: "adb" };
      }
      const session = getSession(serial);
      const { width, height } = session.screenSize;
      sendControlMessage(serial, serializeInjectScrollEvent(x, y, width, height, dx * 16, dy * 16));
      return { status: "success", method: "scrcpy" };
    }
    case "/clipboard/set": {
      const { text, paste = false } = params;
      if (text === void 0) throw new Error("Missing text");
      if (!hasActiveSession(serial)) {
        const success = await setClipboardViaAdb(serial, text);
        return { status: success ? "success" : "failed", method: "adb" };
      }
      await setClipboardViaScrcpy(serial, text, paste);
      return { status: "success", method: "scrcpy" };
    }
    case "/app/start": {
      const { packageName } = params;
      if (!packageName) throw new Error("Missing packageName");
      if (!hasActiveSession(serial)) {
        const cleanPkg = packageName.startsWith("+") ? packageName.slice(1) : packageName;
        if (packageName.startsWith("+")) {
          await execAdbShell(serial, `am force-stop ${cleanPkg}`);
        }
        await execAdbShell(serial, `monkey -p ${cleanPkg} -c android.intent.category.LAUNCHER 1`);
        return { status: "success", method: "adb" };
      }
      await startAppViaScrcpy(serial, packageName);
      return { status: "success", method: "scrcpy" };
    }
    case "/app/stop": {
      const { packageName } = params;
      if (!packageName) throw new Error("Missing packageName");
      await execAdbShell(serial, `am force-stop ${packageName}`);
      return { status: "success", method: "adb" };
    }
    default:
      throw new Error(`Unknown POST path: ${pathname}`);
  }
}
async function handleGetRequest(pathname, searchParams) {
  const serial = await resolveSerial(searchParams.get("serial") || void 0);
  switch (pathname) {
    case "/screenshot": {
      if (hasActiveSession(serial)) {
        const frame = getLatestFrame(serial);
        if (frame && frame.length > 0) {
          return { type: "binary", mimeType: "image/jpeg", data: frame };
        }
      }
      const pngBuffer = await execAdbRaw(["-s", serial, "exec-out", "screencap", "-p"]);
      return { type: "binary", mimeType: "image/png", data: pngBuffer };
    }
    case "/ui-dump": {
      const dumpRes = await execAdbShell(serial, "uiautomator dump");
      const match = dumpRes.match(/UI hierchary dumped to:\s*(\S+)/i) || dumpRes.match(/dumped to:\s*(\S+)/i);
      const remotePath = match ? match[1] : "/sdcard/window_dump.xml";
      const xml = await execAdbShell(serial, `cat ${remotePath}`);
      return { xml };
    }
    case "/clipboard/get": {
      if (hasActiveSession(serial)) {
        const text2 = await getClipboardViaScrcpy(serial);
        if (text2 !== null) return { clipboard: text2, source: "scrcpy" };
      }
      const text = await getClipboardViaAdb(serial);
      return { clipboard: text || "", source: "adb" };
    }
    case "/app/list": {
      const stdout = await execAdbShell(serial, "pm list packages");
      const packages = stdout.split("\n").map((l) => l.replace(/^package:/, "").trim()).filter(Boolean);
      return { packages };
    }
    case "/device/info": {
      const model = await getDeviceProperty(serial, "ro.product.model");
      const sdk = await getDeviceProperty(serial, "ro.build.version.sdk");
      const release = await getDeviceProperty(serial, "ro.build.version.release");
      const size = await getScreenSize(serial);
      return { serial, model, sdk, release, screenSize: size };
    }
    case "/device/list": {
      const devices = await getDevices();
      return { devices };
    }
    default:
      throw new Error(`Unknown GET path: ${pathname}`);
  }
}
function runDaemon(port, serialOption, options = {}) {
  const server = http2.createServer(async (req, res) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const pathname = url.pathname;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => body += chunk);
      req.on("end", async () => {
        let params = {};
        try {
          if (body) params = JSON.parse(body);
        } catch {
        }
        if (pathname === "/daemon/stop") {
          try {
            const devices = await getDevices();
            for (const d of devices) {
              await stopSession(d.serial);
            }
          } catch {
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "stopped" }));
          setTimeout(() => {
            process.exit(0);
          }, 100);
          return;
        }
        try {
          const response = await handlePostRequest(pathname, params);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        } catch (err) {
          const error = err;
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: true, message: error.message }));
        }
      });
    } else if (req.method === "GET") {
      try {
        const response = await handleGetRequest(pathname, url.searchParams);
        if (response && response.type === "binary") {
          res.writeHead(200, { "Content-Type": response.mimeType });
          res.end(response.data);
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(response));
        }
      } catch (err) {
        const error = err;
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: true, message: error.message }));
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(port, "127.0.0.1", async () => {
    console.log(`[scrcpy-cli daemon] Server listening on http://127.0.0.1:${port}`);
    try {
      const activeSerial = await resolveSerial(serialOption);
      console.log(`[scrcpy-cli daemon] Auto-starting scrcpy session for device: ${activeSerial}`);
      await startSession(activeSerial, options);
      console.log(`[scrcpy-cli daemon] Session successfully initialized.`);
    } catch (err) {
      const error = err;
      console.error(`[scrcpy-cli daemon] Warning: Initial session auto-start failed: ${error.message}`);
    }
  });
  process.on("SIGTERM", async () => {
    console.log("[scrcpy-cli daemon] SIGTERM received. Stopping all sessions...");
    try {
      const devices = await getDevices();
      for (const d of devices) {
        await stopSession(d.serial);
      }
    } catch {
    }
    process.exit(0);
  });
}

// src/index.ts
var DEFAULT_DAEMON_PORT = 27184;
var __filename2 = fileURLToPath4(import.meta.url);
async function main() {
  const args = process.argv.slice(2);
  const config = loadWorkspaceConfig();
  let port = config.port !== void 0 ? config.port : DEFAULT_DAEMON_PORT;
  let serial = config.serial || process.env.ANDROID_SERIAL;
  let maxSize = config.maxSize;
  let maxFps = config.maxFps;
  let videoBitRate = config.videoBitRate;
  let videoEncoder = config.videoEncoder;
  const cleanArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--port" && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if ((args[i] === "--serial" || args[i] === "-s") && args[i + 1]) {
      serial = args[++i];
    } else if (args[i] === "--max-size" && args[i + 1]) {
      maxSize = parseInt(args[++i], 10);
    } else if (args[i] === "--max-fps" && args[i + 1]) {
      maxFps = parseInt(args[++i], 10);
    } else if (args[i] === "--video-bit-rate" && args[i + 1]) {
      videoBitRate = parseInt(args[++i], 10);
    } else if (args[i] === "--video-encoder" && args[i + 1]) {
      videoEncoder = args[++i];
    } else {
      cleanArgs.push(args[i]);
    }
  }
  const cmd = cleanArgs[0];
  if (!cmd || cmd === "--help" || cmd === "-h") {
    printHelp();
    return;
  }
  if (cmd === "version" || cmd === "-v" || cmd === "--version") {
    const runtimeInfo = getRuntimeVersionInfo();
    const serverPath = findScrcpyServer();
    const clientPath = findScrcpyClient();
    const activeVersion = detectScrcpyVersion(serverPath || void 0);
    const isBundled = Boolean(
      serverPath && serverPath.includes("vendor") || clientPath && clientPath.includes("vendor")
    );
    console.log(`scrcpy-cli version: 1.0.2`);
    console.log(
      `scrcpy version: ${activeVersion}` + (isBundled ? " (bundled)" : runtimeInfo ? " (runtime installed)" : "")
    );
    console.log(`scrcpy server: ${serverPath || "not found"}`);
    console.log(`scrcpy client: ${clientPath || "not found"}`);
    return;
  }
  if (cmd === "update" || cmd === "upgrade") {
    const targetVersion = cleanArgs[1];
    const targetDesc = targetVersion ? `to v${targetVersion}` : "to latest GitHub release";
    console.log(`[scrcpy-cli] Updating scrcpy binaries ${targetDesc}...`);
    try {
      const result = await updateScrcpy(targetVersion);
      console.log(`[scrcpy-cli] Successfully updated scrcpy to v${result.version}`);
      console.log(`Server: ${result.serverPath}`);
      if (result.clientPath) {
        console.log(`Client: ${result.clientPath}`);
      }
    } catch (err) {
      const error = err;
      console.error(`[scrcpy-cli] Update failed: ${error.message}`);
      process.exit(1);
    }
    return;
  }
  if (cmd === "daemon" && cleanArgs[1] === "start") {
    if (await checkDaemonActive(port)) {
      console.log(`Daemon already running on port ${port}`);
      return;
    }
    const child = spawn4(process.execPath, [__filename2, "daemon", "run", "--port", String(port)], {
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        ...serial ? { ANDROID_SERIAL: serial } : {},
        ...maxSize !== void 0 ? { SCRCPY_MAX_SIZE: String(maxSize) } : {},
        ...maxFps !== void 0 ? { SCRCPY_MAX_FPS: String(maxFps) } : {},
        ...videoBitRate !== void 0 ? { SCRCPY_VIDEO_BIT_RATE: String(videoBitRate) } : {},
        ...videoEncoder !== void 0 ? { SCRCPY_VIDEO_ENCODER: videoEncoder } : {}
      }
    });
    child.unref();
    console.log(`Daemon started on port ${port}`);
    return;
  }
  if (cmd === "daemon" && cleanArgs[1] === "run") {
    runDaemon(port, serial, { maxSize, maxFps, videoBitRate, videoEncoder });
    return;
  }
  if (cmd === "daemon" && cleanArgs[1] === "stop") {
    try {
      await makeClientRequest(port, "/daemon/stop", "POST", {});
      console.log("Daemon stopped");
    } catch (err) {
      const error = err;
      console.error(`Error stopping daemon: ${error.message}`);
    }
    return;
  }
  if (cmd === "daemon" && cleanArgs[1] === "status") {
    const isActive = await checkDaemonActive(port);
    if (isActive) {
      try {
        const info = await makeClientRequest(port, "/device/info", "GET", { serial });
        console.log(`Daemon Status: Running on port ${port}
Device info:`, JSON.stringify(info, null, 2));
      } catch {
        console.log(`Daemon Status: Running on port ${port} (not configured / idle)`);
      }
    } else {
      console.log("Daemon Status: Stopped");
    }
    return;
  }
  if (cmd === "mirror" || cmd === "view" || cmd === "gui") {
    try {
      const resolvedSerial2 = await resolveSerial(serial);
      const extraArgs = cleanArgs.slice(1);
      console.log(`[scrcpy-cli] Launching scrcpy client for device ${resolvedSerial2}...`);
      const child = await launchScrcpyClient({
        serial: resolvedSerial2,
        args: extraArgs,
        detached: false
      });
      await new Promise((resolve4, reject) => {
        child.on("exit", (code) => {
          if (code !== 0 && code !== null) {
            process.exit(code);
          }
          resolve4();
        });
        child.on("error", reject);
      });
    } catch (err) {
      const error = err;
      console.error(`[scrcpy-cli] Failed to launch scrcpy client: ${error.message}`);
      process.exit(1);
    }
    return;
  }
  try {
    validateActionCommand(cmd, cleanArgs.slice(1));
  } catch (err) {
    const error = err;
    console.error(`[scrcpy-cli] Direct execution failed: ${error.message}`);
    process.exit(1);
  }
  const daemonActive = await checkDaemonActive(port);
  const resolvedSerial = await resolveSerial(serial);
  if (daemonActive) {
    try {
      const res = await routeToDaemon(cmd, cleanArgs.slice(1), port, resolvedSerial);
      printResponse(res);
      return;
    } catch (err) {
      const error = err;
      console.error(
        `[scrcpy-cli] Daemon routing failed: ${error.message}. Falling back to direct ADB execution.`
      );
    }
  }
  try {
    const res = await executeDirectAdb(cmd, cleanArgs.slice(1), resolvedSerial);
    printResponse(res);
  } catch (err) {
    const error = err;
    console.error(`[scrcpy-cli] Direct execution failed: ${error.message}`);
    process.exit(1);
  }
}
main().catch((err) => {
  console.error("CLI Execution Error:", err.message);
  process.exit(1);
});
//# sourceMappingURL=index.js.map