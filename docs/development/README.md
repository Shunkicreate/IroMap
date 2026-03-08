# Development Guide

このドキュメントは、IroMap の開発運用ルールを定義する。
フォーマット定義の詳細は各 README に集約し、このページでは実務フローと品質ルールに絞る。

## 1. 参照先
- `docs/specs/README.md`: `spec.md` / `design.md` / `tasks.md` / `test-cases.md` / `notes.md` の標準フォーマット
- `docs/adr/README.md`: ADR の命名規則と標準フォーマット
- `docs/architecture/`: 全体アーキテクチャと品質属性

## 2. 基本原則
- 1 機能 = 1 ディレクトリ（`docs/specs/YYYY-MM-feature-name/`）
- 要求（What）と設計（How）を分離する
- `spec -> design -> tasks -> test-cases` の整合を維持する
- タスク、テスト、実装は要求 ID（`FR-x`）に紐づける
- 未決事項は `spec.md` の「未決事項」または `notes.md` に残す

## 3. 実装開始までの流れ
1. 対象機能ディレクトリを `docs/specs/` 配下に作る
2. `spec.md` を作成し、要求と受け入れ条件を定義する
3. 必要に応じて `design.md` / `tasks.md` / `test-cases.md` を先行作成する
4. 仕様合意後に実装を開始する

## 4. 実装フェーズのルール
- 実装変更は必ず要求 ID に対応づける
- 実装と同じタイミングでテストを更新する
- 設計判断が発生したら ADR を作成し、`design.md` から参照する
- 仕様変更が発生したら、実装より先に `spec/design/tasks/test-cases` を更新する

## 5. コミットと PR
### コミット
- 1 コミット 1 目的の最小粒度で行う
- 複数意図の変更を 1 コミットに混在させない
- 例: ロジック追加、テスト追加、テスト修正は分ける

### PR
- PR には対応するドキュメントを明記する（`spec.md` / `design.md` / `tasks.md` / `test-cases.md` / ADR）
- レビューでは要求トレーサビリティとコミット粒度を確認する

## 6. 品質チェックリスト
- 要求は曖昧語を避け、検証可能に書かれている
- 性能値、期限、回数制限は数値で定義されている
- `tasks.md` と `test-cases.md` が要求 ID に紐づいている
- 例外系と運用観点（メトリクス、ログ、Runbook）が考慮されている

## 7. 作業場所
- すべての作業は `.worktree` 配下の作業ツリーで行う
- 機能ごとに作業ディレクトリを分け、並行作業時の衝突を避ける
