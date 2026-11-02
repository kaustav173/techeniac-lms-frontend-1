# Git Safety Rules

These rules are non-negotiable and apply to all agents and automated tools working on `TechEniac-lms-frontend`.

## Mandatory Approval for State-Changing Commands

- Every Git or GitHub CLI (`gh`) command that alters repository state (creating commits, modifying branches, switching branches, staging files, pushing, rebasing, stashing, tagging, etc.) requires explicit, per-command user approval.
- Present the exact command string to the user before proposing its execution.
- Read-only Git commands (`git status`, `git diff`, `git log`) do not alter state and may be run to verify working tree status.

## Prohibited Commands & Flags

- **`git add .` and `git add -A`**: Strictly prohibited. Files must be staged individually by exact file path (e.g. `git add app/layout.tsx`).
- **`git push --force` and `git push -f`**: Strictly prohibited. Force-pushing overrides history and can cause irreversible data loss.
- **`git reset --hard`**: Strictly prohibited. Hard resets destroy uncommitted or unstaged changes.
- **`--no-verify`**: Strictly prohibited. Git hooks and validation checks must never be bypassed.

## Branch Discipline

- All work must be conducted on feature, fix, or chore branches (`feat/*`, `fix/*`, `chore/*`) created from `dev`.
- Direct commits to protected branches (`main`, `staging`, and `dev`) are strictly prohibited and blocked by pre-commit hooks.
- All changes must arrive via reviewed and CI-passed Pull Requests with Conventional Commits.
- **Pre-Coding Branch Planning & Permission**: Before writing or modifying any code for any feature, module, or change request:
  - Check the active branch.
  - Identify the exact branch needed (`feat/*`, `fix/*`, `chore/*`).
  - For large features/modules, propose a complete multi-branch roadmap upfront and get user approval.
  - Ask for explicit user permission before creating or switching branches.
  - Always verify that the repository is on the target branch before applying any code changes.
- **Diff Size Limit & User Confirmation**: Changes in a single branch or PR must not exceed ~400 lines of code. If a planned implementation or task requires more than 400 lines of code change in a single branch, the agent must ask the user for explicit permission/confirmation before making those changes (or propose splitting them into smaller PRs).
