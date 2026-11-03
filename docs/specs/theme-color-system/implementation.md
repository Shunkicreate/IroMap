# Implementation: 色と文字の適用

## 1. 依存方向

- 正本は[色の意味と制約](design.md)、[色値](tokens.json)、[文字ルール](typography.md)。
- 設計 → 生成資料 → 共通部品・機能の表示。実装に合わせて設計の色値を変えない。
- 生成処理: `web/scripts/generate-theme-colors.mjs`。
- 生成先: `web/src/styles/theme-colors.css`と`web/src/lib/observation-colors.ts`。
- `pnpm --dir web run generate:theme`で再生成する。`check:theme`で正本との一致を検査する。lintと本番ビルド前に必須実行する。
- 生成CSSではドットをハイフン、camelCaseをkebab-caseへ変換する。HEXの大小文字と短縮表記だけは整形で変わるが、sRGB値は変えない。

## 2. 部品への対応

| 正本の用途                                            | 実装上の対応                            | 使用箇所                                             |
| ----------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| surface.canvas                                        | --background                            | ページ全体                                           |
| surface.panel                                         | --card / --workbench-surface            | 領域・操作の面                                       |
| surface.raised                                        | --popover                               | ツールチップ・通知の面                               |
| text.primary / secondary                              | --foreground / --muted-foreground       | 見出し・本文・補足                                   |
| border.subtle                                         | --border / --workbench-surface-border   | 装飾的な区切り                                       |
| border.control                                        | --input                                 | 入力・補助ボタンの境界                               |
| action.primary / hover / pressed / onPrimary / border | --action-\*                             | 画像選択・主ボタン                                   |
| selection.surface / text / border                     | --selection-\*                          | 選択タブ・チェック・スライダー                       |
| focus.ring                                            | --ring / --focus-ring                   | キーボードの外周                                     |
| disabled.surface / text                               | --disabled-\*                           | 利用不可。opacityで全体を薄めない                    |
| attention.\*                                          | --attention-\*                          | 必要な補助の注記用に保持。装飾を追加して使い切らない |
| feedback.\*                                           | --feedback-\*                           | 既存の成功・警告・エラー・情報通知                   |
| observation.\*                                        | --observation-\* / observationColors    | 写真の背景・3D・散布図・ガイド                       |
| selectionMarker                                       | --selection-marker-\* / selectionMarker | 写真・3D・断面の明暗の輪郭                           |

- 既存ライブラリの`--accent`は通常のホバー面へ対応させる。`attention.accent`を全操作のホバーへ広げない。
- 既存のRGB/HSL/Labタブの橙・緑・青、表示方式タブの黄色・紫、画像入力の緑を選択・主操作の共通ルールへ揃える。
- 装飾グラデーションと発光を除く。データを示す色面、ヒストグラムの分布、写真のRGB値は表示対象として保持する。
- ヒストグラムの件数を表す棒は無彩色のガイド色にする。色相そのものを示すデータ色とは区別する。
- 無彩色の観察面と文字・ガイドはテーマに追従する。断面の上に重ねる透明Canvasは不透明に塗らない。
- 選択は実線、ホバーは破線の明暗輪郭で区別する。選択領域の3D点群も実際のRGBで塗り、橙色の発光に置換しない。
- 図上の文字は不透明な無彩色の面を置き、データ色との重なりによる可読性の変化を抑える。
- 写真・データ色の値、色変換、分析計算、選択操作の意味はこの変更で再設計しない。

## 3. 文字の適用

- `web/src/app/layout.tsx`の`next/font/google`でNoto Sans JPを自己配信する。ブラウザからGoogle Fontsへ本文用フォントを取りに行く方式にしない。
- displayはswap。未取得時は代替書体で読める。日本語の字種をlatinだけへ制限しない。
- Noto Sans JPを本文・操作・見出し・補足へ適用する。本文の段落は0.04em、操作名・入力・コードは既存の密度を保つ。
- 数値専用書体は未確定。既存のGeist Monoの配信を保持し、未配信だったIBM Plex Monoの指定は既存の等幅変数へ揃える。
- サイズ・ウェイト・行間、全体の余白・角丸は今回新たな確定値を追加しない。
- フォントのライセンスは`web/public/fonts/OFL-NotoSansJP.txt`に同梱する。
- 保存済みテーマでの再読込時は、テーマ切替の初回描画をサーバーと揃え、ハイドレーション不一致を防ぐ。

## 4. 検証と承認

- 自動確認: 正本と生成値、実画面の面・主操作・選択・フォーカス・字間・読み込み済み書体、画像ピクセル・断面RGB・選択HEX・分析値の保持。
- 既存の軸ラベル検査は色の直値ではなく軸ラベルの描画位置・値を確認する。ラベルの無彩色化後も、数値と重なり・幅の条件を維持する。
- 追加テスト: `web/tests/e2e/theme-color-system.spec.ts`。
- 元の配色見本とは別に、修正後の実画面についてユーザーの明示的な視覚承認を得た。
- 提供写真はローカルの表示確認にのみ使用する。画像ファイルや画像データをリポジトリへ追加しない。

## 実画面レビュー後の修正

- color-reassessment.mdのA案を実装。観察する作業領域全体へobservationPanelを適用し、面・余白・文字・図の背景を中立色で連続させる。
- 外周の夕紺の彩度と、主操作の青の強さを抑える。ライトも桜の外周と中立の作業領域の関係を合わせる。
- 操作に不要なカード枠を除去し、入力境界・選択・フォーカスは保持する。
- 写真・キューブ・断面の表示領域は1pxの無彩色のガイド線で囲む。表示範囲を識別できるようにし、透明な重ね描画面には枠を追加しない。カードの多重枠は戻さない。
- キューブの説明表示の背景は上端から全幅を覆い、回転した点群が説明領域の上に断片としてのぞかないようにする。
- 新しい配色のstatusはapproved。細い表示枠・上端の修正・描画情報の表示切替を含む実画面の仕上がりをユーザーが承認した。

- 実画面レビューで追加された描画情報の表示切替はC-12の仕様として定義。表示オプションで説明と背景をまとめて切り替え、再読込後も保持する。
