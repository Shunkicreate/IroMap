# Design: UI Foundation (shadcn/ui + Radix)

## 1. 目的
- UI基盤を shadcn/ui + Radix に統一し、今後の実装に再利用可能なコンポーネント層を提供する

## 2. 全体方針
- `src/components/ui/` に再利用コンポーネントを配置する
- `src/lib/utils.ts` の `cn()` で class 結合を統一する
- テーマは `next-themes` の class 制御で行う

## 3. アーキテクチャ上の位置づけ
- `app/layout.tsx`: ThemeProvider と Toaster の配置
- `app/page.tsx`: 1ページ構成の表示責務
- `components/ui/*`: 汎用表示コンポーネント

## 4. ドメインモデル
- 追加なし（UI基盤のみ）

## 5. シーケンス
1. layout 初期化時に ThemeProvider を適用する
2. page で shadcn/ui コンポーネントを組み合わせて表示する
3. テーマトグル操作で class を更新し、配色を切り替える

## 6. API設計
- 外部公開APIは追加しない
- 内部コンポーネントI/F:
  - `Button`: `variant`, `size`, `asChild`
  - `Select`: Radix Select Primitive 構成
  - `Tabs`: Radix Tabs Primitive 構成

## 7. 例外系
- テーマ未解決時は `resolvedTheme` を参照し、トグル文言を安全に切り替える

## 8. セキュリティ考慮
- 外部入力の永続化は行わない

## 9. 可観測性
- Toast はUI通知用途のみでログ永続化しない

## 10. トレードオフ
- 1ページ統合で初期導線を優先し、ルート分割の厳密設計は後続に回す

## 11. 関連ADR
- なし
