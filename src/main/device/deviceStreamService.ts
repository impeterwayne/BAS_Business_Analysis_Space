import { spawn, ChildProcess, execSync, exec, execFile } from 'child_process';
import net from 'net';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { DeviceService } from './deviceService';

const CONTROL_MSG_TYPE_INJECT_KEYCODE = 0;
const CONTROL_MSG_TYPE_INJECT_TEXT = 1;
const CONTROL_MSG_TYPE_INJECT_TOUCH_EVENT = 2;
const CONTROL_MSG_TYPE_INJECT_SCROLL_EVENT = 3;
const CONTROL_MSG_TYPE_BACK_OR_SCREEN_ON = 4;
const CONTROL_MSG_TYPE_EXPAND_NOTIFICATION_PANEL = 5;
const CONTROL_MSG_TYPE_EXPAND_SETTINGS_PANEL = 6;
const CONTROL_MSG_TYPE_COLLAPSE_PANELS = 7;
const CONTROL_MSG_TYPE_SET_DISPLAY_POWER = 10;
const CONTROL_MSG_TYPE_ROTATE_DEVICE = 11;
const POINTER_ID_MOUSE = BigInt('0xFFFFFFFFFFFFFFFF');

function floatToU16FP(f: number): number {
  f = Math.max(0, Math.min(f, 1));
  return Math.min(0xffff, Math.round(f * 65536));
}

function floatToI16FP(f: number): number {
  f = Math.max(-1, Math.min(f, 1));
  const i = Math.round(f * 32768);
  return Math.max(-0x8000, Math.min(i, 0x7fff));
}

function serializeInjectKeycode(action: number, keycode: number, repeat = 0, metaState = 0): Buffer {
  const buffer = Buffer.alloc(14);
  buffer.writeUInt8(CONTROL_MSG_TYPE_INJECT_KEYCODE, 0);
  buffer.writeUInt8(action, 1);
  buffer.writeInt32BE(keycode, 2);
  buffer.writeInt32BE(repeat, 6);
  buffer.writeInt32BE(metaState, 10);
  return buffer;
}

function serializeInjectText(text: string): Buffer {
  const textBytes = Buffer.from(text, 'utf8');
  const buffer = Buffer.alloc(5 + textBytes.length);
  buffer.writeUInt8(CONTROL_MSG_TYPE_INJECT_TEXT, 0);
  buffer.writeUInt32BE(textBytes.length, 1);
  textBytes.copy(buffer, 5);
  return buffer;
}

function serializeInjectScrollEvent(
  x: number,
  y: number,
  screenWidth: number,
  screenHeight: number,
  hScroll: number,
  vScroll: number,
  buttons = 0
): Buffer {
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

function serializeInjectTouchEvent(
  action: number, // 0 = DOWN, 1 = UP, 2 = MOVE
  pointerId: bigint,
  x: number,
  y: number,
  screenWidth: number,
  screenHeight: number,
  pressure = 1.0,
  buttons = 0,
  actionButton = 0
): Buffer {
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

export interface StreamStartOptions {
  serial?: string;
  maxSize?: number;
  maxFps?: number;
  quality?: number;
}

export interface TouchEventOptions {
  serial?: string;
  type: 'down' | 'move' | 'up' | 'tap' | 'swipe';
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  durationMs?: number;
}

export interface StreamSessionInfo {
  isStreaming: boolean;
  serial: string;
  streamUrl: string;
  width: number;
  height: number;
  deviceName: string;
}

interface ActiveSession {
  serial: string;
  scid: number;
  scrcpyPort: number;
  httpPort: number;
  serverProc: ChildProcess | null;
  videoSocket: net.Socket | null;
  controlSocket: net.Socket | null;
  ffmpegProc: ChildProcess | null;
  httpServer: http.Server | null;
  httpClients: Set<http.ServerResponse>;
  streamUrl: string;
  width: number;
  height: number;
  deviceName: string;
  latestFrame: Buffer | null;
}

export class DeviceStreamService {
  private sessions = new Map<string, ActiveSession>();

  constructor(private deviceService: DeviceService) {}

  private getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const srv = net.createServer();
      srv.unref();
      srv.on('error', reject);
      srv.listen(0, '127.0.0.1', () => {
        const port = (srv.address() as net.AddressInfo).port;
        srv.close(() => resolve(port));
      });
    });
  }

  private findScrcpyServer(): string | null {
    if (process.env.SCRCPY_SERVER_PATH && fs.existsSync(process.env.SCRCPY_SERVER_PATH)) {
      return process.env.SCRCPY_SERVER_PATH;
    }

    const scrcpyExe = this.deviceService.getScrcpyExecutable();
    if (scrcpyExe && fs.existsSync(scrcpyExe)) {
      const dir = path.dirname(scrcpyExe);
      for (const name of ['scrcpy-server', 'scrcpy-server.jar']) {
        const p = path.join(dir, name);
        if (fs.existsSync(p)) return p;
      }
      // Homebrew and Linux packages put the binary in <prefix>/bin and the server in <prefix>/share/scrcpy.
      try {
        const realDir = path.dirname(fs.realpathSync(scrcpyExe));
        for (const base of [dir, realDir]) {
          const p = path.join(base, '..', 'share', 'scrcpy', 'scrcpy-server');
          if (fs.existsSync(p)) return path.resolve(p);
        }
      } catch (_) {}
    }

    const candidates = [
      path.resolve(process.cwd(), 'vendor/scrcpy/scrcpy-server'),
      path.resolve(__dirname, '../../vendor/scrcpy/scrcpy-server'),
      path.resolve(__dirname, '../../../vendor/scrcpy/scrcpy-server'),
      'D:\\Quest\\ReaKit\\core\\scrcpy_cli\\vendor\\scrcpy\\scrcpy-server',
      '/opt/homebrew/share/scrcpy/scrcpy-server',
      '/usr/local/share/scrcpy/scrcpy-server',
      '/usr/share/scrcpy/scrcpy-server',
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }

    return null;
  }

  private findFfmpeg(): string {
    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
      return process.env.FFMPEG_PATH;
    }

    const candidates = process.platform === 'win32'
      ? [
        path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
      ]
      : ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', '/snap/bin/ffmpeg'];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }

    return 'ffmpeg';
  }

  public isStreaming(serial?: string): boolean {
    const target = serial || this.deviceService.getActiveSerial();
    if (!target) return false;
    return this.sessions.has(target);
  }

  public getStreamInfo(serial?: string): StreamSessionInfo | null {
    const target = serial || this.deviceService.getActiveSerial();
    if (!target) return null;
    const session = this.sessions.get(target);
    if (!session) return null;
    return {
      isStreaming: true,
      serial: session.serial,
      streamUrl: session.streamUrl,
      width: session.width,
      height: session.height,
      deviceName: session.deviceName,
    };
  }

  public async startStream(options: StreamStartOptions = {}): Promise<{
    success: boolean;
    streamUrl?: string;
    width?: number;
    height?: number;
    deviceName?: string;
    error?: string;
  }> {
    const serial = options.serial || this.deviceService.getActiveSerial();
    if (!serial) {
      return { success: false, error: 'No active device selected' };
    }

    // Return existing stream if already running
    if (this.sessions.has(serial)) {
      const existing = this.sessions.get(serial)!;
      return {
        success: true,
        streamUrl: existing.streamUrl,
        width: existing.width,
        height: existing.height,
        deviceName: existing.deviceName,
      };
    }

    const serverJar = this.findScrcpyServer();
    if (!serverJar) {
      return {
        success: false,
        error: 'scrcpy-server not found. Please ensure scrcpy is installed or configure its path.',
      };
    }

    const adb = this.deviceService.getAdbPath();
    const ffmpegPath = this.findFfmpeg();

    const scrcpyPort = await this.getFreePort();
    const httpPort = await this.getFreePort();
    const scid = Math.floor(Math.random() * 0x7fffffff) + 1;
    const socketName = `scrcpy_${scid.toString(16).padStart(8, '0')}`;
    const maxSize = options.maxSize !== undefined ? options.maxSize : 0;
    const maxFps = options.maxFps || 60;
    const quality = options.quality || 3;

    try {
      // 1. Push scrcpy-server jar to device
      try {
        execSync(`"${adb}" -s "${serial}" push "${serverJar}" /data/local/tmp/scrcpy-server.jar`, {
          timeout: 15000,
          windowsHide: true,
          stdio: 'ignore',
        });
      } catch (err: any) {
        return { success: false, error: `Failed to push scrcpy-server to device: ${err.message}` };
      }

      // 2. Setup forward tunnel
      try {
        execSync(`"${adb}" -s "${serial}" forward --remove tcp:${scrcpyPort}`, { stdio: 'ignore' });
      } catch (_) {}

      try {
        execSync(`"${adb}" -s "${serial}" forward tcp:${scrcpyPort} localabstract:${socketName}`, {
          timeout: 5000,
          windowsHide: true,
        });
      } catch (err: any) {
        return { success: false, error: `Failed to setup ADB port forwarding: ${err.message}` };
      }

      // 3. Start scrcpy-server on Android device via app_process
      const serverArgs = [
        '-s',
        serial,
        'shell',
        'CLASSPATH=/data/local/tmp/scrcpy-server.jar',
        'app_process',
        '/',
        'com.genymobile.scrcpy.Server',
        '4.1',
        `scid=${scid.toString(16).padStart(8, '0')}`,
        'log_level=info',
      ];
      if (maxSize > 0) {
        serverArgs.push(`max_size=${maxSize}`);
      }
      if (maxFps > 0) {
        serverArgs.push(`max_fps=${maxFps}`);
      }
      serverArgs.push('tunnel_forward=true', 'audio=false');

      const serverProc = spawn(adb, serverArgs, {
        windowsHide: true,
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      serverProc.on('error', (err) => {
        console.error(`[DeviceStreamService] serverProc error for ${serial}:`, err);
      });

      // 4. Connect video socket (with retry deadline)
      const videoSocket = await this.connectAndVerifySocket(scrcpyPort, 6000);

      // 5. Connect control socket
      const controlSocket = await this.connectToServerSocket(scrcpyPort, 4000);

      // 6. Read stream metadata from video socket
      const meta = await this.readDeviceMetadata(videoSocket, 6000);

      // 7. Spawn ffmpeg for low-latency H.264 -> MJPEG transcoding
      const ffmpegProc = spawn(
        ffmpegPath,
        [
          '-probesize',
          '1024',
          '-flags',
          'low_delay',
          '-threads',
          '2',
          '-f',
          'h264',
          '-i',
          'pipe:0',
          '-f',
          'image2pipe',
          '-vcodec',
          'mjpeg',
          '-q:v',
          String(quality),
          '-flush_packets',
          '1',
          'pipe:1',
        ],
        {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      ffmpegProc.stderr?.on('data', (d: Buffer) => {
        const msg = d.toString().trim();
        if (msg.includes('error') || msg.includes('Error')) {
          console.warn(`[DeviceStreamService:ffmpeg] ${msg}`);
        }
      });

      ffmpegProc.on('error', (err) => {
        console.error(`[DeviceStreamService] ffmpeg error for ${serial}:`, err);
      });

      // Pipe any metadata overflow or start streaming
      const BOUNDARY = 'scrcpy_frame';
      const httpClients = new Set<http.ServerResponse>();

      // 8. Start local HTTP MJPEG server
      const httpServer = http.createServer((req, res) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath === '/stream' || urlPath === '/' || urlPath === '') {
          res.writeHead(200, {
            'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          if (typeof (res as any).flushHeaders === 'function') {
            (res as any).flushHeaders();
          }

          // Send current frame immediately if available
          const session = this.sessions.get(serial);
          if (session?.latestFrame) {
            const header = Buffer.from(
              `--${BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: ${session.latestFrame.length}\r\n\r\n`
            );
            res.write(Buffer.concat([header, session.latestFrame, Buffer.from('\r\n')]));
          }

          httpClients.add(res);
          const removeClient = () => {
            httpClients.delete(res);
          };
          req.on('close', removeClient);
          res.on('close', removeClient);
          res.on('error', removeClient);
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(httpPort, '127.0.0.1', () => {
          httpServer.removeListener('error', reject);
          resolve();
        });
      });

      const streamUrl = `http://127.0.0.1:${httpPort}/stream`;

      const session: ActiveSession = {
        serial,
        scid,
        scrcpyPort,
        httpPort,
        serverProc,
        videoSocket,
        controlSocket,
        ffmpegProc,
        httpServer,
        httpClients,
        streamUrl,
        width: meta.width,
        height: meta.height,
        deviceName: meta.deviceName,
        latestFrame: null,
      };

      this.sessions.set(serial, session);

      // 9. Frame extractor from ffmpeg output with SOI & EOI validation
      let currentJpeg = Buffer.alloc(0);
      const JPEG_SOI = 0xffd8;
      const JPEG_EOI = 0xffd9;
      const MAX_JPEG_BUF = 10 * 1024 * 1024;

      ffmpegProc.stdout?.on('data', (chunk: Buffer) => {
        currentJpeg = Buffer.concat([currentJpeg, chunk]);

        if (currentJpeg.length > MAX_JPEG_BUF) {
          console.warn(`[DeviceStreamService] Frame buffer exceeded max size, dropping`);
          currentJpeg = Buffer.alloc(0);
          return;
        }

        while (currentJpeg.length >= 4) {
          // 1. Locate start of JPEG (SOI: 0xFFD8)
          let soiIdx = -1;
          for (let i = 0; i < currentJpeg.length - 1; i++) {
            if (currentJpeg.readUInt16BE(i) === JPEG_SOI) {
              soiIdx = i;
              break;
            }
          }

          if (soiIdx === -1) {
            currentJpeg = currentJpeg.subarray(Math.max(0, currentJpeg.length - 1));
            break;
          }

          if (soiIdx > 0) {
            currentJpeg = currentJpeg.subarray(soiIdx);
          }

          // 2. Locate end of JPEG (EOI: 0xFFD9) after SOI
          let eoiIdx = -1;
          for (let i = 2; i < currentJpeg.length - 1; i++) {
            if (currentJpeg.readUInt16BE(i) === JPEG_EOI) {
              eoiIdx = i;
              break;
            }
          }

          if (eoiIdx === -1) break;

          const frame = currentJpeg.subarray(0, eoiIdx + 2);
          session.latestFrame = Buffer.from(frame);
          currentJpeg = currentJpeg.subarray(eoiIdx + 2);

          if (httpClients.size > 0) {
            const header = Buffer.from(
              `--${BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`
            );
            const packet = Buffer.concat([header, frame, Buffer.from('\r\n')]);

            for (const client of Array.from(httpClients)) {
              try {
                client.write(packet);
              } catch (_) {
                httpClients.delete(client);
              }
            }
          }
        }
      });

      // 10. Feed scrcpy H.264 packets into ffmpeg
      let streamBuf = meta.overflow;

      const processPackets = () => {
        while (streamBuf.length >= 12) {
          const packetSize = streamBuf.readUInt32BE(8);
          const totalLength = 12 + packetSize;
          if (streamBuf.length < totalLength) break;

          const packet = streamBuf.subarray(12, totalLength);
          if (ffmpegProc.stdin && !ffmpegProc.stdin.destroyed) {
            try {
              ffmpegProc.stdin.write(packet);
            } catch (_) {}
          }
          streamBuf = streamBuf.subarray(totalLength);
        }
      };

      if (streamBuf.length >= 12) {
        processPackets();
      }

      videoSocket.on('data', (chunk: Buffer) => {
        streamBuf = Buffer.concat([streamBuf, chunk]);
        processPackets();
      });

      // Handle socket close/error
      videoSocket.on('close', () => {
        this.stopStream(serial);
      });

      return {
        success: true,
        streamUrl,
        width: meta.width,
        height: meta.height,
        deviceName: meta.deviceName,
      };
    } catch (err: any) {
      this.cleanupSession(serial, scrcpyPort, httpPort);
      return { success: false, error: err?.message || String(err) };
    }
  }

  public async stopStream(serial?: string): Promise<{ success: boolean; error?: string }> {
    const target = serial || this.deviceService.getActiveSerial();
    if (!target) return { success: true };

    const session = this.sessions.get(target);
    if (!session) return { success: true };

    this.sessions.delete(target);
    this.cleanupSession(target, session.scrcpyPort, session.httpPort, session);

    return { success: true };
  }

  public stopAllStreams(): void {
    for (const [serial, session] of this.sessions.entries()) {
      this.cleanupSession(serial, session.scrcpyPort, session.httpPort, session);
    }
    this.sessions.clear();
  }

  private cleanupSession(
    serial: string,
    scrcpyPort: number,
    httpPort: number,
    session?: ActiveSession
  ): void {
    if (session) {
      if (session.httpClients) {
        for (const client of session.httpClients) {
          try {
            client.end();
          } catch (_) {}
        }
        session.httpClients.clear();
      }

      if (session.httpServer) {
        try {
          session.httpServer.close();
        } catch (_) {}
      }

      if (session.ffmpegProc) {
        try {
          session.ffmpegProc.kill();
        } catch (_) {}
      }

      if (session.videoSocket) {
        try {
          session.videoSocket.destroy();
        } catch (_) {}
      }

      if (session.controlSocket) {
        try {
          session.controlSocket.destroy();
        } catch (_) {}
      }

      if (session.serverProc) {
        try {
          session.serverProc.kill();
        } catch (_) {}
      }
    }

    const adb = this.deviceService.getAdbPath();
    try {
      execSync(`"${adb}" -s "${serial}" forward --remove tcp:${scrcpyPort}`, {
        windowsHide: true,
        stdio: 'ignore',
      });
    } catch (_) {}
  }

  public async injectTouch(options: TouchEventOptions): Promise<{ success: boolean; error?: string }> {
    const target = options.serial || this.deviceService.getActiveSerial();
    if (!target) {
      return { success: false, error: 'No active device target' };
    }

    const session = this.sessions.get(target);
    const { type, x, y, endX, endY, durationMs = 250 } = options;

    // Use fast direct control socket if available
    if (session?.controlSocket && !session.controlSocket.destroyed) {
      const devW = session.width || 1080;
      const devH = session.height || 2400;

      try {
        if (type === 'tap') {
          const down = serializeInjectTouchEvent(0, POINTER_ID_MOUSE, x, y, devW, devH, 1.0);
          const up = serializeInjectTouchEvent(1, POINTER_ID_MOUSE, x, y, devW, devH, 0.0);
          session.controlSocket.write(down);
          setTimeout(() => {
            if (session.controlSocket && !session.controlSocket.destroyed) {
              session.controlSocket.write(up);
            }
          }, 40);
          return { success: true };
        }

        if (type === 'swipe' && endX !== undefined && endY !== undefined) {
          const steps = 10;
          const stepInterval = Math.max(10, Math.floor(durationMs / steps));
          const down = serializeInjectTouchEvent(0, POINTER_ID_MOUSE, x, y, devW, devH, 1.0);
          session.controlSocket.write(down);

          for (let i = 1; i <= steps; i++) {
            const curX = Math.round(x + ((endX - x) * i) / steps);
            const curY = Math.round(y + ((endY - y) * i) / steps);
            setTimeout(() => {
              if (session.controlSocket && !session.controlSocket.destroyed) {
                const move = serializeInjectTouchEvent(2, POINTER_ID_MOUSE, curX, curY, devW, devH, 1.0);
                session.controlSocket.write(move);
              }
            }, i * stepInterval);
          }

          setTimeout(() => {
            if (session.controlSocket && !session.controlSocket.destroyed) {
              const up = serializeInjectTouchEvent(1, POINTER_ID_MOUSE, endX, endY, devW, devH, 0.0);
              session.controlSocket.write(up);
            }
          }, (steps + 1) * stepInterval);

          return { success: true };
        }

        if (type === 'down') {
          const down = serializeInjectTouchEvent(0, POINTER_ID_MOUSE, x, y, devW, devH, 1.0);
          session.controlSocket.write(down);
          return { success: true };
        }

        if (type === 'move') {
          const move = serializeInjectTouchEvent(2, POINTER_ID_MOUSE, x, y, devW, devH, 1.0);
          session.controlSocket.write(move);
          return { success: true };
        }

        if (type === 'up') {
          const up = serializeInjectTouchEvent(1, POINTER_ID_MOUSE, x, y, devW, devH, 0.0);
          session.controlSocket.write(up);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('[DeviceStreamService] Control socket touch write failed, falling back to ADB:', err);
      }
    }

    // ADB input fallback
    const adb = this.deviceService.getAdbPath();
    const serialArg = `-s "${target}"`;

    return new Promise((resolve) => {
      let cmd = '';
      if (type === 'tap') {
        cmd = `"${adb}" ${serialArg} shell input tap ${Math.round(x)} ${Math.round(y)}`;
      } else if (type === 'swipe' && endX !== undefined && endY !== undefined) {
        cmd = `"${adb}" ${serialArg} shell input swipe ${Math.round(x)} ${Math.round(y)} ${Math.round(endX)} ${Math.round(endY)} ${durationMs}`;
      } else {
        cmd = `"${adb}" ${serialArg} shell input tap ${Math.round(x)} ${Math.round(y)}`;
      }

      exec(cmd, { timeout: 4000, windowsHide: true }, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  public async injectKey(serial: string | undefined, keycode: number): Promise<{ success: boolean; error?: string }> {
    const target = serial || this.deviceService.getActiveSerial();
    if (!target) return { success: false, error: 'No active device target' };

    const session = this.sessions.get(target);
    if (session?.controlSocket && !session.controlSocket.destroyed) {
      try {
        const down = serializeInjectKeycode(0, keycode);
        const up = serializeInjectKeycode(1, keycode);
        session.controlSocket.write(down);
        setTimeout(() => {
          if (session.controlSocket && !session.controlSocket.destroyed) {
            session.controlSocket.write(up);
          }
        }, 30);
        return { success: true };
      } catch (_) {}
    }

    return this.deviceService.sendKey(target, keycode);
  }

  public async injectText(serial: string | undefined, text: string): Promise<{ success: boolean; error?: string }> {
    const target = serial || this.deviceService.getActiveSerial();
    if (!target) return { success: false, error: 'No active device target' };

    const session = this.sessions.get(target);
    if (session?.controlSocket && !session.controlSocket.destroyed) {
      try {
        const chunkSize = 250;
        for (let i = 0; i < text.length; i += chunkSize) {
          const chunk = text.slice(i, i + chunkSize);
          session.controlSocket.write(serializeInjectText(chunk));
        }
        return { success: true };
      } catch (_) {}
    }

    const adb = this.deviceService.getAdbPath();
    const escaped = text.replace(/([\\'"`$*?~&|()<>;#\s])/g, '\\$1');
    return new Promise((resolve) => {
      // No local shell: the escaping above is for the device shell only, and cmd.exe vs sh would treat it differently.
      execFile(adb, ['-s', target, 'shell', 'input', 'text', escaped], { timeout: 5000, windowsHide: true }, (err) => {
        resolve({ success: !err, error: err?.message });
      });
    });
  }

  public async injectScroll(options: {
    serial?: string;
    x: number;
    y: number;
    hScroll: number;
    vScroll: number;
  }): Promise<{ success: boolean; error?: string }> {
    const target = options.serial || this.deviceService.getActiveSerial();
    if (!target) return { success: false, error: 'No active device target' };

    const session = this.sessions.get(target);
    if (session?.controlSocket && !session.controlSocket.destroyed) {
      const devW = session.width || 1080;
      const devH = session.height || 2400;
      try {
        const buf = serializeInjectScrollEvent(
          options.x,
          options.y,
          devW,
          devH,
          options.hScroll,
          options.vScroll
        );
        session.controlSocket.write(buf);
        return { success: true };
      } catch (_) {}
    }

    const dy = options.vScroll > 0 ? -220 : 220;
    return this.injectTouch({
      serial: target,
      type: 'swipe',
      x: options.x,
      y: options.y,
      endX: options.x,
      endY: Math.max(0, options.y + dy),
      durationMs: 120,
    });
  }

  public async injectAction(
    serial: string | undefined,
    action: 'notification' | 'settings' | 'collapse' | 'rotate' | 'wake' | 'power'
  ): Promise<{ success: boolean; error?: string }> {
    const target = serial || this.deviceService.getActiveSerial();
    if (!target) return { success: false, error: 'No active device target' };

    const session = this.sessions.get(target);
    if (session?.controlSocket && !session.controlSocket.destroyed) {
      try {
        if (action === 'notification') {
          session.controlSocket.write(Buffer.from([CONTROL_MSG_TYPE_EXPAND_NOTIFICATION_PANEL]));
          return { success: true };
        }
        if (action === 'settings') {
          session.controlSocket.write(Buffer.from([CONTROL_MSG_TYPE_EXPAND_SETTINGS_PANEL]));
          return { success: true };
        }
        if (action === 'collapse') {
          session.controlSocket.write(Buffer.from([CONTROL_MSG_TYPE_COLLAPSE_PANELS]));
          return { success: true };
        }
        if (action === 'rotate') {
          session.controlSocket.write(Buffer.from([CONTROL_MSG_TYPE_ROTATE_DEVICE]));
          return { success: true };
        }
      } catch (_) {}
    }

    if (action === 'wake') {
      return this.injectKey(target, 224);
    }
    if (action === 'power') {
      return this.injectKey(target, 26);
    }
    if (action === 'notification') {
      const adb = this.deviceService.getAdbPath();
      return new Promise((r) =>
        exec(`"${adb}" -s "${target}" shell cmd statusbar expand-notifications`, { timeout: 3000, windowsHide: true }, (e) =>
          r({ success: !e })
        )
      );
    }
    if (action === 'collapse') {
      const adb = this.deviceService.getAdbPath();
      return new Promise((r) =>
        exec(`"${adb}" -s "${target}" shell cmd statusbar collapse`, { timeout: 3000, windowsHide: true }, (e) =>
          r({ success: !e })
        )
      );
    }
    return { success: false, error: 'Unknown action' };
  }

  private connectAndVerifySocket(port: number, timeout: number): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;
      const attempt = () => {
        const s = net.createConnection({ port, host: '127.0.0.1' });
        let done = false;
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          s.destroy();
          retry();
        }, 1500);

        s.once('error', () => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          s.destroy();
          retry();
        });

        s.once('data', (chunk: Buffer) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (chunk.length > 1) {
            s.unshift(chunk.subarray(1));
          }
          // Pause socket so incoming metadata and packets are buffered until handlers are attached
          s.pause();
          resolve(s);
        });

        const retry = () => {
          if (Date.now() < deadline) {
            setTimeout(attempt, 150);
          } else {
            reject(new Error(`Failed to connect to scrcpy server on port ${port} within timeout`));
          }
        };
      };
      attempt();
    });
  }

  private connectToServerSocket(port: number, timeout: number): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;
      const attempt = () => {
        const s = net.createConnection({ port, host: '127.0.0.1' }, () => resolve(s));
        s.once('error', (err) => {
          s.destroy();
          if (Date.now() < deadline) {
            setTimeout(attempt, 100);
          } else {
            reject(new Error(`Control socket connection timed out on port ${port}`, { cause: err }));
          }
        });
      };
      attempt();
    });
  }

  private readDeviceMetadata(
    socket: net.Socket,
    timeout: number
  ): Promise<{ width: number; height: number; deviceName: string; overflow: Buffer }> {
    return new Promise((resolve, reject) => {
      let buf = Buffer.alloc(0);
      const timer = setTimeout(() => {
        socket.off('data', onData);
        reject(new Error('Timeout waiting for scrcpy device metadata'));
      }, timeout);

      const onData = (chunk: Buffer) => {
        buf = Buffer.concat([buf, chunk]);
        if (buf.length >= 76) {
          const w68 = buf.readUInt32BE(68);
          let metaSize = 76;
          let width = w68;
          let height = buf.readUInt32BE(72);

          if (w68 > 10000 || w68 === 0x80000000) {
            if (buf.length < 80) return; // Wait for full 80-byte header
            metaSize = 80;
            width = buf.readUInt32BE(72);
            height = buf.readUInt32BE(76);
          }

          clearTimeout(timer);
          socket.off('data', onData);

          const deviceName = buf
            .subarray(0, 64)
            .toString('utf8')
            .replace(/\0+$/, '');
          const overflow = buf.length > metaSize ? Buffer.from(buf.subarray(metaSize)) : Buffer.alloc(0);

          resolve({ width, height, deviceName, overflow });
        }
      };

      socket.on('data', onData);
      socket.resume();
    });
  }
}
