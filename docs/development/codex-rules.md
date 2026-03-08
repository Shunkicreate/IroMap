# Codex Rules Guide

このドキュメントは `codex/rules/` を運用するための方針を定義する。
内容は OpenAI Codex Rules 公式ガイド（<https://developers.openai.com/codex/rules/）に準拠する。>

## 1. 公式仕様との対応

- 公式ページの `rules` は、主にコマンド承認制御（`prefix_rule`）の仕組みを指す。
- `Smart approvals` が有効な場合、昇格時に `prefix_rule` 提案が表示される。
- TUI で許可した内容はユーザーレイヤ（`~/.codex/rules/default.rules`）へ保存される。

## 2. このリポジトリ方針
- `codex/rules/*.md` は開発ルール参照入口として維持する。
- 実際のコマンド承認制御は `codex/rules/40-permissions.rules` で管理する。
- 公式仕様どおり、複数ルールがマッチした場合は最も厳しい判定（`forbidden > prompt > allow`）を優先する前提で設計する。
- 開発ルール本文の正本は以下を維持する。
  - `docs/development/README.md`
  - `docs/development/coding-rules.md`
  - `docs/development/branch-rules.md`

## 3. 運用ルール

- 新規ルール追加時は、既存ルールと重複・矛盾がないか確認する
- `prefix_rule` は以下の3層で分離する
  - `allow`: 読み取り専用（`status`, `diff`, `log` など）
  - `prompt`: 状態変更（`push`, `gh pr create`, `pnpm install` など）
  - `forbidden`: 破壊操作（`git reset --hard`, `git clean -fd`）
- `git add` / `git commit` に加えて `git -C` も `allow` とする（破壊操作は `forbidden` を維持）
- `pnpm` は以下で分離する
  - `allow`: `pnpm --dir web run lint`, `pnpm --dir web run format:check`, `pnpm --dir web run setup:hooks:check`
  - `prompt`: `pnpm install`, `pnpm add/remove/update`, 任意の `pnpm run`
- 実装・設計フロー変更があれば、`docs/development/README.md` と同時更新する
- ルール変更を伴うPRでは、変更理由をPR本文に記載する

## 4. このリポジトリの初期セット

- `codex/rules/00-global.md`: 全体参照入口
- `codex/rules/10-web-implementation.md`: Web実装ルール参照入口
- `codex/rules/20-docs-sync.md`: ドキュメント更新ルール参照入口
- `codex/rules/30-validation.md`: 検証ルール参照入口
- `codex/rules/40-permissions.rules`: コマンド承認ポリシー（実行制御本体）

## 5. 動作確認コマンド
ルール追加・変更後は、必ず `execpolicy` で判定を確認する。

```bash
codex execpolicy check --rules codex/rules/40-permissions.rules git status
codex execpolicy check --rules codex/rules/40-permissions.rules git -C /Users/shunki.tada/VSCode/IroMap/.worktree/skill-git-worktree-setup status --short
codex execpolicy check --rules codex/rules/40-permissions.rules git -C /Users/shunki.tada/VSCode/IroMap commit -m test
codex execpolicy check --rules codex/rules/40-permissions.rules git reset --hard
codex execpolicy check --rules codex/rules/40-permissions.rules pnpm --dir web run lint
codex execpolicy check --rules codex/rules/40-permissions.rules pnpm -C /Users/shunki.tada/VSCode/IroMap/.worktree/feature-codex-permissions-rules install
```
