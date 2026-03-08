# Design: UI Foundation (shadcn/ui + Radix)

## 1. 目的
- UI基盤を shadcn/ui + Radix に統一し、今後の実装に再利用可能なコンポーネント層を提供する
- ワークベンチのUXを利用者中心に再定義し、操作導線と可視化解釈を改善する

## 2. 全体方針
- `src/components/ui/` に再利用コンポーネントを配置する
- `src/lib/utils.ts` の `cn()` で class 結合を統一する
- テーマは `next-themes` の class 制御で行う
- 表示文言は実装都合ではなくユーザー行動を主語に設計する
- 状態変化は `toast` と `aria-live` で即時通知する

## 3. アーキテクチャ上の位置づけ
- `app/layout.tsx`: ThemeProvider と Toaster の配置
- `app/page.tsx`: 1ページ構成と主要導線の表示責務
- `components/ui/*`: 汎用表示コンポーネント
- `features/workbench/*`: 操作順ガイドと各機能パネル統合
- `features/*`: キーボード操作可能な代替導線と可視化注釈を保持

## 4. ドメインモデル
- 追加なし（UI基盤のみ）

## 5. シーケンス
1. layout 初期化時に ThemeProvider を適用する
2. page にテーマ切替導線とユーザー向けセクション見出しを配置する
3. RGBキューブ/スライスはポインタ操作に加えて代替操作導線を提供する
4. 可視化には軸/凡例/要点説明を付与して解釈を補助する
5. コピー/分析の状態変化を toast + 補助テキストで通知する
6. テーマトグル操作で class を更新し、配色を切り替える

## 6. API設計
- 外部公開APIは追加しない
- 内部コンポーネントI/F:
  - `Button`: `variant`, `size`, `asChild`
  - `Select`: Radix Select Primitive 構成
  - `Tabs`: Radix Tabs Primitive 構成

## 7. 例外系
- テーマ未解決時は `resolvedTheme` を参照し、トグル文言を安全に切り替える
- Clipboard API 不可時は失敗通知とフォールバック導線を表示する
- 画像分析失敗時はエラーメッセージを `aria-live` 領域で通知する

## 8. セキュリティ考慮
- 外部入力の永続化は行わない

## 9. 可観測性
- Toast はUI通知用途のみでログ永続化しない
- 成功/失敗/処理中の通知種別を統一し、検証時に追跡可能な文言を利用する

## 10. トレードオフ
- 1ページ統合で初期導線を優先し、ルート分割の厳密設計は後続に回す
- 高度な3D操作性よりも、選択操作の到達性と学習コスト低減を優先する

## 11. 関連ADR
- なし
