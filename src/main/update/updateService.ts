import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import type { App, Shell } from 'electron';

const {
  parseGitHubRelease,
  extractTagFromReleaseUrl,
  parseExpandedAssetsHtml,
  parseReleasesAtomEntry,
} = require('../../domain');

export interface AppReleaseAsset {
  id: number;
  name: string;
  size: number;
  sizeApproximate?: boolean;
  downloadUrl: string;
  contentType: string;
}

export interface AppReleaseInfo {
  tagName: string;
  version: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
  assets: AppReleaseAsset[];
  recommendedAsset: AppReleaseAsset | null;
  updateAvailable: boolean;
}

export interface AppUpdateProgress {
  downloadedBytes: number;
  totalBytes: number;
  percent: number;
  bytesPerSecond: number;
}

export type AppUpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface AppUpdateState {
  status: AppUpdateStatus;
  currentVersion: string;
  repoOwner: string;
  repoRepo: string;
  lastCheckedAt: string | null;
  release: AppReleaseInfo | null;
  selectedAssetName: string | null;
  downloadProgress: AppUpdateProgress | null;
  downloadedFilePath: string | null;
  error: string | null;
}

export interface UpdateServiceOptions {
  currentVersion: string;
  repoOwner: string;
  repoRepo: string;
  updatesDir: string;
  shell: Shell;
  app: App;
  onStateChanged?: (state: AppUpdateState) => void;
}

interface CachedApiRelease {
  etag: string;
  rawRelease: any;
}

function sanitizeSegment(value: string): string {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return cleaned || 'unknown';
}

function sanitizeFileName(value: string): string {
  const base = path.basename(String(value || ''));
  const cleaned = base.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  return cleaned || 'update-installer';
}

export class UpdateService {
  private readonly currentVersion: string;
  private readonly repoOwner: string;
  private readonly repoRepo: string;
  private readonly updatesDir: string;
  private readonly shell: Shell;
  private readonly app: App;
  private readonly onStateChanged?: (state: AppUpdateState) => void;

  private state: AppUpdateState;
  private activeCheckPromise: Promise<AppUpdateState> | null = null;
  private activeDownloadController: AbortController | null = null;

  constructor(options: UpdateServiceOptions) {
    this.currentVersion = options.currentVersion;
    this.repoOwner = options.repoOwner;
    this.repoRepo = options.repoRepo;
    this.updatesDir = options.updatesDir;
    this.shell = options.shell;
    this.app = options.app;
    this.onStateChanged = options.onStateChanged;

    this.state = {
      status: 'idle',
      currentVersion: this.currentVersion,
      repoOwner: this.repoOwner,
      repoRepo: this.repoRepo,
      lastCheckedAt: null,
      release: null,
      selectedAssetName: null,
      downloadProgress: null,
      downloadedFilePath: null,
      error: null,
    };
  }

  getState(): AppUpdateState {
    return {
      ...this.state,
      release: this.state.release
        ? {
            ...this.state.release,
            assets: [...this.state.release.assets],
            recommendedAsset: this.state.release.recommendedAsset
              ? { ...this.state.release.recommendedAsset }
              : null,
          }
        : null,
      downloadProgress: this.state.downloadProgress
        ? { ...this.state.downloadProgress }
        : null,
    };
  }

  private emitState(): void {
    if (this.onStateChanged) {
      this.onStateChanged(this.getState());
    }
  }

  private getAssetTargetPath(tagName: string, assetName: string): string {
    return path.join(this.updatesDir, sanitizeSegment(tagName), sanitizeFileName(assetName));
  }

  private isAssetAlreadyDownloaded(targetPath: string, expectedSize: number, sizeApproximate = false): boolean {
    try {
      if (!fs.existsSync(targetPath)) return false;
      const stat = fs.statSync(targetPath);
      if (!stat.isFile() || stat.size <= 0) return false;
      if (!sizeApproximate && expectedSize > 0 && stat.size !== expectedSize) return false;
      return true;
    } catch {
      return false;
    }
  }

  private getCachePath(): string {
    return path.join(this.updatesDir, 'release-cache.json');
  }

  private readApiCache(): CachedApiRelease | null {
    try {
      const cachePath = this.getCachePath();
      if (!fs.existsSync(cachePath)) return null;
      const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (parsed && typeof parsed.etag === 'string' && parsed.rawRelease && typeof parsed.rawRelease === 'object') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private writeApiCache(etag: string, rawRelease: any): void {
    if (!etag || !rawRelease) return;
    try {
      fs.mkdirSync(this.updatesDir, { recursive: true });
      fs.writeFileSync(this.getCachePath(), JSON.stringify({ etag, rawRelease }), 'utf8');
    } catch {
      // ignore non-critical cache write failure
    }
  }

  // Primary release lookup via github.com web endpoints (avoids the 60 req/hr unauthenticated api.github.com IP quota).
  private async fetchLatestReleaseFromWeb(signal: AbortSignal): Promise<any | null> {
    const repoBase = `https://github.com/${encodeURIComponent(this.repoOwner)}/${encodeURIComponent(this.repoRepo)}`;
    const latestRes = await fetch(`${repoBase}/releases/latest`, {
      signal,
      redirect: 'follow',
      headers: {
        Accept: 'application/json',
        'User-Agent': `BA-Space/${this.currentVersion}`,
      },
    });

    if (latestRes.status === 404) {
      return null;
    }
    if (!latestRes.ok) {
      throw new Error(`GitHub returned HTTP ${latestRes.status}`);
    }

    let tagName = '';
    const contentType = latestRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const json: any = await latestRes.json();
        if (json && typeof json.tag_name === 'string') {
          tagName = json.tag_name.trim();
        }
      } catch {
        // Fall back to redirected URL
      }
    }
    if (!tagName) {
      tagName = extractTagFromReleaseUrl(latestRes.url);
    }
    if (!tagName) {
      return null;
    }

    const encodedTag = encodeURIComponent(tagName);
    const [assetsRes, atomRes] = await Promise.allSettled([
      fetch(`${repoBase}/releases/expanded_assets/${encodedTag}`, {
        signal,
        headers: {
          Accept: 'text/html',
          'User-Agent': `BA-Space/${this.currentVersion}`,
        },
      }),
      fetch(`${repoBase}/releases.atom`, {
        signal,
        headers: {
          Accept: 'application/atom+xml,application/xml,text/xml',
          'User-Agent': `BA-Space/${this.currentVersion}`,
        },
      }),
    ]);

    let assets: AppReleaseAsset[] = [];
    if (assetsRes.status === 'fulfilled' && assetsRes.value.ok) {
      const html = await assetsRes.value.text();
      assets = parseExpandedAssetsHtml(html, this.repoOwner, this.repoRepo, tagName);
    }

    let atomEntry: { name: string; publishedAt: string; body: string } | null = null;
    if (atomRes.status === 'fulfilled' && atomRes.value.ok) {
      const xml = await atomRes.value.text();
      atomEntry = parseReleasesAtomEntry(xml, tagName);
    }

    return {
      tag_name: tagName,
      name: atomEntry?.name || tagName,
      body: atomEntry?.body || '',
      html_url: `${repoBase}/releases/tag/${encodedTag}`,
      published_at: atomEntry?.publishedAt || '',
      assets,
    };
  }

  // Fallback to GitHub REST API with ETag conditional requests (304 Not Modified does not consume rate limit).
  private async fetchLatestReleaseFromApi(signal: AbortSignal): Promise<any | null> {
    const cached = this.readApiCache();
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(this.repoOwner)}/${encodeURIComponent(this.repoRepo)}/releases/latest`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': `BA-Space/${this.currentVersion}`,
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (cached?.etag) {
      headers['If-None-Match'] = cached.etag;
    }

    const response = await fetch(apiUrl, { signal, headers });

    if (response.status === 304 && cached?.rawRelease) {
      return cached.rawRelease;
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 403 || response.status === 429) {
      if (cached?.rawRelease) {
        return cached.rawRelease;
      }
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0' || response.status === 429) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`GitHub returned HTTP ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`GitHub returned HTTP ${response.status}`);
    }

    const raw = await response.json();
    const etag = response.headers.get('etag');
    if (etag) {
      this.writeApiCache(etag, raw);
    }
    return raw;
  }

  async checkForUpdates(): Promise<AppUpdateState> {
    if (this.activeCheckPromise) {
      return this.activeCheckPromise;
    }
    if (this.state.status === 'downloading') {
      return this.getState();
    }

    this.activeCheckPromise = (async () => {
      this.state = {
        ...this.state,
        status: 'checking',
        error: null,
      };
      this.emitState();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      try {
        let raw: any | null = null;
        let webError: Error | null = null;

        try {
          raw = await this.fetchLatestReleaseFromWeb(controller.signal);
        } catch (err: any) {
          webError = err;
        }

        if (webError || (raw && (!Array.isArray(raw.assets) || raw.assets.length === 0))) {
          try {
            const apiRaw = await this.fetchLatestReleaseFromApi(controller.signal);
            if (apiRaw !== null || webError) {
              raw = apiRaw;
            }
          } catch (apiErr: any) {
            if (!raw) {
              throw webError || apiErr;
            }
          }
        }

        if (!raw) {
          this.state = {
            ...this.state,
            status: 'up-to-date',
            lastCheckedAt: new Date().toISOString(),
            release: null,
            selectedAssetName: null,
            downloadedFilePath: null,
            downloadProgress: null,
            error: null,
          };
          this.emitState();
          return this.getState();
        }

        const parsed: AppReleaseInfo = parseGitHubRelease(
          raw,
          this.currentVersion,
          process.platform,
          process.arch
        );

        const nowIso = new Date().toISOString();

        if (!parsed.updateAvailable) {
          this.state = {
            ...this.state,
            status: 'up-to-date',
            lastCheckedAt: nowIso,
            release: parsed,
            selectedAssetName: parsed.recommendedAsset?.name || parsed.assets[0]?.name || null,
            downloadedFilePath: null,
            downloadProgress: null,
            error: null,
          };
          this.emitState();
          return this.getState();
        }

        const existingSelected = this.state.selectedAssetName
          && parsed.assets.some((asset) => asset.name === this.state.selectedAssetName)
          ? this.state.selectedAssetName
          : null;
        const selectedAssetName = existingSelected
          || parsed.recommendedAsset?.name
          || parsed.assets[0]?.name
          || null;
        const selectedAsset = parsed.assets.find((asset) => asset.name === selectedAssetName) || null;
        const targetPath = selectedAssetName
          ? this.getAssetTargetPath(parsed.tagName, selectedAssetName)
          : null;
        const alreadyDownloaded = Boolean(
          targetPath
          && this.isAssetAlreadyDownloaded(targetPath, selectedAsset?.size || 0, Boolean(selectedAsset?.sizeApproximate))
        );
        const downloadedSize = alreadyDownloaded && targetPath
          ? fs.statSync(targetPath).size
          : 0;

        this.state = {
          ...this.state,
          status: alreadyDownloaded ? 'downloaded' : 'available',
          lastCheckedAt: nowIso,
          release: parsed,
          selectedAssetName,
          downloadedFilePath: alreadyDownloaded ? targetPath : null,
          downloadProgress: alreadyDownloaded
            ? {
                downloadedBytes: downloadedSize,
                totalBytes: downloadedSize,
                percent: 100,
                bytesPerSecond: 0,
              }
            : null,
          error: null,
        };
        this.emitState();
        return this.getState();
      } catch (err: any) {
        const message = err?.name === 'AbortError'
          ? 'Timed out while checking GitHub Releases.'
          : (err?.message || 'Failed to check for updates.');
        this.state = {
          ...this.state,
          status: 'error',
          lastCheckedAt: new Date().toISOString(),
          error: message,
        };
        this.emitState();
        return this.getState();
      } finally {
        clearTimeout(timeout);
        this.activeCheckPromise = null;
      }
    })();

    return this.activeCheckPromise;
  }

  async downloadUpdate(opts?: { assetName?: string }): Promise<{
    success: boolean;
    state: AppUpdateState;
    filePath?: string;
    error?: string;
  }> {
    const release = this.state.release;
    if (!release) {
      return { success: false, state: this.getState(), error: 'No release information loaded.' };
    }

    const desiredName = opts?.assetName || this.state.selectedAssetName || release.recommendedAsset?.name || '';
    const asset = release.assets.find((item) => item.name === desiredName) || release.recommendedAsset || release.assets[0];
    if (!asset) {
      return { success: false, state: this.getState(), error: 'No downloadable installer asset found for this release.' };
    }

    const expectedPrefix = `https://github.com/${this.repoOwner}/${this.repoRepo}/releases/download/`;
    if (!asset.downloadUrl.startsWith(expectedPrefix)) {
      return { success: false, state: this.getState(), error: 'Untrusted release asset download URL.' };
    }

    const targetPath = this.getAssetTargetPath(release.tagName, asset.name);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    if (this.isAssetAlreadyDownloaded(targetPath, asset.size, Boolean(asset.sizeApproximate))) {
      const actualSize = fs.statSync(targetPath).size;
      this.state = {
        ...this.state,
        status: 'downloaded',
        selectedAssetName: asset.name,
        downloadedFilePath: targetPath,
        downloadProgress: {
          downloadedBytes: actualSize,
          totalBytes: actualSize,
          percent: 100,
          bytesPerSecond: 0,
        },
        error: null,
      };
      this.emitState();
      return { success: true, state: this.getState(), filePath: targetPath };
    }

    if (this.activeDownloadController) {
      this.activeDownloadController.abort();
      this.activeDownloadController = null;
    }

    const controller = new AbortController();
    this.activeDownloadController = controller;

    const partPath = `${targetPath}.part`;
    try {
      if (fs.existsSync(partPath)) {
        fs.rmSync(partPath, { force: true });
      }
    } catch {
      // ignore stale part cleanup error
    }

    this.state = {
      ...this.state,
      status: 'downloading',
      selectedAssetName: asset.name,
      downloadedFilePath: null,
      error: null,
      downloadProgress: {
        downloadedBytes: 0,
        totalBytes: asset.size || 0,
        percent: 0,
        bytesPerSecond: 0,
      },
    };
    this.emitState();

    let fileStream: fs.WriteStream | null = null;
    try {
      const response = await fetch(asset.downloadUrl, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': `BA-Space/${this.currentVersion}`,
          Accept: 'application/octet-stream',
        },
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to download update (HTTP ${response.status})`);
      }

      const contentLength = Number(response.headers.get('content-length')) || 0;
      const totalBytes = contentLength > 0 ? contentLength : (asset.size || 0);
      fileStream = fs.createWriteStream(partPath);
      const reader = response.body.getReader();

      let downloadedBytes = 0;
      const startedAt = Date.now();
      let lastEmitAt = 0;

      const writeChunk = (chunk: Uint8Array) =>
        new Promise<void>((resolve, reject) => {
          if (!fileStream) {
            reject(new Error('Download stream closed'));
            return;
          }
          const ok = fileStream.write(chunk);
          if (ok) {
            resolve();
          } else {
            fileStream.once('drain', resolve);
            fileStream.once('error', reject);
          }
        });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value || value.byteLength === 0) continue;

        await writeChunk(value);
        downloadedBytes += value.byteLength;

        const now = Date.now();
        if (now - lastEmitAt >= 120) {
          lastEmitAt = now;
          const elapsedSec = Math.max((now - startedAt) / 1000, 0.05);
          const bytesPerSecond = Math.round(downloadedBytes / elapsedSec);
          const percent = totalBytes > 0
            ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100))
            : 0;
          this.state = {
            ...this.state,
            downloadProgress: {
              downloadedBytes,
              totalBytes,
              percent,
              bytesPerSecond,
            },
          };
          this.emitState();
        }
      }

      await new Promise<void>((resolve, reject) => {
        if (!fileStream) {
          resolve();
          return;
        }
        fileStream.once('error', reject);
        fileStream.end(() => resolve());
      });
      fileStream = null;

      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { force: true });
      }
      fs.renameSync(partPath, targetPath);

      const finalTotal = totalBytes > 0 ? totalBytes : downloadedBytes;
      const elapsedSec = Math.max((Date.now() - startedAt) / 1000, 0.05);

      this.state = {
        ...this.state,
        status: 'downloaded',
        downloadedFilePath: targetPath,
        downloadProgress: {
          downloadedBytes,
          totalBytes: finalTotal,
          percent: 100,
          bytesPerSecond: Math.round(downloadedBytes / elapsedSec),
        },
        error: null,
      };
      this.emitState();
      return { success: true, state: this.getState(), filePath: targetPath };
    } catch (err: any) {
      if (fileStream) {
        try {
          fileStream.destroy();
        } catch {
          // ignore
        }
        fileStream = null;
      }
      try {
        if (fs.existsSync(partPath)) {
          fs.rmSync(partPath, { force: true });
        }
      } catch {
        // ignore cleanup error
      }

      if (err?.name === 'AbortError') {
        this.state = {
          ...this.state,
          status: 'available',
          downloadedFilePath: null,
          downloadProgress: null,
          error: null,
        };
        this.emitState();
        return { success: false, state: this.getState(), error: 'Download canceled' };
      }

      const message = err?.message || 'Failed to download update.';
      this.state = {
        ...this.state,
        status: 'error',
        downloadedFilePath: null,
        downloadProgress: null,
        error: message,
      };
      this.emitState();
      return { success: false, state: this.getState(), error: message };
    } finally {
      if (this.activeDownloadController === controller) {
        this.activeDownloadController = null;
      }
    }
  }

  cancelDownload(): { success: boolean; state: AppUpdateState } {
    if (this.activeDownloadController) {
      this.activeDownloadController.abort();
      this.activeDownloadController = null;
    }
    return { success: true, state: this.getState() };
  }

  async installUpdate(): Promise<{
    success: boolean;
    action?: 'launched-and-quitting' | 'opened' | 'revealed';
    error?: string;
  }> {
    const filePath = this.state.downloadedFilePath;
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'Downloaded update file not found on disk.' };
    }

    const fileName = path.basename(filePath);

    try {
      if (process.platform === 'win32') {
        if (/setup/i.test(fileName) && /\.exe$/i.test(fileName)) {
          await this.spawnDetachedInstaller(filePath);
          setTimeout(() => this.app.quit(), 400);
          return { success: true, action: 'launched-and-quitting' };
        }
        this.shell.showItemInFolder(filePath);
        return { success: true, action: 'revealed' };
      }

      if (process.platform === 'darwin') {
        const openError = await this.shell.openPath(filePath);
        if (openError) {
          this.shell.showItemInFolder(filePath);
          return { success: true, action: 'revealed' };
        }
        return { success: true, action: 'opened' };
      }

      if (/\.appimage$/i.test(fileName)) {
        fs.chmodSync(filePath, 0o755);
        try {
          await this.spawnDetachedInstaller(filePath);
          setTimeout(() => this.app.quit(), 400);
          return { success: true, action: 'launched-and-quitting' };
        } catch {
          this.shell.showItemInFolder(filePath);
          return { success: true, action: 'revealed' };
        }
      }

      this.shell.showItemInFolder(filePath);
      return { success: true, action: 'revealed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to launch installer.' };
    }
  }

  private spawnDetachedInstaller(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(filePath, [], {
        detached: true,
        stdio: 'ignore',
      });
      child.once('error', reject);
      child.once('spawn', () => {
        child.on('error', () => {});
        child.unref();
        resolve();
      });
    });
  }

  revealDownloadedFile(): { success: boolean; error?: string } {
    const filePath = this.state.downloadedFilePath;
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'Downloaded update file not found.' };
    }
    this.shell.showItemInFolder(filePath);
    return { success: true };
  }

  openReleasePage(): { success: boolean; error?: string } {
    const url = this.state.release?.htmlUrl
      || `https://github.com/${this.repoOwner}/${this.repoRepo}/releases`;
    if (!/^https:\/\//i.test(url)) {
      return { success: false, error: 'Unsupported release URL.' };
    }
    Promise.resolve(this.shell.openExternal(url)).catch((err) => {
      console.error('Failed to open release page:', err);
    });
    return { success: true };
  }
}
