---
name: git-worktree
description: Create, reuse, list, and remove Git worktrees for isolated parallel branch work in this repository. Use when asked to start work in a separate directory, prepare a branch-specific workspace, clean up merged worktrees, or recover broken worktree metadata.
---

# Git Worktree

## Overview

Manage isolated workspaces by using `git worktree` so the main working tree stays clean.
Prefer deterministic command sequences and report exactly what was created, reused, or removed.

## Command Scope

Use only:

- `git worktree *`
- `git branch *`
- `git checkout *`
- `git fetch *`
- `git status *`
- `git rev-parse *`
- `cd *`
- `pnpm --dir web install *`
- `pnpm run setup:hooks`
- `pnpm run setup:hooks:check`

## Inputs To Collect

Collect these before creating or switching:

- Target branch name (`BRANCH_NAME`)
- Target worktree directory (`WORKTREE_DIR`)
- Base branch (default `develop` unless user specifies)

## Create Or Reuse Workflow

Run in this order.

1. Move to repository root.

```bash
cd "$(git rev-parse --show-toplevel)"
```

2. Check existing worktree.

```bash
git worktree list | grep "${WORKTREE_DIR}"
```

3. If existing worktree is found, reuse it.

```bash
cd "${WORKTREE_DIR}"
git fetch origin
git status
pnpm --dir web install --frozen-lockfile
pnpm run setup:hooks
pnpm run setup:hooks:check
```

4. If no existing worktree is found, create one.

- New branch from base branch:

```bash
git worktree add "${WORKTREE_DIR}" -b "${BRANCH_NAME}" "${BASE_BRANCH:-develop}"
```

- Existing branch:

```bash
git worktree add "${WORKTREE_DIR}" "${BRANCH_NAME}"
```

5. Move into worktree and verify.

```bash
cd "${WORKTREE_DIR}"
git status
pnpm --dir web install --frozen-lockfile
pnpm run setup:hooks
pnpm run setup:hooks:check
```

6. If `pnpm --dir web install --frozen-lockfile` fails due to lock mismatch, run:

```bash
pnpm --dir web install --no-frozen-lockfile
```

Then rerun hook setup:

```bash
pnpm run setup:hooks
pnpm run setup:hooks:check
```

## Branch Conflict Handling

When `-b "${BRANCH_NAME}"` fails because the branch already exists:

1. Stop automatic creation.
2. Report conflict clearly.
3. Ask user whether to:

- reuse existing branch with `git worktree add "${WORKTREE_DIR}" "${BRANCH_NAME}"`, or
- choose another branch name.

## Remove Workflow

Run removal only from main worktree.

1. Move to repository root.

```bash
cd "$(git rev-parse --show-toplevel)"
```

2. Remove target worktree.

```bash
git worktree remove "${WORKTREE_DIR}"
```

3. If user explicitly requests branch deletion, remove branch.

- Safe delete:

```bash
git branch -d "${BRANCH_NAME}"
```

- Force delete (only with explicit user approval):

```bash
git branch -D "${BRANCH_NAME}"
```

## Recovery

When removal fails due to stale metadata or manually deleted directory:

```bash
git worktree prune
```

## Naming Conventions

Use predictable naming and keep branch and directory related.

Examples:

- `feature/issue-123-add-profile-api` + `.worktree/issue-123`
- `feature/add-profile-api` + `.worktree/add-profile-api`
- `hotfix/fix-login-bug` + `.worktree/hotfix-login-bug`

## Output Requirements

Always report:

- Selected base branch
- Final worktree path
- Final checked-out branch
- Whether action was `created`, `reused`, `removed`, or `pruned`
- Whether environment setup was `completed` (`pnpm install` + hooks)
