# Development Guide

このドキュメントは、IroMap の開発運用ルールを定義する。
フォーマット定義の詳細は各 README に集約し、このページでは実務フローと品質ルールに絞る。

## 1. 参照先
- `docs/specs/README.md`: `spec.md` / `design.md` / `tasks.md` / `test-cases.md` / `notes.md` の標準フォーマット
- `docs/adr/README.md`: ADR の命名規則と標準フォーマット
- `docs/architecture/`: 全体アーキテクチャと品質属性
- `docs/development/coding-rules.md`: コーディング規約と依存ルール
- `docs/development/branch-rules.md`: ブランチ運用ルールと GitHub 品質ゲート
- `docs/development/codex-rules.md`: Codex Rules の設計・運用方針

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
- 設計変更を含む場合は「設計レビュー方針」に従って確認する

## 6. 品質チェックリスト
- 要求は曖昧語を避け、検証可能に書かれている
- 性能値、期限、回数制限は数値で定義されている
- `tasks.md` と `test-cases.md` が要求 ID に紐づいている
- 例外系と運用観点（メトリクス、ログ、Runbook）が考慮されている

## 7. 設計レビュー方針
- レビュー観点は「バグ」「回帰リスク」「欠落テスト」「運用リスク」を優先順で扱う
- 指摘には根拠ファイルを明記し、影響範囲（機能・レイヤ・運用）を示す
- フォルダ構成/アーキテクチャ変更時は以下を必須確認とする
  - 責務境界: UI・機能・描画・ドメインの責務が重複していない
  - 依存方向: `app -> features -> domain/rendering/lib` の一方向を維持している
  - 配置規約: feature専用実装と共通実装（`components` / `hooks` / `lib`）の配置ルールが明確
  - 型管理: `domain` の型と `types` の型が二重管理になっていない
  - 参照整合: 重要判断は ADR に記録され、`design.md` から参照されている
- 「問題なし」の場合も、残余リスク（将来破綻しやすい点）を短く記録する

## 8. 作業場所
- すべての作業は `.worktree` 配下の作業ツリーで行う
- 機能ごとに作業ディレクトリを分け、並行作業時の衝突を避ける

## 9. Git Hooks セットアップ
コミット前・push前の品質ゲートを有効化するため、リポジトリルートで以下を実行する。

```bash
pnpm run setup:hooks
```

設定確認:

```bash
pnpm run setup:hooks:check
```

期待値は `.githooks`。
