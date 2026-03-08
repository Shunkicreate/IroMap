#!/usr/bin/env bash
set -euo pipefail

require_worktree_checkout() {
  local toplevel
  toplevel="$(git rev-parse --show-toplevel)"

  if [[ "$toplevel" != *"/.worktree/"* ]]; then
    echo "ERROR: 作業は .worktree 配下でのみ許可されています: $toplevel" >&2
    echo "ERROR: .worktree/feature-* に移動して実行してください。" >&2
    exit 1
  fi
}

reject_main_branch() {
  local branch
  branch="$(git symbolic-ref --quiet --short HEAD || true)"

  if [[ "$branch" == "main" ]]; then
    echo "ERROR: main ブランチでの修正（commit/push）は禁止されています。" >&2
    echo "ERROR: main から feature/* を作成し、.worktree で作業してください。" >&2
    exit 1
  fi
}

require_feature_branch() {
  local branch
  branch="$(git symbolic-ref --quiet --short HEAD || true)"

  if [[ -z "$branch" ]]; then
    echo "ERROR: detached HEAD では commit/push できません。" >&2
    echo "ERROR: feature/* ブランチに切り替えてください。" >&2
    exit 1
  fi

  if [[ "$branch" != feature/* ]]; then
    echo "ERROR: commit/push は feature/* ブランチでのみ許可されています: $branch" >&2
    exit 1
  fi
}
