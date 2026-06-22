#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function fail(message) {
  failures.push(message);
}

for (const rel of [
  'src/index.html',
  'src/style.css',
  'src/main.js',
  'src/_headers',
  'functions/api/hello.js',
  'functions/api/visits.js',
  'wrangler.toml',
]) {
  if (!exists(rel)) fail(`missing required deploy file: ${rel}`);
}

if (failures.length === 0) {
  const pkg = JSON.parse(read('package.json'));
  const wrangler = read('wrangler.toml');
  const html = read('src/index.html');
  const headers = read('src/_headers');

  if (pkg.private !== true) {
    fail('package.json must remain private; this repo is a cloneable starter, not an npm package release');
  }
  if (!Array.isArray(pkg.files) || pkg.files.length === 0) {
    fail('package.json files[] must declare the intentional npm pack boundary');
  }
  if (!/pages_build_output_dir\s*=\s*"src"/.test(wrangler)) {
    fail('wrangler.toml must keep pages_build_output_dir = "src"');
  }
  if (!/\bwrangler pages deploy src\b/.test(pkg.scripts?.deploy ?? '')) {
    fail('package.json deploy script must deploy src/');
  }
  if (pkg.scripts?.predeploy !== 'npm run deploy:preflight') {
    fail('package.json must run deploy:preflight before local deploy');
  }
  if (pkg.scripts?.['deploy:preflight'] !== 'node scripts/deploy-preflight.cjs') {
    fail('package.json must expose deploy:preflight');
  }
  if (!html.includes('href="style.css"')) {
    fail('src/index.html must reference style.css');
  }
  if (!html.includes('src="main.js"')) {
    fail('src/index.html must reference main.js');
  }
  for (const requiredHeader of [
    'Strict-Transport-Security:',
    'Content-Security-Policy:',
    'Permissions-Policy:',
    'X-Content-Type-Options:',
  ]) {
    if (!headers.includes(requiredHeader)) {
      fail(`src/_headers must include ${requiredHeader}`);
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) console.error(`build check: ${message}`);
  process.exit(1);
}

console.log('Build contract verified: src/ is ready for Cloudflare Pages deploy.');
