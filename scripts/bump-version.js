#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const level = process.argv[2];
if (!['major', 'minor', 'patch'].includes(level)) {
  console.error('Usage: node bump-version.js <major|minor|patch>');
  process.exit(1);
}

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const previous = pkg.version;
const [major, minor, patch] = previous.split('.').map(Number);
const next =
  level === 'major' ? `${major + 1}.0.0` :
  level === 'minor' ? `${major}.${minor + 1}.0` :
  `${major}.${minor}.${patch + 1}`;

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`${previous} → ${next}`);
