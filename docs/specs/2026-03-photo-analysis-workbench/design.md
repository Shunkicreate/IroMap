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

## 3.1 UI コンポーネント責務

- `WorkbenchShell`
  - 全体レイアウト、panel visibility、responsive 切替を管理する
- `PreviewPanel`
  - 画像表示、hover overlay、矩形選択、selection clear を担当する
- `ColorSpacePanel`
  - 3D 色空間表示、hover / pick、comparison overlay を担当する
- `SlicePanel`
  - slice 軸操作、hover / pick、fixed axis 表示を担当する
- `InspectorPanel`
  - hover / selected sample の数値表示を担当する
- `MetricsTablePanel`
  - 指標表表示、差分列、コピー形式切替、コピー実行を担当する
- `HistogramPanel`
  - metric 切替、selection scope に応じた histogram、comparison overlay、bin コピーを担当する
- `ComparePanel`
  - baseline / compare target の選択、comparison scope の切替、空状態を担当する

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

## 4.4 レスポンシブ状態ルール

- デスクトップ
  - 上段 3 ペインを横並びで維持する
- タブレット以下
  - `preview -> 3D -> slice+inspector` の縦積みを許可する
- responsive 崩しは presentation のみで吸収し、state 構造は変えない

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

## 6.1 指標仕様

- 指標の入力範囲
  - `selectionScope = full-image` のときは target 全 sample
  - `selectionScope = selected-region` のときは active selection の sample のみ
- 表示精度
  - MVP では数値表示を小数第 2 位で丸める
  - 元計算値は内部で保持し、UI 表示時とコピー時に丸める
- 欠損ルール
  - 分母 0、対象 sample 0、highlight sample 0 の場合は `N/A`
  - `N/A` はコピー時も文字列 `N/A` を出力する

### 6.1.1 ベース指標

- `l_mean`
  - `mean(L*)`
- `l_stddev`
  - `stddev(L*)`
- `l_p95`
  - `95th percentile(L*)`
- `a_mean`
  - `mean(a*)`
- `b_mean`
  - `mean(b*)`
- `c_mean`
  - `mean(C*)`
- `c_p95`
  - `95th percentile(C*)`
- `neutral_distance_mean`
  - MVP では `mean(C*)` と同値を返す
- `highlight_b_mean`
  - `mean(b*) where L* > 80`
- `highlight_neutral_distance_mean`
  - `mean(C*) where L* > 80`
- `selection_coverage_ratio`
  - `selected sample count / target sample count`

### 6.1.2 比較指標

- `delta_l_mean`
  - `compare.l_mean - baseline.l_mean`
- `delta_a_mean`
  - `compare.a_mean - baseline.a_mean`
- `delta_b_mean`
  - `compare.b_mean - baseline.b_mean`
- `delta_c_mean`
  - `compare.c_mean - baseline.c_mean`
- `compare_to_baseline_mean_lab_delta_e76`
  - `DeltaE76(baselineMeanLab, compareMeanLab)`
  - baseline と compare の平均 Lab 同士の距離を表す単一スカラー値として扱う
- `selection_a_b_delta_e`
  - 同一 target 内で `selection A` と `selection B` を比較する将来指標
  - MVP では active selection が 1 件のみのため、表にはプレースホルダを置かず未表示でもよい

### 6.1.3 表の既定表示順

1. 明度
2. 色被り
3. 彩度
4. 中立
5. 白
6. 補助情報

## 6.2 Histogram 仕様

- P0 必須
  - `L* histogram`
- P1 拡張候補
  - `Hue`
  - `Saturation`
  - `C* / Neutral Distance`
- `L* histogram`
  - domain: `0..100`
  - bins: `20`
  - bin width: `5`
  - count: bin 範囲に含まれる sample 数
  - ratio: `count / total count`
- 境界ルール
  - 下端含む、上端は最終 bin のみ含む
  - 例: `[0,5)`, `[5,10)`, ..., `[95,100]`
- 0 件 bin
  - UI とコピーの両方で省略しない
- 比較表示
  - baseline と compare を同じ bin 定義で集計する
  - 差分表示用の追加 bin は MVP では持たず、2 系列重ね表示で視認させる

## 6.3 コピー仕様

- 指標表コピー
  - 内部列順: `group, key, label, value, unit, delta, description`
  - Markdown ではヘッダ行と区切り行を含む
  - CSV / TSV では UTF-8 文字列として出力する
- histogram コピー
  - 内部列順: `metric, binIndex, start, end, count, ratio`
  - ratio は `0..1` の実数を小数第 4 位まで出力する
- コピー対象
  - 指標表: 現在表示している scope の表だけをコピーする
  - histogram: 現在選択している metric だけをコピーする
- 失敗時
  - clipboard API が失敗したら toast で失敗理由を表示する

## 6.4 比較・差分仕様

- baseline / compare の役割
  - すべての差分は `compare - baseline`
- `full-image`
  - 両 target 全体で同一 metric 群を比較する
- `matched-selection`
  - 両 target に active selection があり、かつ selection sample count が閾値以上の場合のみ比較する
- 差分列
  - 指標表では `value` に加えて `delta` を持つ
  - histogram は差分列を持たず、系列の重ね表示で比較する
- 差分欠損ルール
  - baseline か compare のどちらかが `N/A` の場合、delta も `N/A`
- target 間の座標対応
  - MVP では画像位置の厳密対応を前提にしない
  - `matched-selection` は各 target 上の個別 selection を比較し、ピクセル単位対応は要求しない

## 6.5 UI レイアウト仕様

- 用語
  - `上段` はワークベンチの主表示行を指す
  - `下段` は指標、比較、履歴などの補助情報行を指す
- 上段
  - 左: `PreviewPanel`
  - 中央: `ColorSpacePanel`
  - 右: `SlicePanel + InspectorPanel`
- 下段
  - 1 行目: `MetricsTablePanel + HistogramPanel`
  - 2 行目: `ComparePanel + History/Snapshot placeholder`
- 優先順位
  - 上段は常時見えることを優先する
  - 下段は情報量増加に備え、独立スクロールまたはページスクロールで許容する

## 6.6 主要操作フロー

### 6.6.1 単一画像分析

1. target を読み込む
2. 上段 3 ペインで分布を確認する
3. Preview または色空間上で hover して sample 情報を見る
4. 矩形選択または pick で selection を確定する
5. 下段の指標表と histogram を selection scope で確認する
6. 必要に応じて表または histogram をコピーする

### 6.6.2 2 件比較

1. baseline target を開く
2. compare target を追加する
3. comparison scope を `full-image` または `matched-selection` に切り替える
4. 3D 色空間の重ね表示と histogram の 2 系列比較を見る
5. 指標表の delta 列で差分を確認する

### 6.6.3 選択解除

1. PreviewPanel または InspectorPanel から `clear selection` を実行する
2. active selection を解除する
3. selection scope が `selected-region` の場合は `full-image` へ戻す

## 6.7 操作優先順位ルール

- hover は常に最も軽い操作で、selection を上書きしない
- drag 中は新規 hover を無視し、drag 完了時に selection だけを更新する
- compare target 未設定時は compare panel の操作以外でエラーを出さない
- histogram metric 切替は selection scope を維持する
- responsive 崩しで panel 順が変わっても、active state は不変とする

## 6.8 空状態ルール

- target 未読込
  - Preview / ColorSpace / Slice は empty state を表示する
- compare target 未設定
  - ComparePanel は追加導線だけを見せる
- selection 未設定で `selected-region` を要求
  - panel 内で案内を表示し、自動的に新 selection を作らない

## 6.9 選択・相互ハイライト仕様

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

## 6.10 選択正規化ルール

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
- クリップボード書き込み拒否時は再試行を強制せず失敗通知のみ返す
- 狭幅レイアウト切替時に drag selection が中断された場合は selection を確定しない

## 8. セキュリティ考慮

- 画像データはローカル処理を基本とし、外部送信しない
- コピー機能は明示操作でのみ実行し、隠れた自動コピーは行わない

## 9. 可観測性

- 画像読込時間、再集計時間、比較計算時間を開発時ログで観測できる
- サンプル数、選択領域サンプル数、histogram bin 数を確認可能にする
- 指標計算ごとの入力 sample 数と `N/A` 発生件数を確認可能にする

## 9.1 性能設計

- 再計算トリガー
  - target 変更
  - selection 確定
  - selection clear
  - comparison scope 変更
  - histogram metric 変更
- 再計算しない操作
  - hover 移動
  - panel 開閉
  - copy format 切替だけの表示変更
- 計算最適化方針
  - target 単位で sample / projection をキャッシュする
  - histogram は `(targetId, selectionId, metric)` 単位で再利用できるようにする
  - delta 計算は表示中 metric 群だけに限定する
- worker 利用方針
  - 既存 photo-analysis worker を再利用し、重い再集計は worker 側へ寄せる
  - hover 処理は UI thread で完結させる
- サンプル上限
  - MVP では既存の間引き戦略を使い、selection 再集計時も同じ sample 集合を用いる

## 9.2 テスト戦略

- domain test
  - 指標計算、bin 定義、差分方向、`N/A` ルールを検証する
- component test
  - panel ごとの empty state、delta 列、copy format 切替、selection clear を検証する
- e2e test
  - 3 ペイン導線、矩形選択、2 件比較、コピー成功通知、responsive 崩し後の状態保持を検証する
- 非回帰重点
  - hover が再集計を発火しない
  - compare 未設定時に baseline 分析が壊れない
  - selection clear 後に full-image へ正しく戻る

## 10. トレードオフ

- MVP では自由度の高いブラシ選択より、再現性と実装コストに優れる矩形選択を優先する
- 指標は多数追加せず、現像判断に効く最小セットへ絞る
- 2 件比較を先に成立させ、多件比較や履歴管理は後続へ分離する
- 3D 選択を完全な幾何選択にすると複雑になるため、初期は hover / nearest sample / slice 連携中心でもよい
- hover と selection を同じ state にすると再集計が過剰発火するため、意図的に分離する
- `ΔE` は画素対応ベースではなく平均 Lab ベースで始めることで、比較仕様を先に成立させる
- 下段情報を増やしても上段 3 ペインを守るため、ページ全体の均等配置より主戦場固定を優先する

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
