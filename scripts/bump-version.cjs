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

// Strict SemVer 2.0.0 §2: numeric major.minor.patch with NO leading zeros, NO
// pre-release tag, NO build metadata. Tightening to `(0|[1-9]\d*)` (rather
// than `\d+`) keeps the script consistent with cd.yml's Version guard —
// otherwise `01.02.03` would silently re-write as `1.2.4`. Refuse instead.
const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const m = previous.match(STRICT_SEMVER);
if (!m) {
  console.error(
    `bump-version: refusing to bump non-canonical version "${previous}". ` +
    `Expected strict SemVer major.minor.patch (e.g. 1.2.3) with no leading ` +
    `zeros, no pre-release tag, and no build metadata.`,
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
