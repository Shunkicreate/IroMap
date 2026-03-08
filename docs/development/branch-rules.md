# Branch Rules

IroMap のブランチ運用ルールを定義する。

## 1. ブランチ種別

- 永続ブランチは `main` のみ
- 作業ブランチは `feature/*` のみ
- 例: `feature/slice-hsl-plane`, `feature/inspector-ui`

## 2. 作業フロー

1. `main` から `feature/*` を作成する
2. 実装・テスト・ドキュメント更新（コード・docsの両方）を `.worktree/feature/*` で行う
3. `feature/* -> main` の Pull Request で統合する

## 3. 禁止事項

- リポジトリルート（`/Users/shunki.tada/VSCode/IroMap`）での直接修正
- `.worktree` 外での commit / push
- `main` ブランチでの修正（commit / push）
- `main` への直接 push
- `feature/*` 以外の命名での恒常運用

## 4. 品質ゲート

- ローカル: `pre-commit` で format + lint fix を実行
- ローカル: `pre-push` で lint と format:check を必須化
- ローカル: `pre-commit` / `pre-push` で `feature/*` 以外のブランチを拒否
- GitHub Actions:
  - `quality-gate`: lint / format:check
  - `branch-name`: `feature/*` または `main` を検証

## 5. GitHub 推奨設定

- Branch protection 対象: `main`
- Required status checks:
  - `lint-and-format` (workflow: `quality-gate`)
  - `validate-branch-name` (workflow: `branch-name`)
- Require pull request reviews before merging:
  - チーム開発: 有効化（`required_approving_review_count >= 1`）
  - 単独開発: 任意（セルフ運用時は `required_approving_review_count = 0`）
- Include administrators を有効化

## 6. 初期セットアップ

```bash
./scripts/setup-git-hooks.sh
```

上記で `core.hooksPath` を `.githooks` に固定する。
