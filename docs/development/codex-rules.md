# Codex Rules Guide

このドキュメントは `codex/rules/` を運用するための方針を定義する。
内容は OpenAI Codex Rules 公式ガイド（https://developers.openai.com/codex/rules/）に準拠する。

## 1. 公式仕様との対応
- 公式ページの `rules` は、主にコマンド承認制御（`prefix_rule`）の仕組みを指す。
- `Smart approvals` が有効な場合、昇格時に `prefix_rule` 提案が表示される。
- TUI で許可した内容はユーザーレイヤ（`~/.codex/rules/default.rules`）へ保存される。

## 2. このリポジトリ方針
- `codex/rules/` は「詳細ルールの再定義」をしない。
- `codex/rules/*.md` は参照入口として使い、実体ルールは `docs/` 側で管理する。
- 実体ルールの正本は以下とする。
  - `docs/development/README.md`
  - `docs/development/coding-rules.md`
  - `docs/development/branch-rules.md`

## 3. 運用ルール
- 新規ルール追加時は、既存ルールと重複・矛盾がないか確認する
- 同じ内容を繰り返さず、`docs/` 参照で一元管理する
- 実装・設計フロー変更があれば、`docs/development/README.md` と同時更新する
- ルール変更を伴うPRでは、変更理由をPR本文に記載する

## 4. このリポジトリの初期セット
- `codex/rules/00-global.md`: 全体参照入口
- `codex/rules/10-web-implementation.md`: Web実装ルール参照入口
- `codex/rules/20-docs-sync.md`: ドキュメント更新ルール参照入口
- `codex/rules/30-validation.md`: 検証ルール参照入口
