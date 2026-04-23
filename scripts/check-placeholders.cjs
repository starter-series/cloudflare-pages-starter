#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const pkgPath = path.resolve(__dirname, '..', 'package.json');

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch {
  // Missing or unreadable package.json — nothing to check, don't block install.
  process.exit(0);
}

const issues = [];

if (pkg && pkg.name === 'my-site') {
  issues.push({ field: 'name', value: pkg.name, hint: 'your Cloudflare Pages project name' });
}

const repoUrl = pkg && pkg.repository && typeof pkg.repository === 'object'
  ? pkg.repository.url
  : (typeof (pkg && pkg.repository) === 'string' ? pkg.repository : undefined);

if (typeof repoUrl === 'string' && (repoUrl.includes('YOUR_USERNAME') || repoUrl.includes('YOUR_SITE'))) {
  issues.push({ field: 'repository.url', value: repoUrl, hint: 'your GitHub repo URL' });
}

if (issues.length === 0) {
  process.exit(0);
}

const lines = [];
lines.push(`${RED}${BOLD}[cloudflare-pages-starter] placeholder values detected in package.json${RESET}`);
lines.push(`${YELLOW}CD will break until these are replaced:${RESET}`);
for (const { field, value, hint } of issues) {
  lines.push(`  ${RED}- ${field}${RESET} = ${JSON.stringify(value)}  ${YELLOW}(replace with ${hint})${RESET}`);
}
lines.push(`${YELLOW}See README for setup steps. This is a warning, not an error.${RESET}`);

console.warn(lines.join('\n'));
process.exit(0);
