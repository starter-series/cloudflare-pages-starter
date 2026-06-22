#!/usr/bin/env node

const {
  findPlaceholderIssues,
  readPackageJson,
} = require('./check-placeholders.cjs');

function hasDefaultProjectName(value) {
  return typeof value !== 'string' || value.trim() === '' || value.trim() === 'my-site';
}

function findDeployPreflightIssues({ pkg, env = {}, requireProjectNameEnv = false }) {
  const issues = findPlaceholderIssues(pkg);
  const projectName = env.PROJECT_NAME;

  if (requireProjectNameEnv && hasDefaultProjectName(projectName)) {
    issues.push({
      field: 'PROJECT_NAME',
      value: projectName,
      hint: 'set the repo-hosted CI variable to the deploy project name',
    });
  } else if (typeof projectName === 'string' && projectName.trim() === 'my-site') {
    issues.push({
      field: 'PROJECT_NAME',
      value: projectName,
      hint: 'replace the default deploy project name',
    });
  }

  return issues;
}

function formatDeployPreflightFailure(issues) {
  const lines = ['[deploy preflight] failed.'];
  lines.push('Replace placeholder/default project metadata before deploying:');
  for (const { field, value, hint } of issues) {
    lines.push(`- ${field} = ${JSON.stringify(value)} (${hint})`);
  }
  return lines.join('\n');
}

function main() {
  const requireProjectNameEnv = process.argv.includes('--require-project-name-env');
  const pkg = readPackageJson();
  const issues = findDeployPreflightIssues({
    pkg,
    env: process.env,
    requireProjectNameEnv,
  });

  if (issues.length > 0) {
    console.error(formatDeployPreflightFailure(issues));
    process.exit(1);
  }

  console.log('Deploy preflight passed.');
}

if (require.main === module) {
  main();
}

module.exports = {
  findDeployPreflightIssues,
  formatDeployPreflightFailure,
};
