---
name: git-commit
description: Create focused Git commits with one purpose per commit and no mixed intent, using repository-root `git -C` operations for `.worktree` paths in this repository. Use when asked to commit current changes, split changes into multiple commits, prepare commit messages, or standardize commit flow/approval scope for worktree-based development.
---

# Git Commit

## Overview

Create minimal, single-purpose commits from a target worktree.
Use deterministic `git -C <repo-root-or-worktree>` commands and separate logic, test addition, and test fixes into different commits.

## Allowed Command Scope

Use only:

- `git *`
- `pwd`
- `ls *`

Do not use other command families unless the user explicitly requests them.

## Inputs To Collect

Always collect:

- Repository root path (`REPO_ROOT`): `git rev-parse --show-toplevel`
- Target worktree path (`WORKTREE_DIR`) under `${REPO_ROOT}/.worktree/...`
- `git -C "${WORKTREE_DIR}" status --short`
- `git -C "${WORKTREE_DIR}" diff`
- `git -C "${WORKTREE_DIR}" diff --cached`

If staged changes already exist, treat them as an intentional partial commit and review with `diff --cached` first.

## Commit Granularity Rules

Follow these rules strictly:

1. Keep `1 commit = 1 purpose` at the smallest practical unit.
2. Do not mix multiple intents in one commit.
3. Separate at least these categories when present:
- Logic implementation
- New tests
- Test-only fixes/refactors
4. If split is ambiguous, prefer more commits with clearer intent.
5. Do not stage unrelated files only to reduce commit count.

## Worktree-First Execution Workflow

Run in this order.

1. Resolve root and target:

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="${REPO_ROOT}/.worktree/<name>"
```

2. Inspect change groups:

```bash
git -C "${WORKTREE_DIR}" status --short
git -C "${WORKTREE_DIR}" diff
git -C "${WORKTREE_DIR}" diff --cached
```

3. Stage only the first intent:

```bash
git -C "${WORKTREE_DIR}" add <files-for-one-intent>
git -C "${WORKTREE_DIR}" diff --cached
```

4. Commit with concrete message:

```bash
git -C "${WORKTREE_DIR}" commit -m "<type(scope): summary>"
```

5. Repeat steps 3-4 per intent until no unstaged/staged changes remain.

## Commit Message Guidance

Use concise, reviewable messages.

- Good: `feat(slice): add hue plane sampling`
- Good: `test(slice): add hue plane boundary cases`
- Good: `test(slice): fix flaky tolerance assertion`
- Bad: `update`, `fix`, `いろいろ対応`

## Approval Scope Strategy (`prefix_rule`)

When escalation approval is needed, prefer narrow command families so permissions stay organized.

Request separately by action type:

- Status/diff read:
  - `["git", "-C", "<worktree-dir>", "status"]`
  - `["git", "-C", "<worktree-dir>", "diff"]`
- Staging:
  - `["git", "-C", "<worktree-dir>", "add"]`
  - `["git", "-C", "<worktree-dir>", "restore", "--staged"]`
- Commit:
  - `["git", "-C", "<worktree-dir>", "commit"]`

Avoid broad prefixes such as `["git"]` or `["git", "-C"]`.

## Output Requirements

Always report:

- Target worktree path
- Commit split rationale (why each commit is single-purpose)
- Files included in each commit
- Final `git -C "${WORKTREE_DIR}" status --short` result
