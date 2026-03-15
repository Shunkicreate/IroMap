#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <feature-branch-name> [base-ref]" >&2
  echo "Example: $0 feature/my-task main" >&2
  exit 1
}

if [[ "${1:-}" == "" ]]; then
  usage
fi

branch="$1"
base_ref="${2:-main}"
resolved_base_ref="$base_ref"

if [[ "$branch" != feature/* ]]; then
  echo "ERROR: branch name must start with feature/: $branch" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

worktree_path="$repo_root/.worktree/$branch"

if [[ -e "$worktree_path" ]]; then
  echo "ERROR: worktree path already exists: $worktree_path" >&2
  exit 1
fi

if [[ "$base_ref" == "main" || "$base_ref" == "origin/main" ]]; then
  echo "Fetching latest origin/main"
  git fetch origin main
  resolved_base_ref="refs/remotes/origin/main"
fi

if git show-ref --verify --quiet "refs/heads/$branch"; then
  git worktree add "$worktree_path" "$branch"
else
  git worktree add -b "$branch" "$worktree_path" "$resolved_base_ref"
fi

echo "Running pnpm setup in: $worktree_path"
pnpm -C "$worktree_path" install
pnpm --dir "$worktree_path/web" install

echo "Done: $worktree_path"
