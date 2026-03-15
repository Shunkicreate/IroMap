# Design: Photo Analysis Workbench

## 1. 目的

- `spec.md` の FR-1 から FR-8 を満たすため、既存の photo analysis / rgb cube / slice / inspector を 1 つの分析ワークベンチへ統合する設計方針を定義する

## 2. 全体方針

- 既存の画像サンプリング結果を単一の分析データソースとして扱う
- 可視化レイヤーは `image plane / 3d color space / slice / metrics` に分割し、同じ選択状態を参照する
- MVP は `単一選択モデル + 2 件比較 + 表コピー + L* histogram` を成立条件とする
- 履歴、保存、ブラシ選択などは後続で差し込めるよう状態モデルを分離する

## 3. アーキテクチャ上の位置づけ

- `Image Sampling`: 画像から `PixelSample` 群を生成する
- `Analysis Projection`: RGB から Lab / HSL / 3D 座標 / slice 座標を導出する
- `Selection Engine`: 画像矩形選択、3D 点群選択、slice 選択を共通の絞り込み条件へ変換する
- `Metrics Engine`: 統計量、histogram、差分、比較表を算出する
- `Workbench State`: 現在画像、比較対象、選択状態、コピー形式、表示モードを保持する
- `Presentation`: preview / 3D / slice / metrics table / histogram / compare panel を描画する

## 4. ドメインモデル

- `PixelSample`: `{ x, y, r, g, b, h, s, l, labL, labA, labB }`
- `AnalysisSelection`: `{ id, kind, bounds?, sampleIds }`
- `AnalysisTarget`: `{ id, label, imageAsset, samples, selection? }`
- `MetricValue`: `{ key, label, value, unit?, description, group }`
- `HistogramBin`: `{ metric, start, end, count, ratio }`
- `ComparisonDelta`: `{ key, baseValue, compareValue, deltaValue }`
- `WorkbenchSnapshot`: `{ id, label, targetIds, selectionIds, createdAt }`

## 5. シーケンス

1. 画像を読み込み、既存の sampling pipeline で `PixelSample[]` を生成する
2. RGB から HSL / Lab と、3D・slice 用の投影値を計算する
3. ワークベンチは現在対象と比較対象を状態に保持する
4. 矩形選択または色空間選択が発生したら、共通の `sampleIds` へ正規化する
5. `Metrics Engine` が対象範囲に対して指標表、histogram、比較差分を再集計する
6. 各ビューが同じ選択状態を参照し、相互ハイライトを反映する
7. コピー操作時は表示中データを `Markdown / CSV / TSV` へ整形してクリップボードへ渡す

## 6. API設計

- 外部 API は使わず、クライアント内関数で完結する
- 内部関数例
  - `buildAnalysisTarget(imageAsset): AnalysisTarget`
  - `projectSamplesToColorSpace(samples): ProjectedSample[]`
  - `createRectangleSelection(samples, bounds): AnalysisSelection`
  - `computeMetricTable(target, selection): MetricValue[]`
  - `buildLuminanceHistogram(target, selection, bins): HistogramBin[]`
  - `buildComparison(baseTarget, compareTarget, selectionMode): ComparisonDelta[]`
  - `serializeTable(rows, format): string`
  - `serializeHistogramBins(bins, format): string`

## 7. 例外系

- 画像デコード失敗時は対象追加を中断し、空状態またはエラー表示を返す
- 選択領域のサンプル数が閾値未満の場合は、比較や指標計算を `N/A` 扱いにする
- Highlight 条件に一致するサンプルが 0 件の場合は、Highlight Neutrality を欠損値として扱う
- 比較対象が未設定の場合は、差分列や重ね表示を非表示にする

## 8. セキュリティ考慮

- 画像データはローカル処理を基本とし、外部送信しない
- コピー機能は明示操作でのみ実行し、隠れた自動コピーは行わない

## 9. 可観測性

- 画像読込時間、再集計時間、比較計算時間を開発時ログで観測できる
- サンプル数、選択領域サンプル数、histogram bin 数を確認可能にする

## 10. トレードオフ

- MVP では自由度の高いブラシ選択より、再現性と実装コストに優れる矩形選択を優先する
- 指標は多数追加せず、現像判断に効く最小セットへ絞る
- 2 件比較を先に成立させ、多件比較や履歴管理は後続へ分離する
- 3D 選択を完全な幾何選択にすると複雑になるため、初期は hover / nearest sample / slice 連携中心でもよい

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
