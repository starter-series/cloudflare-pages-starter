import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { findDeployPreflightIssues } = require('../scripts/deploy-preflight.cjs');

test('deploy preflight rejects direct-clone placeholder metadata', () => {
  const issues = findDeployPreflightIssues({
    pkg: {
      name: 'my-site',
      repository: { url: 'https://github.com/YOUR_USERNAME/YOUR_SITE.git' },
    },
    env: { PROJECT_NAME: 'my-site' },
    requireProjectNameEnv: true,
  });

  assert.deepEqual(issues.map((issue) => issue.field), [
    'name',
    'repository.url',
    'PROJECT_NAME',
  ]);
});

test('deploy preflight accepts customized project metadata', () => {
  const issues = findDeployPreflightIssues({
    pkg: {
      name: 'launch-site',
      repository: { url: 'https://github.com/site-owner/launch-site.git' },
    },
    env: { PROJECT_NAME: 'launch-site' },
    requireProjectNameEnv: true,
  });

  assert.deepEqual(issues, []);
});
