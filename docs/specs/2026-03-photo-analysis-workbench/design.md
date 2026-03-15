# Design: Photo Analysis Workbench

## 1. 目的

- `spec.md` の FR-1 から FR-8 を満たすため、既存の photo analysis / rgb cube / slice / inspector を 1 つの分析ワークベンチへ統合する設計方針を定義する

## 2. 全体方針

- 既存の画像サンプリング結果を単一の分析データソースとして扱う
- 可視化レイヤーは `image plane / 3d color space / slice / metrics` に分割し、同じ選択状態を参照する
- MVP は `単一選択モデル + 2 件比較 + 表コピー + L* histogram` を成立条件とする
- 履歴、保存、ブラシ選択などは後続で差し込めるよう状態モデルを分離する

## 2.1 用語定義

- `target`
  - 現在ワークベンチで分析可能な 1 件の画像入力単位
- `baseline target`
  - 比較の基準側として固定された target
- `compare target`
  - baseline と比較される target
- `snapshot`
  - 後続で保存可能にする UI 状態の束。MVP では永続化しないが、state の構造だけ先に持つ
- `selection`
  - 明示操作により確定したサンプル集合。再集計や比較の入力になる
- `hover`
  - 一時的に注目しているサンプルまたはサンプル集合。再集計の基準には使わない
- `selection scope`
  - `full-image` または `selected-region`
- `comparison scope`
  - `full-image`、`matched-selection` の 2 種。MVP はこの 2 つに限定する

## 3. アーキテクチャ上の位置づけ

- `Image Sampling`: 画像から `PixelSample` 群を生成する
- `Analysis Projection`: RGB から Lab / HSL / 3D 座標 / slice 座標を導出する
- `Selection Engine`: 画像矩形選択、3D 点群選択、slice 選択を共通の絞り込み条件へ変換する
- `Metrics Engine`: 統計量、histogram、差分、比較表を算出する
- `Workbench State`: 現在画像、比較対象、選択状態、コピー形式、表示モードを保持する
- `Presentation`: preview / 3D / slice / metrics table / histogram / compare panel を描画する

## 4. ドメインモデル

- `PixelSample`
  - `{ sampleId, x, y, r, g, b, h, s, l, labL, labA, labB, chroma, alpha }`
  - `sampleId` は target 内で一意。比較や hover の参照キーに使う
- `AnalysisTarget`
  - `{ targetId, label, imageAsset, width, height, samplingMode, samples, projections, metadata }`
  - `projections` は 3D 色空間と slice が直接参照する派生データ
- `SelectionGeometry`
  - `{ kind, imageRect?, sliceWindow?, sampleAnchor? }`
  - 選択の発生源を記録し、UI 復元に使う
- `AnalysisSelection`
  - `{ selectionId, targetId, source, geometry, sampleIds, sampleCount, coverageRatio, createdAt }`
  - `source` は `image-rect | image-point | color-space-pick | slice-pick`
- `MetricValue`
  - `{ key, label, group, value, unit, precision, description, emptyStateLabel }`
- `HistogramBin`
  - `{ metric, binIndex, start, end, count, ratio }`
- `ComparisonPair`
  - `{ baselineTargetId, compareTargetId, comparisonScope, baselineSelectionId?, compareSelectionId? }`
- `ComparisonDelta`
  - `{ key, baselineValue, compareValue, deltaValue, deltaDirection }`
  - `deltaDirection` は常に `compare-minus-baseline`
- `WorkbenchSnapshot`
  - `{ snapshotId, label, baselineTargetId, compareTargetId?, selectionIds, compareScope, createdAt }`

## 4.1 状態モデル

- 永続候補 state
  - `targetsById`
  - `snapshotsById`
- 画面の source of truth
  - `activeBaselineTargetId`
  - `activeCompareTargetId`
  - `activeSelectionIdByTarget`
  - `activeHover`
  - `selectionScope`
  - `comparisonScope`
  - `copyFormat`
  - `panelVisibility`
- 派生 state
  - 表示対象の sample 集合
  - 指標表 rows
  - histogram bins
  - comparison deltas
  - highlight overlay data

## 4.2 状態分離ルール

- 計算結果は source of truth に直接保持せず、target と selection から再導出する
- hover は 1 件のみ保持し、selection と別 state に置く
- baseline と compare は同型 state で扱い、比較 UI のみが両者を束ねる
- 将来の snapshot 保存は、現在の source of truth をシリアライズして生成する

## 4.3 比較単位の固定ルール

- MVP では比較は常に 2 件固定とする
- `full-image`
  - baseline target 全体と compare target 全体を比較する
- `matched-selection`
  - baseline / compare のそれぞれで active selection を 1 件ずつ持つ場合のみ比較する
- baseline selection のみ存在し、compare selection が無い場合は `matched-selection` を成立させない
- 将来の `snapshot vs snapshot` 比較も内部的には `ComparisonPair` へ正規化する

## 5. シーケンス

1. 画像を読み込み、既存の sampling pipeline で `PixelSample[]` を生成する
2. RGB から HSL / Lab と、3D・slice 用の投影値を計算する
3. ワークベンチは baseline / compare target と active selection state を保持する
4. hover が発生したら `activeHover` のみ更新し、再集計は行わない
5. 矩形選択または色空間選択が確定したら、共通の `sampleIds` へ正規化して `AnalysisSelection` を生成する
6. `Metrics Engine` が selection scope に応じて指標表、histogram、比較差分を再集計する
7. 各ビューが `activeHover` と `activeSelectionIdByTarget` を参照し、相互ハイライトを反映する
8. コピー操作時は表示中データを `Markdown / CSV / TSV` へ整形してクリップボードへ渡す

## 6. API設計

- 外部 API は使わず、クライアント内関数で完結する
- 内部関数例
  - `buildAnalysisTarget(imageAsset): AnalysisTarget`
  - `projectSamplesToColorSpace(samples): ProjectedSample[]`
  - `createRectangleSelection(target, bounds): AnalysisSelection`
  - `createPointSelection(target, sampleId, source): AnalysisSelection`
  - `setActiveHover(targetId, sampleIds, source): WorkbenchHoverState`
  - `buildComparisonPair(state): ComparisonPair | null`
  - `computeMetricTable(target, selection): MetricValue[]`
  - `buildLuminanceHistogram(target, selection, bins): HistogramBin[]`
  - `buildComparison(baseTarget, compareTarget, selectionMode): ComparisonDelta[]`
  - `serializeTable(rows, format): string`
  - `serializeHistogramBins(bins, format): string`

## 6.1 選択・相互ハイライト仕様

- event sources
  - `image-hover`
  - `image-rect-select`
  - `color-space-hover`
  - `color-space-pick`
  - `slice-hover`
  - `slice-pick`
- hover rule
  - 最新の hover event が `activeHover` を上書きする
  - pointer leave で `activeHover` を空に戻す
- selection rule
  - 明示 click または drag 完了時のみ selection を更新する
  - 新しい selection は target ごとに 1 件だけ active にする
  - 新 selection 確定時に旧 active selection は履歴候補として残してよいが、MVP では active から外れる
- highlight rule
  - 画像起点の selection は 3D / slice に投影して強調表示する
  - 3D / slice 起点の hover は画像上に点または小領域として表示する
  - hover 表示は selection 表示より弱い visual weight にする

## 6.2 選択正規化ルール

- 画像矩形選択
  - image pixel bounds を target の `sampleIds` へ変換する
- 画像点選択
  - nearest sample を 1 件選ぶ
- 色空間 pick
  - nearest visible sample を 1 件選ぶ
- slice pick
  - slice 上の座標と fixed axis 条件から nearest sample を 1 件選ぶ
- 将来のブラシ選択は複数 geometry の union として `sampleIds` へ正規化する

## 7. 例外系

- 画像デコード失敗時は対象追加を中断し、空状態またはエラー表示を返す
- 選択領域のサンプル数が閾値未満の場合は、比較や指標計算を `N/A` 扱いにする
- Highlight 条件に一致するサンプルが 0 件の場合は、Highlight Neutrality を欠損値として扱う
- 比較対象が未設定の場合は、差分列や重ね表示を非表示にする
- hover 対象が空になった場合は highlight だけを解除し、selection は保持する
- baseline / compare 間で selection scope が成立しない場合は、自動で `full-image` 比較へフォールバックしない

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
- hover と selection を同じ state にすると再集計が過剰発火するため、意図的に分離する

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
