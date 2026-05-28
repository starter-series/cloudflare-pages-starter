#!/usr/bin/env node

// Pre-test guard: `node --test` (default discovery) exits 0 when zero tests
// are found, so a refactor that moves or renames `tests/` would pass CI green
// with zero coverage. This script fails loudly if no test files match the
// auto-discovery pattern.

const fs = require('node:fs');
const path = require('node:path');

const TESTS_DIR = path.resolve(__dirname, '..', 'tests');
const TEST_FILE_RE = /\.test\.(js|cjs|mjs)$/;

let count = 0;
try {
  count = fs.readdirSync(TESTS_DIR).filter((f) => TEST_FILE_RE.test(f)).length;
} catch (e) {
  console.error(`pretest: cannot read ${TESTS_DIR} — ${e.message}`);
  process.exit(1);
}

if (count === 0) {
  console.error(
    `pretest: no test files found under ${TESTS_DIR} (expected *.test.{js,cjs,mjs}). ` +
    `\`node --test\` would exit 0 silently — failing here instead so CI catches the regression.`,
  );
  process.exit(1);
}
