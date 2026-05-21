#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const level = process.argv[2];
if (!['major', 'minor', 'patch'].includes(level)) {
  console.error('Usage: node bump-version.cjs <major|minor|patch>');
  process.exit(1);
}

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const previous = pkg.version;

// Strict semver: numeric major.minor.patch only. Pre-release / build-metadata
// tags drop information when bumped (e.g. "1.2.3-alpha" + patch → ambiguous),
// so refuse instead of writing a silently-broken version like "1.2.NaN".
const STRICT_SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const m = STRICT_SEMVER.exec(previous);
if (!m) {
  console.error(
    `bump-version: refusing to bump non-numeric version "${previous}". ` +
    `Expected major.minor.patch (e.g. 1.2.3). Strip any pre-release / build ` +
    `metadata before bumping.`,
  );
  process.exit(1);
}
const major = Number(m[1]);
const minor = Number(m[2]);
const patch = Number(m[3]);

const next =
  level === 'major' ? `${major + 1}.0.0` :
  level === 'minor' ? `${major}.${minor + 1}.0` :
  `${major}.${minor}.${patch + 1}`;

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`${previous} → ${next}`);
