import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

// Adds pattern to .git/info/exclude (resolved per worktree), so the repo's .gitignore stays untouched.
// Does nothing outside a git repo or when the pattern is already there.
export function excludeFromGit(folderPath: string, pattern: string): void {
  try {
    const rel = execFileSync('git', ['rev-parse', '--git-path', 'info/exclude'], { cwd: folderPath, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const excludePath = path.resolve(folderPath, rel);
    const current = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf-8') : '';
    if (current.split(/\r?\n/).some((line) => line.trim() === pattern)) return;
    fs.mkdirSync(path.dirname(excludePath), { recursive: true });
    fs.appendFileSync(excludePath, `${current && !current.endsWith('\n') ? '\n' : ''}${pattern}\n`);
  } catch (_) {
    // Not a git repo.
  }
}
