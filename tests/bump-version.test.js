import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(HERE, '..', 'scripts', 'bump-version.cjs');

// SYNC CALLBACKS ONLY. `rmSync` in `finally` runs before a Promise resolves,
// so an async `fn` would have its tempdir deleted mid-await. Enforced at
// runtime by rejecting Promise return values.
function withTempPkg(version, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'bump-version-'));
  try {
    // Mirror the on-disk layout the script expects: <repo>/scripts/<file>
    // and <repo>/package.json, where __dirname is <repo>/scripts.
    const scriptsDir = join(dir, 'scripts');
    cpSync(dirname(SCRIPT), scriptsDir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 't', version }, null, 2) + '\n');
    const result = fn(dir);
    if (result && typeof result.then === 'function') {
      throw new TypeError(
        'withTempPkg callback must be synchronous; rmSync cleanup runs before ' +
        'an async callback resolves, leaving the test reading a deleted path.',
      );
    }
    return result;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function run(dir, level) {
  try {
    const out = execFileSync('node', [join(dir, 'scripts', 'bump-version.cjs'), level], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout?.toString() ?? '', stderr: e.stderr?.toString() ?? '' };
  }
}

function versionOf(dir) {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
}

test('patch bumps the last segment', () => {
  withTempPkg('1.2.3', (d) => {
    const r = run(d, 'patch');
    assert.equal(r.code, 0);
    assert.equal(versionOf(d), '1.2.4');
  });
});

test('minor bumps middle and zeros patch', () => {
  withTempPkg('1.2.3', (d) => {
    const r = run(d, 'minor');
    assert.equal(r.code, 0);
    assert.equal(versionOf(d), '1.3.0');
  });
});

test('major bumps first and zeros the rest', () => {
  withTempPkg('1.2.3', (d) => {
    const r = run(d, 'major');
    assert.equal(r.code, 0);
    assert.equal(versionOf(d), '2.0.0');
  });
});

test('refuses pre-release version instead of writing 1.2.NaN', () => {
  withTempPkg('1.2.3-alpha', (d) => {
    const r = run(d, 'patch');
    assert.equal(r.code, 1, 'must exit non-zero');
    assert.match(r.stderr, /refusing to bump/);
    // Crucially: the original version is preserved on disk.
    assert.equal(versionOf(d), '1.2.3-alpha');
  });
});

test('refuses build-metadata version', () => {
  withTempPkg('1.2.3+build.5', (d) => {
    const r = run(d, 'minor');
    assert.equal(r.code, 1);
    assert.equal(versionOf(d), '1.2.3+build.5');
  });
});

test('refuses garbage version', () => {
  withTempPkg('not-a-version', (d) => {
    const r = run(d, 'patch');
    assert.equal(r.code, 1);
    assert.equal(versionOf(d), 'not-a-version');
  });
});

test('refuses unknown level argument', () => {
  withTempPkg('1.2.3', (d) => {
    const r = run(d, 'huge');
    assert.equal(r.code, 1);
    assert.match(r.stderr, /Usage/);
    assert.equal(versionOf(d), '1.2.3');
  });
});

test('refuses leading-zero version (would silently renumber to 1.2.4)', () => {
  withTempPkg('01.02.03', (d) => {
    const r = run(d, 'patch');
    assert.equal(r.code, 1);
    assert.match(r.stderr, /non-canonical/);
    assert.equal(versionOf(d), '01.02.03');
  });
});
