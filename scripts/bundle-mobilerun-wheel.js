// Builds the mobilerun-mcp wheel that BA Space ships in toolkits/BAKit/mcp/ from the source in mobilerun-mcp/.
// Runs before every packaged build (npm run pack/make, release workflow). Needs uv on PATH.
// Mobilerun setup installs mobilerun-mcp from this wheel and offers an update when its sha256 changes. Hatchling
// wheels are reproducible and .gitattributes pins the source to LF, so unchanged source gives the same bytes.
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const WHEEL_PATTERN = /^mobilerun_mcp-.+\.whl$/;
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'mobilerun-mcp');
const outDir = path.join(root, 'toolkits', 'BAKit', 'mcp');

function fail(message) {
  console.error(`bundle-mobilerun-wheel: ${message}`);
  process.exit(1);
}

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (!fs.existsSync(path.join(source, 'pyproject.toml'))) fail(`no pyproject.toml in ${source}`);

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'mobilerun-wheel-'));
try {
  const result = spawnSync('uv', ['build', '--wheel', '--out-dir', staging, source], { stdio: 'inherit' });
  if (result.error && result.error.code === 'ENOENT') fail('uv is not on PATH: https://docs.astral.sh/uv/getting-started/installation/');
  if (result.status !== 0) fail(`uv build failed (${result.status})`);
  const wheel = fs.readdirSync(staging).find((n) => WHEEL_PATTERN.test(n));
  if (!wheel) fail(`uv build produced no mobilerun_mcp wheel in ${staging}`);

  const built = path.join(staging, wheel);
  const previous = fs.readdirSync(outDir).filter((n) => WHEEL_PATTERN.test(n));
  if (previous.length === 1 && previous[0] === wheel && sha256(path.join(outDir, wheel)) === sha256(built)) {
    console.log(`${wheel} is up to date`);
  } else {
    for (const n of previous) fs.rmSync(path.join(outDir, n), { force: true });
    fs.copyFileSync(built, path.join(outDir, wheel));
    console.log(`Bundled ${wheel} into toolkits/BAKit/mcp`);
  }
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
