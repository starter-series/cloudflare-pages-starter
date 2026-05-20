# Branch Protection — recommended ruleset

GitHub branch protection cannot be enforced from inside the repository, so it
must be configured by a repo admin. This file documents the expected ruleset
for `main` so downstream forks of this starter inherit the same guarantees.

## Recommended `main` ruleset

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | ✅ | All changes pass through review + CI |
| Required approvals | 1 (or more) | At least one reviewer signs off |
| Dismiss stale approvals on new commit | ✅ | Force re-review when the diff changes |
| Require status checks to pass | ✅ | CI gate |
| Required checks | `ci`, `CodeQL` | Match the workflow `name:` values |
| Require branches to be up to date | ✅ | Avoid landing onto a stale base |
| Require signed commits | ✅ | Provenance for who authored what |
| Require linear history | ✅ | Squash-only merges; clean log |
| Block force pushes | ✅ | Protects rewrite of history |
| Block deletions | ✅ | `main` cannot be deleted |
| Restrict who can push | (admins / nobody) | Direct pushes bypass the PR gate |

## Apply via `gh`

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/:owner/:repo/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "ci" },
      { "context": "CodeQL" }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "required_signatures": true
}
EOF
```

Replace `:owner/:repo` with the path of your fork. Re-run the same payload to
update existing protection — the call is idempotent.

## Why these specific defaults

- **Required checks pinned to `ci` and `CodeQL`** mirrors the two
  always-on workflows. Adding `Maintenance` would block PRs whenever the
  weekly health check happens to be red — that is what the maintenance
  issue is for, not the merge gate.
- **`require_code_owner_reviews: true`** pairs with `.github/CODEOWNERS`
  so changes to `_headers`, `functions/api/*`, and `.github/workflows/*`
  always notify the right owner.
- **`required_signatures: true`** rejects unsigned commits at push time.
  Enable signing locally with `git config commit.gpgsign true` (GPG) or
  `git config gpg.format ssh` + `git config commit.gpgsign true` (SSH).
