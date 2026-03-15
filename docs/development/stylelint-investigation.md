# Stylelint Investigation

このドキュメントは、IroMap に Stylelint を導入して CSS ルールの一部を自動検査へ移譲するための調査メモである。

## 1. 目的

- CSS・レスポンシブ実装ルールのうち、静的に検査可能なものを review 依存から lint 依存へ移す
- `globals.css` と feature 単位 CSS の品質を機械的に維持する
- TSX 内の `style object` を減らし、Stylelint の適用範囲を広げる

## 2. 現状の棚卸し

### 2.1 Stylelint が直接見られる対象

- `web/src/app/globals.css`
- 今後追加する feature 単位の `.css` / `.module.css`

### 2.2 Stylelint が直接見られない対象

- TSX の `style={...}` / `CSSProperties`
- Canvas API の描画コード内の寸法文字列
- 文字列テンプレートで組み立てる DOM style 値

### 2.3 現在の `style object` 分類

#### CSS へ戻すべきもの

- `web/src/features/photo-analysis/photo-analysis-panel.tsx`
  - 静的レイアウト値のみだったため、`photo-analysis-panel.module.css` へ移行可能

#### CSS variable 経由で残してよいもの

- `web/src/features/rgb-cube/rgb-cube-canvas.tsx`
  - `--cube-size` の注入のみ
  - レイアウト責務は CSS 側に置ける

#### 残置許容の候補

- `web/src/components/workbench/color-swatch.tsx`
  - `backgroundColor` はデータ駆動
- `web/src/features/photo-analysis/photo-analysis-panel.tsx`
  - ヒストグラム bar の `height: ${height}%`

#### Stylelint では扱えないため別管理が必要なもの

- `web/src/features/rgb-cube/rgb-cube-core.ts`
  - `context.font = "11px monospace"` のような Canvas 描画設定

## 3. Stylelint に移譲しやすいルール

### 優先度: 高

- 不正な CSS 構文・無効プロパティの検出
- 重複定義や空ブロックの検出
- `px` 利用の原則禁止
- `100vh` / `100vw` の禁止
- disable コメント運用の厳格化

### 優先度: 中

- プロパティごとの unit 制約
- 特定プロパティへの禁止値
- declaration 順や重複 shorthand の検出

### review / ESLint に残す領域

- TSX 内の layout 系 `style object`
- `globals.css` に機能固有スタイルを置くかどうかの責務判断
- absolute 配置の妥当性のような文脈依存判断

## 4. 導入時の判断

### 4.1 今すぐ導入してよい

- `.css` / `.module.css` を対象にした Stylelint
- `web/package.json` への `lint:css` 追加
- `pnpm --dir web run lint` への統合

### 4.2 先に整理してから導入したい

- TSX の静的 `style object`
- feature 固有スタイルの CSS Modules 化ルール

## 5. 段階導入案

### Phase 1

- Stylelint 本体と標準設定を導入
- 対象は `web/src/**/*.css`
- `px` と viewport unit の制約を追加
- 既存 CSS が通る最小構成で CI に組み込む

### Phase 2

- 静的な `style object` を CSS / CSS Modules へ移行
- CSS Modules を正式に命名規則へ追加
- feature 固有スタイルの責務を global CSS から分離

### Phase 3

- ESLint 側で TSX の layout 系 inline style を制限する
- allowlist を `backgroundColor` や `% height` のようなデータ駆動用途に限定する

## 6. 今回反映した前提整備

- `web/src/features/photo-analysis/photo-analysis-panel.tsx` の静的 style object を `photo-analysis-panel.module.css` へ移行
- `web/scripts/check-file-names.mjs` を更新し、`kebab-case.module.css` を許可
- `docs/development/coding-rules.md` を更新し、CSS Modules の命名規則を明文化

## 7. First Pass の導入方針

- `web/stylelint.config.mjs` を追加し、`stylelint-config-standard` をベースにする
- 対象は `web/src/**/*.css`
- Tailwind v4 由来の `@apply` / `@custom-variant` / `@theme` は unknown at-rule から除外する
- `px` は CSS ファイル内で禁止する
- 寸法系プロパティに対する `100vh` / `100vw` は禁止する
- `pnpm --dir web run lint` に `lint:css` を統合する
- pre-commit では `*.css` に `stylelint --fix` をかける
