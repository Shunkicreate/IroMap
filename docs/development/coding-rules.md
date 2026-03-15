# Coding Rules

このドキュメントは、IroMap の実装時に従うコーディングルールを定義する。
運用フローは `docs/development/README.md` を参照する。

## 1. 基本方針

- 読みやすさを最優先し、短く意図が明確なコードを書く
- 仕様（`spec.md`）にない挙動を暗黙に追加しない
- 一時対応のコードには期限または撤去条件をコメントで残す

## 2. 言語・フレームワーク

- フロントエンドは TypeScript を使用する
- React コンポーネントは関数コンポーネントで実装する
- Next.js App Router 前提で、`app/` はルーティング責務のみに留める

## 3. 命名規則

- ファイル名は `kebab-case` を基本とし、CSS Modules は `kebab-case.module.css` を許可する
- React コンポーネントは `PascalCase`
- 変数・関数は `camelCase`
- 型・インターフェースは `PascalCase`
- 真偽値は `is` / `has` / `can` で始める

## 4. ディレクトリ配置規約

- `features/`: 機能固有の UI・状態管理・ユースケース
- `components/`: 機能に依存しない再利用 UI
- `rendering/`: Three.js / Canvas の描画実装
- `domain/`: 色変換・色空間などのドメインロジック
- `lib/`: 汎用ユーティリティ
- `hooks/`: 複数 feature で再利用する hook のみ
- feature 専用 hook は `features/<feature>/` に置く

## 5. 依存ルール

- 依存方向は `app -> features -> domain/rendering/lib` を維持する
- `domain/` は UI フレームワーク（React/Next.js）に依存しない
- `components/` から feature 固有実装を直接参照しない
- feature 内で共通UIが必要な場合は、まず `components/ui` の既存コンポーネント再利用を優先する
- `types/` は外部境界（API 入出力など）に限定し、`domain` と二重定義しない

## 6. React 実装ルール

- props は必要最小限にし、コンポーネント責務を単一に保つ
- 重い計算は `useMemo` などで再計算を制御する
- event handler 内で副作用をまとめ、描画ループに不要な状態更新を入れない
- `any` の利用は原則禁止とし、必要時は理由をコメントする

## 7. Three.js / Canvas 実装ルール

- 描画オブジェクトの生成と破棄を明示し、メモリリークを防ぐ
- Three.js の scene/camera/control のライフサイクルを分離して管理する
- Canvas は `ImageData` ベースの描画を基本とし、ピクセル操作を関数化する
- 3D と 2D で座標系・軸方向の規約を統一する

## 8. エラーハンドリング・ログ

- 例外を握りつぶさず、UI 復帰可能な形で扱う
- ユーザー操作起点の失敗は、原因追跡に必要な最小ログを残す
- 開発用ログは本番動作に影響しないように管理する

## 9. CSS・レスポンシブ実装ルール

- レイアウトは mobile-first を基本とし、狭い画面向けの 1 カラムを基準に拡張する
- 寸法・余白・角丸・ブレークポイントは `rem` / `em` を優先し、固定 `px` 指定は Canvas の描画座標など相対化できないケースに限定する
- `width` / `height` の固定値でレイアウトを成立させず、`minmax(0, 1fr)`、`aspect-ratio`、`clamp()` を使って親幅に追従させる
- `100vh` / `overflow: hidden` をページ全体に適用して見切れを抑える実装は禁止し、必要な箇所だけスクロール責務を持たせる
- グラフ軸ラベルや補助UIは absolute 前提で外側にはみ出させず、レイアウト内に表示領域を確保する
- 横スクロール抑止のためにコンテンツを切り詰めるのではなく、折り返し、列落ち、縦積みで吸収する
- グローバル CSS はデザイントークン、リセット、アプリ共通レイアウトに限定し、機能固有スタイルは責務を分離する
- 未使用 CSS や参照されないスタイルファイルを残さず、実際に読み込まれる定義へ一本化する

## 10. テスト・品質

- 変更時は対応する `test-cases.md` を更新する
- バグ修正時は再発防止テストを追加する
- パフォーマンス要件は ADR と `spec.md` の基準に沿って検証する
- レスポンシブ変更時は少なくとも `320px`, `375px`, `768px`, `1024px`, `1440px` 幅で横スクロールの有無と主要UIの収まりを検証する

## 11. ドキュメント同期

- 設計判断が発生したら ADR を追加し、関連 `design.md` から参照する
- 実装が仕様から逸脱する場合は、先に `spec.md` / `design.md` を更新する

## 12. 自動チェックで強制する項目

以下は `web/eslint.config.mjs`、`web/stylelint.config.mjs`、`prettier`、`git hooks` で強制する。

- 命名規則
  - ファイル名: `kebab-case`、CSS Modules は `kebab-case.module.css`（`web/scripts/check-file-names.mjs`）
  - 型・インターフェース: `PascalCase`（`@typescript-eslint/naming-convention`）
  - 変数・関数: `camelCase`（`@typescript-eslint/naming-convention`）
  - 真偽値: `is` / `has` / `can` 接頭辞（`@typescript-eslint/naming-convention`）
- 型安全
  - `any` の利用禁止（`@typescript-eslint/no-explicit-any`）
- React
  - JSX コンポーネント名は `PascalCase`（`react/jsx-pascal-case`）
- 依存制約（import）
  - `domain/` は `react` / `next` / `app` / `features` へ依存禁止
  - `components/` から `features/` への直接依存禁止
  - `features/` から `app/` への逆依存禁止
  - `rendering/` / `lib/` から `app/` / `features/` への依存禁止
- 形式統一
  - `prettier` による整形を強制（`pre-commit` / `pre-push` / GitHub Actions）
- CSS
  - `.css` / `.module.css` の不正構文・重複 selector を検出（`stylelint-config-standard`）
  - `px` の利用を禁止（`unit-disallowed-list`）
  - 寸法系プロパティへの `100vh` / `100vw` を禁止（`declaration-property-value-disallowed-list`）
  - `stylelint-disable` コメントは理由なし・無効スコープ・不要指定を禁止する

なお、TSX 内の `style={...}` や Canvas API の寸法文字列は Stylelint の対象外のため、レビューまたは ESLint 拡張で補完する。
