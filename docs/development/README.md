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
- `docs/development/performance-benchmark.md`: ローカル性能計測手順と基準値

## 2. 基本原則

- 1 機能 = 1 ディレクトリ（`docs/specs/<feature-name>/`）
- 要求（What）と設計（How）を分離する
- `spec -> design -> tasks -> test-cases` の整合を維持する
- タスク、テスト、実装は要求 ID（`FR-x`）に紐づける
- 未決事項は `spec.md` の「未決事項」または `notes.md` に残す
- 用語・表示文言・情報・状態設計を正本とし、実装が従う。実装の改名・未作成によって設計定義を変更しない。

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
- 設計を先に確定する変更では、設計と実装の一時的な不一致を許容する。文書同士の整合は維持する。
- 情報設計は `pnpm run check:information` と `pnpm run test:information` を必須とし、`pnpm run check:information:implementation` の差分をPRに記載する。
- 実装照合の終了コード2は設計先行期間の差分。CIでは参考情報として残す。実装完了時は担当範囲の差分を解消する。
- 設計検査はコードを必要としない。実装対応のパス・キーは下流の資料へ分離し、照合時にだけ読み込む。

## 5. コミットと PR

### コミット

- 1 コミット 1 目的の最小粒度で行う
- 複数意図の変更を 1 コミットに混在させない
- 例: ロジック追加、テスト追加、テスト修正は分ける

### PR

- PR には対応するドキュメントを明記する（`spec.md` / `design.md` / `tasks.md` / `test-cases.md` / ADR）
- レビューでは要求トレーサビリティとコミット粒度を確認する
- 設計変更を含む場合は「設計レビュー方針」に従って確認する

### Issue から PR までの Codex スキル

`$issue-to-pr` で、[Issue から PR まで相談して進めるスキル](../../.agents/skills/issue-to-pr/SKILL.md)を呼び出す。
スキルはリポジトリの `.agents/skills/issue-to-pr/` に配置する。

1. 未着手状況や依存関係を確認して Issue 候補を提示し、ユーザーと一つ選ぶ
2. 実装範囲と受け入れ条件を相談し、`.worktree/feature/*` で実装・検証する
3. 実際の差分に沿った PR のタイトル・本文を相談して Draft PR を作成する
4. ユーザー向けの動作確認手順を PR コメントに投稿し、コメントの直接リンクを渡す
5. ユーザーの確認結果に応じて、同じ worktree と PR で修正する

確認結果は実行済み・失敗・未実行を区別し、ユーザーによる動作確認を勝手に完了扱いにしない。
マージ、Issue の手動 close、worktree・ブランチの削除は、別途ユーザーから依頼を受けて行う。

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

- すべての作業（コード変更・docs変更を含む）はGit worktreeで行う。`.worktree` 配下またはCodexアプリの管理worktreeを使用できる
- 機能ごとに作業ディレクトリを分け、並行作業時の衝突を避ける
- リポジトリルート（`/Users/shunki.tada/VSCode/IroMap`）での直接修正は禁止する
- `main` ブランチでの修正（commit/push）は禁止する

通常のworktreeの作成と `pnpm` セットアップは、以下のコマンドで実行する。Codexアプリの管理worktreeを作成した場合は、依存関係をルートとwebでそれぞれインストールする。

```bash
pnpm run worktree:add feature/<task-name>
```

このコマンドは以下を自動実行する。

- `.worktree/feature/<task-name>` の作成
- `main` 基点の最新状態を取り込んだ新規 branch 作成（未作成時のみ）
- `pnpm install`（worktree ルート）
- `pnpm --dir web install`（worktree の `web/`）

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

`wasm/cube-point-kernel/` を変更した push では、`pre-push` が自動で `pnpm --dir web run build:wasm:cube-points` を実行し、[`cube-point-kernel-wasm-bytes.ts`](/Users/shunki.tada/VSCode/IroMap/.worktree/feature/wasm-cube-points-poc/web/src/domain/photo-analysis/cube-point-kernel/generated/cube-point-kernel-wasm-bytes.ts) の更新漏れを検知する。

### WASM の Rust ツールチェーン

Rust のバージョンはリポジトリ直下の `rust-toolchain.toml` を正とし、現在は `1.99.0` を使用する。
rustup はこのファイルからバージョンと `wasm32-unknown-unknown` ターゲットを選択し、CI も同じファイルからバージョンを読み込む。
生成物のバイト列にはコンパイラの差が現れるため、常に最新を指す `stable` を生成物チェックには使わない。

Rust を更新するときは、`rust-toolchain.toml` の変更と WASM 再生成を同じ PR に含める。
依存関係は追跡済みの `Cargo.lock` に固定し、生成スクリプトは `cargo build --locked` を使用する。

```bash
rustc --version
pnpm --dir web run build:wasm:cube-points
```

生成された `cube-point-kernel-wasm-bytes.ts` をコミットした後に、もう一度ビルドして次のチェックが成功することを確認する。
`cube-point-wasm.spec.ts` は生成物を直接実行し、JS フォールバックを使わず色・件数・比率を取得できることを検証する。

```bash
pnpm --dir web run build:wasm:cube-points
git diff --exit-code -- web/src/domain/photo-analysis/cube-point-kernel/generated/cube-point-kernel-wasm-bytes.ts
pnpm --dir web run test:e2e
```

## 10. UI E2E テスト（Playwright）

`web/` では Playwright による E2E テストを利用できる。

```bash
pnpm --dir web run test:e2e
```

ブラウザ未インストール環境では、先に以下を実行する。

```bash
pnpm --dir web exec playwright install chromium
```

AI agent から UI テストを実行する場合は `@playwright/mcp` の利用を推奨する。  
設定例は公式リポジトリを参照すること。
