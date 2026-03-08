#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push .githooks/guard-worktree-and-branch.sh

echo "git hooks configured: .githooks"
