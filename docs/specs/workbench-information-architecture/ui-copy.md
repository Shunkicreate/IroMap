# IroMap 標準表示文言

- 位置づけ: 画面表示の標準案と既存言語辞書の対応表。文言を実装へ反映する前の設計草案。
- 目的: 入口・設定・値・案内を、その場で意味を読める言葉にそろえる。
- 背景: 既存の省略語、言語の混在、実内容と一致しない名称を整理する必要がある。
- 関連: [共通用語集](glossary.md)、[情報の重要度と開示階層](information-architecture.md)、[照合記録](information-audit.md)。
- 元辞書: `web/src/i18n/messages.ts`、参照コミット `3256f13ffd13b86c84889a6e12bbdcd36ffc6713`。
- この文書だけでは画面の文言や言語ファイルを変更しない。
- 状態遷移・表示条件・データの更新規則は定義しない。

## 文言の標準

- 正準名: 用語集で定義した対象名を使う。
- 見出し: 内容を表す名詞を使う。
- 操作: 対象と動作を組み合わせる。例: 画像を選ぶ、色を貼り付け。
- 設定: 何を指定するかを示す。例: 固定する軸、グリッド線の色。
- 説明: 何が分かるかを先に示し、操作方法は必要な範囲に絞る。
- 画像の貼り付けと色コードの貼り付けを同じ単独ラベルで呼ばない。
- 点の由来で命名する。白マッピング・選択マッピングという実装寄りの語は表示名として使わない。
- 見える名前と読み上げ名は同じ対象を指す。アイコン操作には対象を含む読み上げ名を用意する。
- 色空間の名称RGB/HSL/Lab、色コードの形式HEX/rgb()/hsl()は継承する。
- 表示言語は既存のjaを基準にし、既存en辞書も参照できるように残す。
- APIの補助画面は現行の英語表示を記録する。ja欄は日本語化するときの標準案であり、今回の実装やAPIレスポンスの変更を要求しない。
- 変数は元のプレースホルダー名を維持し、翻訳可能な文章から分離する。
- 数字・割合・度・寸法の書式は要素の定義に合わせる。値の計算方法を文言変更で置き換えない。
- コピーの内容・項目・対象・書式の再設計はスコープ外。
- コピーと画面が同じキーを共有する場合、下記の標準案は画面用。既存のコピー内文字列は維持し、将来の実装では用途を分けて扱う。
- 現在未表示の文言は保管する。辞書にあることだけを理由に画面へ追加しない。
- 文言の理解しやすさを利用者で確認する評価は後続。標準案を承認済みとは扱わない。

## 主画面で使う表示文言

### heroTitle

- 区分: 画面表示の標準案。
- 対応要素: W-01。
- 参照元: `web/src/app/page.tsx`。
- 標準 ja: 写真の色を分析する
- 標準 en: Analyze photo colors
- 既存 ja: 画像の色構造を一目で理解する
- 既存 en: Understand your image color structure at a glance
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: プロダクトの目的を短く示す。

### heroDescription

- 区分: 画面表示の標準案。
- 対応要素: W-01。
- 参照元: `web/src/app/page.tsx`。
- 標準 ja: 写真の色を3Dキューブとスライスで確認できます。
- 標準 en: Inspect photo colors in the 3D cube and slice.
- 既存 ja: IroMap は RGB / HSL / Lab 可視化と画像分析を1画面で往復できる Image Color Analyzer です。
- 既存 en: IroMap is an Image Color Analyzer where RGB / HSL / Lab visualization and image analysis stay in one workflow.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 機能列挙と抽象的な宣伝文を減らす。

### workbenchThemeLabel

- 区分: 画面表示の標準案。
- 対応要素: W-02。
- 参照元: `web/src/components/theme-toggle.tsx`。
- 標準 ja: テーマ
- 標準 en: Theme
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchThemeLight

- 区分: 画面表示の標準案。
- 対応要素: W-02。
- 参照元: `web/src/components/theme-toggle.tsx`。
- 標準 ja: ライト
- 標準 en: Light
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchThemeDark

- 区分: 画面表示の標準案。
- 対応要素: W-02。
- 参照元: `web/src/components/theme-toggle.tsx`。
- 標準 ja: ダーク
- 標準 en: Dark
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchInspectorDisclosure

- 区分: 画面表示の標準案。
- 対応要素: I-01。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 色の数値を表示
- 標準 en: Show color values
- 既存 ja: インスペクタ詳細
- 既存 en: Inspector details
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 開く内容を直接示す。

### workbenchDisplayOptionsDisclosure

- 区分: 画面表示の標準案。
- 対応要素: P-09、C-05、S-07。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`、`web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 表示設定
- 標準 en: Display settings
- 既存 ja: 表示オプション
- 既存 en: Display options
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 設定入口を同じ名前にそろえる。

### previewShowSamplingGrid

- 区分: 画面表示の標準案。
- 対応要素: P-11。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 採取位置のグリッドを表示
- 標準 en: Show sampling grid
- 既存 ja: サンプリンググリッドを表示
- 既存 en: Show sampling grid
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 何を示す格子かを明確にする。

### previewSamplingGridColorLabel

- 区分: 画面表示の標準案。
- 対応要素: P-12。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: グリッド線の色
- 標準 en: Grid line color
- 既存 ja: グリッド線
- 既存 en: Grid color
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 対象と設定値を明確にする。

### previewSamplingGridColorWhite

- 区分: 画面表示の標準案。
- 対応要素: P-12。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 白
- 標準 en: White
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### previewSamplingGridColorBlack

- 区分: 画面表示の標準案。
- 対応要素: P-12。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 黒
- 標準 en: Black
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### previewSamplingDensityLabel

- 区分: 画面表示の標準案。
- 対応要素: P-13。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: サンプリング密度: {value}%（{sampleCount}点）
- 標準 en: Sampling density: {value}% ({sampleCount} points)
- 既存 ja: サンプリング密度: {value}% ({sampleCount} samples)
- 既存 en: Sampling density: {value}% ({sampleCount} samples)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 日本語と単位を統一する。
- 変数: `{value}`、`{sampleCount}`。

### previewSamplingDensityFullWarning

- 区分: 画面表示の標準案。
- 対応要素: P-13。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 100% は全ピクセルを対象にします。高解像度画像では処理が重くなることがあります。
- 標準 en: 100% samples every pixel. High-resolution images may become expensive to process.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchShowWhiteMappingCube

- 区分: 画面表示の標準案。
- 対応要素: C-08。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 標準 ja: 写真の点を表示
- 標準 en: Show photo points
- 既存 ja: 白マッピングを表示
- 既存 en: Show white mapping
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 3Dの点は白ではなく画像の色で描かれる。

### workbenchShowSelectedMappingCube

- 区分: 画面表示の標準案。
- 対応要素: C-09。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 標準 ja: 選択範囲の点を表示
- 標準 en: Show selected-area points
- 既存 ja: 選択マッピングを表示
- 既存 en: Show selected mapping
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 単一の選択色と領域の点を区別する。

### workbenchShowWhiteMappingSlice

- 区分: 画面表示の標準案。
- 対応要素: S-09。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 写真の点を表示
- 標準 en: Show photo points
- 既存 ja: 白マッピングを表示
- 既存 en: Show white mapping
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 描画色より点の由来で命名する。

### workbenchShowSelectedMappingSlice

- 区分: 画面表示の標準案。
- 対応要素: S-10。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 選択範囲の点を表示
- 標準 en: Show selected-area points
- 既存 ja: 選択マッピングを表示
- 既存 en: Show selected mapping
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 3Dと断面で同じ対象に同じ名称を使う。

### workbenchCopyFormatWorkbenchLabel

- 区分: 画面表示の標準案。
- 対応要素: A-04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: コピーの形式
- 標準 en: Copy format
- 既存 ja: エクスポート形式
- 既存 en: Export format
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: ファイル保存ではなくクリップボードの操作と一致させる。

### workbenchExportMarkdown

- 区分: 画面表示の標準案。
- 対応要素: A-04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: Markdown
- 標準 en: Markdown
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchExportCsv

- 区分: 画面表示の標準案。
- 対応要素: A-04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: CSV
- 標準 en: CSV
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchExportTsv

- 区分: 画面表示の標準案。
- 対応要素: A-04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: TSV
- 標準 en: TSV
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchTableCopy

- 区分: 画面表示の標準案。
- 対応要素: A-05。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 表をコピー
- 標準 en: Copy table
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchHistogramCopy

- 区分: 画面表示の標準案。
- 対応要素: A-21。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: ヒストグラムをコピー
- 標準 en: Copy histogram
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchTableGroup

- 区分: 画面表示の標準案。
- 対応要素: A-02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: グループ
- 標準 en: Group
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### workbenchTableMetric

- 区分: 画面表示の標準案。
- 対応要素: A-02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 指標
- 標準 en: Metric
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### workbenchTableValue

- 区分: 画面表示の標準案。
- 対応要素: A-02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 値
- 標準 en: Value
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### workbenchTableDescription

- 区分: 画面表示の標準案。
- 対応要素: A-02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 説明
- 標準 en: Description
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### workbenchMetricHelpLabel

- 区分: 画面表示の標準案。
- 対応要素: A-02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: {metric} の説明
- 標準 en: About {metric}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{metric}`。

### workbenchHistogramCardTitle

- 区分: 画面表示の標準案。
- 対応要素: A-12。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 明度ヒストグラム
- 標準 en: Lightness histogram
- 既存 ja: ヒストグラム
- 既存 en: Histogram
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 対象がLab L\*であることを示す。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### workbenchMetricTableCopied

- 区分: 画面表示の標準案。
- 対応要素: F-05。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 指標テーブルを {format} 形式でコピーしました
- 標準 en: Copied metrics table as {format}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{format}`。

### workbenchHistogramCopied

- 区分: 画面表示の標準案。
- 対応要素: F-05。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: ヒストグラムを {format} 形式でコピーしました
- 標準 en: Copied histogram as {format}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{format}`。

### workbenchSelectionUpdated

- 区分: 画面表示の標準案。
- 対応要素: F-05。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 選択範囲を更新しました
- 標準 en: Updated selection
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchSelectedColorUpdated

- 区分: 画面表示の標準案。
- 対応要素: F-05。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 選択色を更新しました: {value}
- 標準 en: Updated selected color: {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{value}`。

### workbenchMetricLabelLMean

- 区分: 画面表示の標準案。
- 対応要素: A-M01。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 平均明度（L\*）
- 標準 en: Mean lightness (L\*)
- 既存 ja: L\* mean
- 既存 en: L\* mean
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelLStddev

- 区分: 画面表示の標準案。
- 対応要素: A-M02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 明度のばらつき（L\*）
- 標準 en: Lightness standard deviation (L\*)
- 既存 ja: L\* stddev
- 既存 en: L\* stddev
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelLP95

- 区分: 画面表示の標準案。
- 対応要素: A-M03。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 明度の95パーセンタイル（L\*）
- 標準 en: 95th percentile lightness (L\*)
- 既存 ja: L\* p95
- 既存 en: L\* p95
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelAMean

- 区分: 画面表示の標準案。
- 対応要素: A-M04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 緑・赤の偏り（a\*平均）
- 標準 en: Mean green–red bias (a\*)
- 既存 ja: a\* mean
- 既存 en: a\* mean
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelBMean

- 区分: 画面表示の標準案。
- 対応要素: A-M05。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 青・黄の偏り（b\*平均）
- 標準 en: Mean blue–yellow bias (b\*)
- 既存 ja: b\* mean
- 既存 en: b\* mean
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelCMean

- 区分: 画面表示の標準案。
- 対応要素: A-M06。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 平均クロマ（C\*）
- 標準 en: Mean chroma (C\*)
- 既存 ja: C\* mean
- 既存 en: C\* mean
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelCP95

- 区分: 画面表示の標準案。
- 対応要素: A-M07。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: クロマの95パーセンタイル（C\*）
- 標準 en: 95th percentile chroma (C\*)
- 既存 ja: C\* p95
- 既存 en: C\* p95
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelNeutralDistanceMean

- 区分: 画面表示の標準案。
- 対応要素: A-M08。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 無彩色からの距離（平均）
- 標準 en: Mean distance from neutral
- 既存 ja: Neutral Distance mean
- 既存 en: Neutral Distance mean
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelHighlightAMean

- 区分: 画面表示の標準案。
- 対応要素: A-M09。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライトの緑・赤の偏り
- 標準 en: Highlight green–red bias
- 既存 ja: Highlight a\* mean (L\* > 80)
- 既存 en: Highlight a\* mean (L\* > 80)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelHighlightBMean

- 区分: 画面表示の標準案。
- 対応要素: A-M10。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライトの青・黄の偏り
- 標準 en: Highlight blue–yellow bias
- 既存 ja: Highlight b\* mean (L\* > 80)
- 既存 en: Highlight b\* mean (L\* > 80)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricLabelHighlightNeutralDistanceMean

- 区分: 画面表示の標準案。
- 対応要素: A-M11。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライトの無彩色からの距離
- 標準 en: Highlight distance from neutral
- 既存 ja: Highlight Neutral Distance mean (L\* > 80)
- 既存 en: Highlight Neutral Distance mean (L\* > 80)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 指標の意味を日本語で示し、座標記号を残す。

### workbenchMetricDescriptionLMean

- 区分: 画面表示の標準案。
- 対応要素: A-M01。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 全体の明るさ
- 標準 en: Overall brightness
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricDescriptionLStddev

- 区分: 画面表示の標準案。
- 対応要素: A-M02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 明暗差の大きさ
- 標準 en: Brightness contrast
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricDescriptionLP95

- 区分: 画面表示の標準案。
- 対応要素: A-M03。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 明るい側の明度
- 標準 en: Upper-range lightness
- 既存 ja: ハイライトの強さ
- 既存 en: Highlight strength
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 値が表す量を説明する。

### workbenchMetricDescriptionAMean

- 区分: 画面表示の標準案。
- 対応要素: A-M04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 緑↔赤方向の偏り
- 標準 en: Green-red bias
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricDescriptionBMean

- 区分: 画面表示の標準案。
- 対応要素: A-M05。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 青↔黄方向の偏り
- 標準 en: Blue-yellow bias
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricDescriptionCMean

- 区分: 画面表示の標準案。
- 対応要素: A-M06。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 全体の色づき
- 標準 en: Overall chroma
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricDescriptionCP95

- 区分: 画面表示の標準案。
- 対応要素: A-M07。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 色づきが強い側のクロマ
- 標準 en: Upper-range chroma
- 既存 ja: 一部の強い色
- 既存 en: Strong color peak
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: HSLの彩度と混同しない。

### workbenchMetricDescriptionNeutralDistanceMean

- 区分: 画面表示の標準案。
- 対応要素: A-M08。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 中立からの離れ
- 標準 en: Distance from neutral
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricDescriptionHighlightAMean

- 区分: 画面表示の標準案。
- 対応要素: A-M09。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライトの緑み・赤み
- 標準 en: Highlight green–red bias
- 既存 ja: 白の緑み / 赤み
- 既存 en: Highlight green/red bias
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 白色だけのサンプルではない。

### workbenchMetricDescriptionHighlightBMean

- 区分: 画面表示の標準案。
- 対応要素: A-M10。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライトの青み・黄み
- 標準 en: Highlight blue–yellow bias
- 既存 ja: 白の青み / 黄み
- 既存 en: Highlight blue/yellow bias
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 白色だけのサンプルではない。

### workbenchMetricDescriptionHighlightNeutralDistanceMean

- 区分: 画面表示の標準案。
- 対応要素: A-M11。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライトの色づき
- 標準 en: Highlight chroma
- 既存 ja: 白の色づき
- 既存 en: Highlight color cast
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 主観的な白の品質の指標にしない。

### workbenchMetricTooltipLMean

- 区分: 画面表示の標準案。
- 対応要素: A-M01。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 写真全体のサンプルのLab明度（L\*）の平均です。
- 標準 en: Mean Lab lightness (L\*) across the photo samples.
- 既存 ja: 画像全体の平均的な明るさです。
- 既存 en: Average lightness across the full image.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 対象と色空間を明示する。

### workbenchMetricTooltipLStddev

- 区分: 画面表示の標準案。
- 対応要素: A-M02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: Lab明度（L\*）の標準偏差です。明度のばらつきを示します。
- 標準 en: Standard deviation of Lab lightness (L\*), showing the spread of lightness.
- 既存 ja: 明るい部分と暗い部分の差がどれくらいあるかを示します。
- 既存 en: How much the image spreads between bright and dark areas.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 明暗差の最大幅という誤解を避ける。

### workbenchMetricTooltipLP95

- 区分: 画面表示の標準案。
- 対応要素: A-M03。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: サンプルの95%がこの値以下になる、Labの明度（L\*）の値です。
- 標準 en: The Lab lightness (L\*) value at or below which 95% of samples fall.
- 既存 ja: 明るい上位 5% 付近の強さを示します。
- 既存 en: Strength around the brightest 5 percent of samples.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: パーセンタイルの意味を正確にする。

### workbenchMetricTooltipAMean

- 区分: 画面表示の標準案。
- 対応要素: A-M04。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 緑から赤への軸で、全体の色被りを見ます。
- 標準 en: Overall color bias on the green-to-red axis.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricTooltipBMean

- 区分: 画面表示の標準案。
- 対応要素: A-M05。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 青から黄への軸で、全体の色被りを見ます。
- 標準 en: Overall color bias on the blue-to-yellow axis.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricTooltipCMean

- 区分: 画面表示の標準案。
- 対応要素: A-M06。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: Labで無彩色からどれくらい離れているかを示すクロマ（C\*）の平均です。
- 標準 en: Mean Lab chroma (C\*), the distance from the neutral axis.
- 既存 ja: 画像全体の平均的な彩度の強さです。
- 既存 en: Average chroma across the full image.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: HSLの彩度とクロマを混同しない。

### workbenchMetricTooltipCP95

- 区分: 画面表示の標準案。
- 対応要素: A-M07。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: サンプルの95%がこの値以下になる、Labのクロマ（C\*）の値です。
- 標準 en: The Lab chroma (C\*) value at or below which 95% of samples fall.
- 既存 ja: 彩度が高い側の上位 5% 付近の強さです。
- 既存 en: Strength around the most saturated 5 percent of samples.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 高彩度の上位5%の平均ではない。

### workbenchMetricTooltipNeutralDistanceMean

- 区分: 画面表示の標準案。
- 対応要素: A-M08。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 無彩色からどれくらい離れているかの平均です。
- 標準 en: Average distance from a neutral, gray-like color.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### workbenchMetricTooltipHighlightAMean

- 区分: 画面表示の標準案。
- 対応要素: A-M09。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: Lab明度L\*が80より高い領域の、a\*の平均です。
- 標準 en: Mean a\* among samples with Lab lightness L\* greater than 80.
- 既存 ja: 明るい領域で緑み / 赤みがどちらに寄るかを見ます。
- 既存 en: Green/red bias inside bright highlight regions.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 計算の対象を示す。

### workbenchMetricTooltipHighlightBMean

- 区分: 画面表示の標準案。
- 対応要素: A-M10。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: Lab明度L\*が80より高い領域の、b\*の平均です。
- 標準 en: Mean b\* among samples with Lab lightness L\* greater than 80.
- 既存 ja: 明るい領域で青み / 黄みがどちらに寄るかを見ます。
- 既存 en: Blue/yellow bias inside bright highlight regions.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 計算の対象を示す。

### workbenchMetricTooltipHighlightNeutralDistanceMean

- 区分: 画面表示の標準案。
- 対応要素: A-M11。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: Lab明度L\*が80より高い領域の、クロマ（C\*）の平均です。
- 標準 en: Mean chroma (C\*) among samples with Lab lightness L\* greater than 80.
- 既存 ja: 明るい領域の白がどれくらい色づいているかを見ます。
- 既存 en: How tinted bright highlight regions are.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 白の清潔感などの価値判断にしない。

### panelRgbCube

- 区分: 画面表示の標準案。
- 対応要素: C-00。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 標準 ja: 3Dキューブ
- 標準 en: 3D Cube
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### panelRgbCubeRequirements

- 区分: 画面表示の標準案。
- 対応要素: C-02。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 写真の色の位置と分布を確認できます。ドラッグで回転します。
- 標準 en: Inspect photo color positions and distribution. Drag to rotate.
- 既存 ja: 色空間を切り替えてドラッグで回転できます
- 既存 en: Switch spaces and rotate with drag
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 分析用途を操作方法より先に示す。

### panelInspector

- 区分: 画面表示の標準案。
- 対応要素: I-00。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 色の数値
- 標準 en: Color values
- 既存 ja: インスペクタ
- 既存 en: Inspector
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 専門的な容器名より内容を示す。

### panelInspectorRequirements

- 区分: 画面表示の標準案。
- 対応要素: I-01。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 色の数値を確認し、コピー・貼り付けできます。
- 標準 en: Inspect, copy, and paste color values.
- 既存 ja: ホバー比較と選択色のコピー/貼り付けをまとめて扱えます
- 既存 en: Compare hover state and copy or paste the selected color in one panel
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: ホバーや内部の容器名を入口の説明にしない。

### panelSlice

- 区分: 画面表示の標準案。
- 対応要素: S-00。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: スライス
- 標準 en: Slice
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### panelSliceRequirements

- 区分: 画面表示の標準案。
- 対応要素: S-02。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 一つの軸を固定した色の断面を確認できます。
- 標準 en: Inspect a color plane with one axis fixed.
- 既存 ja: 固定軸の断面を2Dで確認できます
- 既存 en: Inspect a fixed-axis plane in 2D
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: スライスの意味を補足する。

### panelMetrics

- 区分: 画面表示の標準案。
- 対応要素: A-01。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 分析表
- 標準 en: Metrics
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### panelMetricsRequirements

- 区分: 画面表示の標準案。
- 対応要素: A-01。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 写真全体の明度や色の偏りを数値で確認できます。
- 標準 en: Review whole-photo lightness and color bias as values.
- 既存 ja: 主要指標と色面積比を並べて確認できます
- 既存 en: Review key metrics and color area ratio together
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: この表には色面積比がないため実内容に合わせる。

### panelPhotoAnalysis

- 区分: 画面表示の標準案。
- 対応要素: A-06。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 写真分析
- 標準 en: Photo Analysis
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### panelPhotoAnalysisRequirements

- 区分: 画面表示の標準案。
- 対応要素: A-06。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 写真全体の色の分布と面積比を確認できます。
- 標準 en: Review whole-photo color distributions and area ratios.
- 既存 ja: 主要指標の分布と比率を同時に確認できます
- 既存 en: Review distribution and ratio metrics together
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 対象と内容を直接示す。

### spaceRgb

- 区分: 画面表示の標準案。
- 対応要素: C-03。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: RGB
- 標準 en: RGB
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### spaceHsl

- 区分: 画面表示の標準案。
- 対応要素: C-03。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: HSL
- 標準 en: HSL
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### spaceLab

- 区分: 画面表示の標準案。
- 対応要素: C-03。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: Lab
- 標準 en: Lab
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### cubeShowAxisGuide

- 区分: 画面表示の標準案。
- 対応要素: C-10。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。
- 標準 ja: 軸ガイドを表示
- 標準 en: Show axis guide
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### cubeShowSizeSlider

- 区分: 画面表示の標準案。
- 対応要素: C-11。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 図のサイズ調整を表示
- 標準 en: Show plot size control
- 既存 ja: サイズスライダーを表示
- 既存 en: Show size slider
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 設定目的を示す。

### cubeSizeLabel

- 区分: 画面表示の標準案。
- 対応要素: C-11。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 図のサイズ: {size}px
- 標準 en: Plot size: {size}px
- 既存 ja: キューブサイズ: {size}px
- 既存 en: Cube size: {size}px
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 図の表示寸法であり色空間の大きさではない。
- 変数: `{size}`。

### cubeOverlayModeLabel

- 区分: 画面表示の標準案。
- 対応要素: C-07。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 表示する点
- 標準 en: Points to display
- 既存 ja: 表示モード
- 既存 en: Display mode
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 図に表示する内容を明確にする。

### cubeOverlayModeGrid

- 区分: 画面表示の標準案。
- 対応要素: C-07。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 色空間の点
- 標準 en: Color-space points
- 既存 ja: グリッドのみ
- 既存 en: grid only
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 写真のサンプリンググリッドとの混同を避ける。

### cubeOverlayModeImage

- 区分: 画面表示の標準案。
- 対応要素: C-07。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 写真の点
- 標準 en: Photo points
- 既存 ja: 画像のみ
- 既存 en: image only
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 写真自体を表示する操作ではない。

### cubeOverlayModeBoth

- 区分: 画面表示の標準案。
- 対応要素: C-07。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 色空間の点と写真の点
- 標準 en: Color-space and photo points
- 既存 ja: グリッド + 画像
- 既存 en: grid + image
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 両方の内容を明示する。

### cubeOverlayStatus

- 区分: 画面表示の標準案。
- 対応要素: C-12。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 標準 ja: 表示: {mode} / 写真の点: {points}
- 標準 en: Display: {mode} / Photo points: {points}
- 既存 ja: 表示: {mode} / image points: {points}
- 既存 en: Display: {mode} / image points: {points}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 混在する言語と曖昧な数え方を整理する。
- 変数: `{mode}`、`{points}`。

### inspectorPreview

- 区分: 画面表示の標準案。
- 対応要素: I-02。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: カーソル位置の色
- 標準 en: Color under cursor
- 既存 ja: プレビュー（ホバー）
- 既存 en: Preview (Hover)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 入力方法名ではなく対象を示す。

### inspectorSelected

- 区分: 画面表示の標準案。
- 対応要素: W-03。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 選択色
- 標準 en: Selected color
- 既存 ja: 選択色（クリック）
- 既存 en: Selected (Click)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: クリックに限定せずタッチや貼り付けも含む。

### inspectorHoverLabel

- 区分: 画面表示の標準案。
- 対応要素: I-02。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: カーソル位置
- 標準 en: Under cursor
- 既存 ja: ホバー
- 既存 en: hover
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: ホバーという専門語を補足文に下げる。

### inspectorSelectedLabel

- 区分: 画面表示の標準案。
- 対応要素: I-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 選択色
- 標準 en: Selected color
- 既存 ja: 選択
- 既存 en: selected
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 同じ対象の名前を統一する。

### inspectorNoSelected

- 区分: 画面表示の標準案。
- 対応要素: W-03。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 選択色がありません
- 標準 en: No selected color
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### copyFormatHex

- 区分: 画面表示の標準案。
- 対応要素: I-05。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: HEX
- 標準 en: HEX
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### copyFormatRgb

- 区分: 画面表示の標準案。
- 対応要素: I-06。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: rgb()
- 標準 en: rgb()
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### copyFormatHsl

- 区分: 画面表示の標準案。
- 対応要素: I-07。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: hsl()
- 標準 en: hsl()
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### copyButton

- 区分: 画面表示の標準案。
- 対応要素: I-05、I-06、I-07。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: コピー
- 標準 en: Copy
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### copyNeedSelection

- 区分: 画面表示の標準案。
- 対応要素: F-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 写真・3Dキューブ・スライスで色を選んでください。
- 標準 en: Select a color in the photo, 3D cube, or slice.
- 既存 ja: 先に3D表示またはスライス上で色を選択してください。
- 既存 en: Select a color on 3D view or slice first.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 写真も色選択の入口に含む。

### copyCopied

- 区分: 画面表示の標準案。
- 対応要素: F-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: コピーしました: {value}
- 標準 en: Copied: {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{value}`。

### copyFailed

- 区分: 画面表示の標準案。
- 対応要素: F-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: コピーに失敗しました。値: {value}
- 標準 en: Copy failed. Value: {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{value}`。

### copyPasteButton

- 区分: 画面表示の標準案。
- 対応要素: I-08。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 色を貼り付け
- 標準 en: Paste color
- 既存 ja: 貼り付け
- 既存 en: Paste
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 写真の貼り付けと区別する。

### copyPasteApplied

- 区分: 画面表示の標準案。
- 対応要素: F-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 色を貼り付けました: {value}
- 標準 en: Pasted color: {value}
- 既存 ja: 貼り付け色を適用しました: {value}
- 既存 en: Applied pasted color: {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 適用という内部的な語を減らす。
- 変数: `{value}`。

### copyPasteUnsupported

- 区分: 画面表示の標準案。
- 対応要素: F-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 読み取れない色形式です: {value}
- 標準 en: Unsupported color format: {value}
- 既存 ja: 未対応の色形式です: {value}
- 既存 en: Unsupported color format: {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 入力した値と問題を示す。
- 変数: `{value}`。

### copyPasteFailed

- 区分: 画面表示の標準案。
- 対応要素: F-04。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: クリップボードの読み取りに失敗しました
- 標準 en: Failed to read clipboard
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### inspectorPasteSection

- 区分: 画面表示の標準案。
- 対応要素: I-08。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: 色を貼り付け
- 標準 en: Paste color
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### inspectorPasteHint

- 区分: 画面表示の標準案。
- 対応要素: I-08。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: HEX / rgb() / hsl() をクリップボードから適用できます。
- 標準 en: Apply HEX / rgb() / hsl() from the clipboard.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### sliceAxisLabel

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 固定する軸
- 標準 en: Axis to fix
- 既存 ja: 軸
- 既存 en: Axis
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 断面で何を固定する設定かを示す。

### sliceAxisR

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: R 固定
- 標準 en: R fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### sliceAxisG

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: G 固定
- 標準 en: G fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### sliceAxisB

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: B 固定
- 標準 en: B fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### sliceAxisH

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: H（色相）固定
- 標準 en: Fix H (hue)
- 既存 ja: H 固定
- 既存 en: H fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 軸記号の意味を補足する。

### sliceAxisS

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: S（彩度）固定
- 標準 en: Fix S (saturation)
- 既存 ja: S 固定
- 既存 en: S fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 軸記号の意味を補足する。

### sliceAxisL

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: L（明るさ）固定
- 標準 en: Fix L (lightness)
- 既存 ja: L 固定
- 既存 en: L fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: Lab L\*と区別する。

### sliceAxisLabL

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: L\*（明度）固定
- 標準 en: Fix L\* (Lab lightness)
- 既存 ja: L\* 固定
- 既存 en: L\* fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: HSL Lと区別する。

### sliceAxisLabA

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: a\*（緑・赤）固定
- 標準 en: Fix a\* (green–red)
- 既存 ja: a 固定
- 既存 en: a fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 星付き表記と意味を統一する。

### sliceAxisLabB

- 区分: 画面表示の標準案。
- 対応要素: S-03。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: b\*（青・黄）固定
- 標準 en: Fix b\* (blue–yellow)
- 既存 ja: b 固定
- 既存 en: b fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 星付き表記と意味を統一する。

### sliceValueLabel

- 区分: 画面表示の標準案。
- 対応要素: S-04。
- 参照元: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 固定値: {value}
- 標準 en: Value: {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{value}`。

### sliceMoveToSelectedColor

- 区分: 画面表示の標準案。
- 対応要素: S-06。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 選択色の高さへ移動
- 標準 en: Move to selected color
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### sliceFixedAxisLabel

- 区分: 画面表示の標準案。
- 対応要素: S-04。
- 参照元: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: {axis} 固定 = {value}
- 標準 en: Fixed {axis} = {value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{axis}`、`{value}`。

### sliceAxisXLabel

- 区分: 画面表示の標準案。
- 対応要素: S-05。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 横軸: {axis}（左→右）
- 標準 en: Horizontal: {axis} (left to right)
- 既存 ja: X軸: {axis} (左→右)
- 既存 en: X axis: {axis} (left to right)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: Xを日常語にする。
- 変数: `{axis}`。

### sliceAxisYLabel

- 区分: 画面表示の標準案。
- 対応要素: S-05。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: 縦軸: {axis}（下→上）
- 標準 en: Vertical: {axis} (bottom to top)
- 既存 ja: Y軸: {axis} (下→上)
- 既存 en: Y axis: {axis} (bottom to top)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: Yを日常語にする。
- 変数: `{axis}`。

### photoUploadLabel

- 区分: 画面表示の標準案。
- 対応要素: P-01。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 画像を選ぶ
- 標準 en: Choose image
- 既存 ja: 画像をアップロード
- 既存 en: Upload image
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 可視名と読み上げ名を一致させる。

### photoPreviewTitle

- 区分: 画面表示の標準案。
- 対応要素: P-04。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 写真
- 標準 en: Photo
- 既存 ja: 選択画像
- 既存 en: Selected image
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 領域名を統一する。

### photoMetaSummary

- 区分: 画面表示の標準案。
- 対応要素: P-14。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 画像情報
- 標準 en: Image info
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoPreviewAlt

- 区分: 画面表示の標準案。
- 対応要素: P-05。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 分析対象画像: {fileName}
- 標準 en: Image selected for analysis: {fileName}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{fileName}`。

### photoPreviewEmpty

- 区分: 画面表示の標準案。
- 対応要素: P-05、F-01。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 分析する画像を選ぶか、貼り付けてください。
- 標準 en: Choose or paste an image to analyze.
- 既存 ja: 画像を選択するとここにプレビューを表示します
- 既存 en: Choose an image to preview it here
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 図・分析の空欄にも通用する案内にする。

### photoUploadSelected

- 区分: 画面表示の標準案。
- 対応要素: P-16。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 画像: {fileName}
- 標準 en: Image: {fileName}
- 既存 ja: 選択中: {fileName}
- 既存 en: Selected: {fileName}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 色の選択とファイルの選択を混同しない。
- 変数: `{fileName}`。

### photoPasteApplied

- 区分: 画面表示の標準案。
- 対応要素: F-03。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 画像を貼り付けました
- 標準 en: Pasted an image
- 既存 ja: クリップボード画像を適用しました
- 既存 en: Applied clipboard image
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 適用という語を具体的な操作に置き換える。

### photoPasteNoImage

- 区分: 画面表示の標準案。
- 対応要素: F-03。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: クリップボード内に画像がありません
- 標準 en: No image found in clipboard
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoChooseAction

- 区分: 画面表示の標準案。
- 対応要素: P-01。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 画像を選ぶ
- 標準 en: Choose image
- 既存 ja: 選ぶ
- 既存 en: Choose
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 操作対象を明示する。

### photoPasteAction

- 区分: 画面表示の標準案。
- 対応要素: P-02。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: ここに画像を貼り付け
- 標準 en: Paste an image here
- 既存 ja: 貼り付け
- 既存 en: Paste
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: これはボタンではなく入力欄である。

### photoPasteActionHint

- 区分: 画面表示の標準案。
- 対応要素: P-02。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 長押ししてペースト。PC は Ctrl+V / ⌘V。
- 標準 en: Touch and hold to paste. On a computer, use Ctrl+V / ⌘V.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoPasteChooseRecovery

- 区分: 画面表示の標準案。
- 対応要素: F-03。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 「画像を選ぶ」から取り込めます。
- 標準 en: Use Choose image to import an image.
- 既存 ja: 「選ぶ」から画像を取り込めます。
- 既存 en: Use Choose to select an image.
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 参照先の標準ラベルと一致させる。

### photoPasteInputLabel

- 区分: 画面表示の標準案。
- 対応要素: P-02。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 画像の貼り付け入力欄
- 標準 en: Image paste input
- 既存 ja: 画像のペースト入力欄
- 既存 en: Image paste input
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 貼り付けの名称を統一する。

### photoAnalyzing

- 区分: 画面表示の標準案。
- 対応要素: F-02。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 分析中...
- 標準 en: Analyzing...
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoError

- 区分: 画面表示の標準案。
- 対応要素: F-02。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: 画像を読み取れないか、分析を完了できませんでした。
- 標準 en: The image could not be read or analyzed.
- 既存 ja: 画像のデコードまたは分析に失敗しました
- 既存 en: Failed to decode image or compute analysis
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: デコードという実装用語を避ける。

### photoLabScatter

- 区分: 画面表示の標準案。
- 対応要素: A-18。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: Lab a\*-b\*散布図
- 標準 en: Lab a\*-b\* scatter plot
- 既存 ja: Lab a-b 散布図
- 既存 en: Lab a-b scatter
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 座標名を統一する。

### photoHueHistogram

- 区分: 画面表示の標準案。
- 対応要素: A-14。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 色相ヒストグラム
- 標準 en: Hue histogram
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### photoSaturationHistogram

- 区分: 画面表示の標準案。
- 対応要素: A-16。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 彩度ヒストグラム
- 標準 en: Saturation histogram
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### photoColorAreaRatio

- 区分: 画面表示の標準案。
- 対応要素: A-10。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 色面積比
- 標準 en: Color area ratio
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoInsightTitle

- 区分: 画面表示の標準案。
- 対応要素: A-07。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 全体の色の傾向
- 標準 en: Overall color trends
- 既存 ja: 分析結果の見方
- 既存 en: How to read these results
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 内容が操作ガイドではなく要約である。

### photoInsightHue

- 区分: 画面表示の標準案。
- 対応要素: A-08。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 色相バランス: {label}
- 標準 en: Hue balance: {label}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{label}`。

### photoInsightSaturation

- 区分: 画面表示の標準案。
- 対応要素: A-09。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 彩度傾向: {label}
- 標準 en: Saturation trend: {label}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{label}`。

### photoInsightHueBalanced

- 区分: 画面表示の標準案。
- 対応要素: A-08。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 多様
- 標準 en: Diverse
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoInsightHueModerate

- 区分: 画面表示の標準案。
- 対応要素: A-08。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: やや偏り
- 標準 en: Moderately biased
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoInsightHueNarrow

- 区分: 画面表示の標準案。
- 対応要素: A-08。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 偏りが強い
- 標準 en: Strongly biased
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoInsightSatHigh

- 区分: 画面表示の標準案。
- 対応要素: A-09。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 高彩度寄り
- 標準 en: High saturation dominant
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoInsightSatMid

- 区分: 画面表示の標準案。
- 対応要素: A-09。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 中間
- 標準 en: Moderate
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoInsightSatLow

- 区分: 画面表示の標準案。
- 対応要素: A-09。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 標準 ja: 低彩度寄り
- 標準 en: Low saturation dominant
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoOthers

- 区分: 画面表示の標準案。
- 対応要素: A-11。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: その他
- 標準 en: Others
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### photoSummary

- 区分: 画面表示の標準案。
- 対応要素: P-16。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 標準 ja: ファイル名={fileName} | サンプル数={sampledPixels} | 処理時間={elapsedMs}ms
- 標準 en: file name={fileName} | sampled pixels={sampledPixels} | elapsed={elapsedMs}ms
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{fileName}`、`{sampledPixels}`、`{elapsedMs}`。

### graphAxisLabA

- 区分: 画面表示の標準案。
- 対応要素: A-19。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: a\*
- 標準 en: a\*
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### graphAxisLabB

- 区分: 画面表示の標準案。
- 対応要素: A-19。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: b\*
- 標準 en: b\*
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。

### graphAxisHue

- 区分: 画面表示の標準案。
- 対応要素: A-14-G。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 色相 H（0〜360°）
- 標準 en: Hue H (0–360°)
- 既存 ja: 色相 (0-360)
- 既存 en: Hue (0-360)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 軸記号と単位を示す。

### graphAxisLuminance

- 区分: 画面表示の標準案。
- 対応要素: A-12-G。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 明度 L\*（0〜100）
- 標準 en: Lightness L\* (0–100)
- 既存 ja: 輝度 (0-100)
- 既存 en: Luminance (0-100)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 算出値はLab L\*であり物理的な輝度ではない。

### graphAxisSaturation

- 区分: 画面表示の標準案。
- 対応要素: A-16-G。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 彩度 S（0〜100%）
- 標準 en: Saturation S (0–100%)
- 既存 ja: 彩度 (0-100)
- 既存 en: Saturation (0-100)
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: HSLの値と単位を示す。

### graphAxisCount

- 区分: 画面表示の標準案。
- 対応要素: A-12-G、A-14-G、A-16-G。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: サンプル数
- 標準 en: Sample count
- 既存 ja: 件数
- 既存 en: Count
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 何の件数かを明確にする。
- 共有用途: コピー内の既存文言もこのキーを参照する。画面標準案をコピーの文字列へ一括適用しない。

### cubeCanvasAriaLabel

- 区分: 画面表示の標準案。
- 対応要素: C-01。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 標準 ja: 3Dキューブの色分布
- 標準 en: 3D cube color distribution
- 既存 ja: 3D色空間キャンバス
- 既存 en: 3D color space canvas
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: キャンバスという実装方式より内容を示す。

### sliceCanvasAriaLabel

- 区分: 画面表示の標準案。
- 対応要素: S-01。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 標準 ja: スライスの色の断面
- 標準 en: Slice color plane
- 既存 ja: 色スライスキャンバス
- 既存 en: Color slice canvas
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 内容と可視名称を関連づける。

### cubeResolutionOverlay

- 区分: 画面表示の標準案。
- 対応要素: C-12。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 標準 ja: RGB各成分の段階数: {levels}
- 標準 en: RGB channel levels: {levels}
- 既存 ja: 解像度: {levels} 固定
- 既存 en: Resolution: {levels} fixed
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 値はRGB各成分の256段階を示し、格子の各軸16点とは異なる。
- 変数: `{levels}`。

### cubeSliceOverlay

- 区分: 画面表示の標準案。
- 対応要素: C-04。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。
- 標準 ja: スライス: {axis}={value}
- 標準 en: Slice: {axis}={value}
- 目的: 対応要素の対象・操作・値・案内を一貫した名前で表す。
- 背景: 既存の意味を継承する。
- 変数: `{axis}`、`{value}`。

## 既存コピー専用の項目名

### workbenchTableKey

- 区分: 既存コピー仕様の参照・変更しない。
- 対応要素: A-04、A-05、A-21の既存コピー。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 保管値 ja: キー
- 保管値 en: Key
- 目的: 既存の持ち出し項目を確認する。
- 背景: コピー内容の変更は今回の範囲外。

### workbenchTableUnit

- 区分: 既存コピー仕様の参照・変更しない。
- 対応要素: A-04、A-05、A-21の既存コピー。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 保管値 ja: 単位
- 保管値 en: Unit
- 目的: 既存の持ち出し項目を確認する。
- 背景: コピー内容の変更は今回の範囲外。

### graphAxisBin

- 区分: 既存コピー仕様の参照・変更しない。
- 対応要素: A-04、A-05、A-21の既存コピー。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 保管値 ja: ビン
- 保管値 en: Bin
- 目的: 既存の持ち出し項目を確認する。
- 背景: コピー内容の変更は今回の範囲外。

### graphAxisStart

- 区分: 既存コピー仕様の参照・変更しない。
- 対応要素: A-04、A-05、A-21の既存コピー。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 保管値 ja: 開始
- 保管値 en: Start
- 目的: 既存の持ち出し項目を確認する。
- 背景: コピー内容の変更は今回の範囲外。

### graphAxisEnd

- 区分: 既存コピー仕様の参照・変更しない。
- 対応要素: A-04、A-05、A-21の既存コピー。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 保管値 ja: 終了
- 保管値 en: End
- 目的: 既存の持ち出し項目を確認する。
- 背景: コピー内容の変更は今回の範囲外。

### graphAxisRatio

- 区分: 既存コピー仕様の参照・変更しない。
- 対応要素: A-04、A-05、A-21の既存コピー。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 保管値 ja: 比率
- 保管値 en: Ratio
- 目的: 既存の持ち出し項目を確認する。
- 背景: コピー内容の変更は今回の範囲外。

## 現在の画面に出ていない既存文言

### landingWorkbenchHeading

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 空文字
- 保管値 en: 空文字
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### workbenchUploadDisclosure

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: アップロードとプレビュー
- 保管値 en: Upload and preview
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### workbenchBaselineLabel

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 画像情報
- 保管値 en: Image info
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### workbenchMetricsTableTitle

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 指標テーブル
- 保管値 en: Metrics table
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### workbenchHistogramAllTitle

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: すべてのヒストグラム
- 保管値 en: All histograms
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### workbenchMetricLabelSelectionCoverageRatio

- 区分: 分析表で除外されている指標・画面には追加しない。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: Selection Coverage
- 保管値 en: Selection Coverage
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: isVisibleMetricRowがselection_coverage_ratioを除外する。

### workbenchMetricDescriptionSelectionCoverageRatio

- 区分: 分析表で除外されている指標・画面には追加しない。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 選択範囲のカバー率
- 保管値 en: Selected area coverage
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: isVisibleMetricRowがselection_coverage_ratioを除外する。

### workbenchMetricTooltipSelectionCoverageRatio

- 区分: 分析表で除外されている指標・画面には追加しない。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 現在の選択が全サンプルのどれくらいを占めるかです。
- 保管値 en: How much of the sampled image is covered by the current selection.
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: isVisibleMetricRowがselection_coverage_ratioを除外する。

### panelLabScatter

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: Lab a-b 散布図
- 保管値 en: Lab a-b scatter
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### panelLabScatterRequirements

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: Lab 色空間で分布の広がりを確認できます
- 保管値 en: Inspect color spread in Lab space
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### inspectorNoHover

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: ホバー対象がありません
- 保管値 en: No hover target
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteZoneLabel

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 画像貼り付けエリア
- 保管値 en: Image paste area
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteZoneTitle

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: コピーした画像を使う
- 保管値 en: Use a copied image
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteZoneHint

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: このエリアを選択して Cmd+V / Ctrl+V。画像ファイルのアップロードもそのまま使えます。
- 保管値 en: Focus this area and press Cmd+V / Ctrl+V. File upload remains available as well.
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteZoneDescription

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 入力欄でペーストするか、下のボタンから貼り付けます。
- 保管値 en: Paste into the field or use the button below.
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteZoneShortcut

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: このエリアを選択して Cmd+V / Ctrl+V。
- 保管値 en: Focus this area and press Cmd+V / Ctrl+V.
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteButton

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 画像を貼り付け
- 保管値 en: Paste image
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoUploadCtaTitle

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 分析する画像を追加
- 保管値 en: Add an image to analyze
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoUploadCtaDescription

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 画像を選ぶか、コピーした画像を貼り付けてください。
- 保管値 en: Choose an image or paste one you have copied.
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoUploadButton

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 画像を選ぶ
- 保管値 en: Choose image
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoUploadCleared

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 画像選択をクリアしました
- 保管値 en: Cleared image selection
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteInputHint

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: ここを長押しして「ペースト」
- 保管値 en: Touch and hold here, then choose Paste
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteUnsupported

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: このブラウザではクリップボード画像の直接読み取りに対応していません
- 保管値 en: Direct clipboard image reading is not supported in this browser
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteAccessFailed

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: クリップボードへのアクセスが完了しませんでした
- 保管値 en: Could not complete clipboard access
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteReadFailed

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: クリップボードの画像データを取得できませんでした
- 保管値 en: Could not retrieve the clipboard image data
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteRecoveryHint

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 許可した後でも、ブラウザが画像を読み取れないことがあります。入力欄を長押しして「ペースト」を選ぶか、「画像を選ぶ」から取り込んでください。
- 保管値 en: The browser may fail to read an image even after you allow pasting. Touch and hold the input, then choose Paste, or import the file with Choose image.
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoPasteFocusInput

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: ペースト入力欄へ移動
- 保管値 en: Go to paste input
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoInspectOnCube

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: キューブで確認
- 保管値 en: Inspect on cube
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoInsightSpread

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 分布の広がり: {label}
- 保管値 en: Distribution spread: {label}
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。
- 変数: `{label}`。

### photoInsightSpreadWide

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 広い
- 保管値 en: Wide
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoInsightSpreadMedium

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 中程度
- 保管値 en: Medium
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### photoInsightSpreadNarrow

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 狭い
- 保管値 en: Narrow
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。

### cubeSpaceOverlay

- 区分: 対象画面の参照コードでは未使用・保管。
- 対応要素: 現在の表示要素なし。
- 参照元: `web/src/i18n/messages.ts`。
- 保管値 ja: 色空間: {space}
- 保管値 en: Color space: {space}
- 目的: 既存辞書の情報を失わず、現在の表示内容から区別する。
- 背景: 辞書の存在と実際に表示される要素は一致しない。
- 変数: `{space}`。

## 合成文言・直書き文言・追加の表示定義

### proposal.photoOpen

- 対応要素: P-03。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 写真を表示
- en・既存表示: Show photo
- 目的: 補助領域で写真を参照する入口を示す。
- 背景・根拠: 未実装の配置案。

### proposal.photoClose

- 対応要素: P-08。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 標準 ja: 写真を閉じる
- en・既存表示: Close photo
- 目的: 写真の参照容器を閉じる操作を示す。
- 背景・根拠: 未実装の配置案。

### proposal.metricsOpen

- 対応要素: A-01。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: 分析表を表示
- en・既存表示: Show metrics
- 目的: 詳細の内容を名前で示す。
- 背景・根拠: 未実装の開示案。

### proposal.analysisOpen

- 対応要素: A-06。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 写真分析を表示
- en・既存表示: Show photo analysis
- 目的: 補助分析の入口を示す。
- 背景・根拠: 未実装の開示案。

### proposal.copyColorFormat

- 対応要素: I-05、I-06、I-07。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: {format}の値をコピー
- en・既存表示: Copy {format} value
- 目的: アイコンだけのコピー対象を読み上げで特定する。
- 背景・根拠: 既存のcopyButtonと形式名の合成文言を整理する案。
- 変数: `{format}`。

### proposal.colorMissing

- 対応要素: I-03、I-05、I-06、I-07。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 標準 ja: --
- en・既存表示: --
- 目的: 既存の未取得値の見た目を継承する。
- 背景・根拠: color-inspector.tsxのPLACEHOLDER。

### proposal.metricMissing

- 対応要素: A-02。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 標準 ja: N/A
- en・既存表示: N/A
- 目的: 既存の算出できない値の表示を継承する。
- 背景・根拠: workbench-shared.tsのformatMetricValue。

### proposal.metricGroupChroma

- 対応要素: A-M06、A-M07。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: クロマ
- en・既存表示: Chroma
- 目的: HSL彩度とLabのC\*を区別する。
- 背景・根拠: 既存groupは彩度。

### proposal.metricGroupHighlight

- 対応要素: A-M09、A-M10、A-M11。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: ハイライト
- en・既存表示: Highlights
- 目的: L\*>80のサンプルを指す。
- 背景・根拠: 既存groupは白。

### proposal.metricGroupLightness

- 対応要素: A-M01、A-M02、A-M03。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 明度
- en・既存表示: Lightness
- 目的: 分析表のグループを識別する。
- 背景・根拠: 既存metricDefinitionsのgroup。

### proposal.metricGroupColorBias

- 対応要素: A-M04、A-M05。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 色被り
- en・既存表示: Color bias
- 目的: 分析表のグループを識別する。
- 背景・根拠: 既存metricDefinitionsのgroup。

### proposal.metricGroupNeutral

- 対応要素: A-M08。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 標準 ja: 中立
- en・既存表示: Neutral
- 目的: 分析表のグループを識別する。
- 背景・根拠: 既存metricDefinitionsのgroup。

### proposal.themeAction

- 対応要素: W-02。
- 参照元: `web/src/components/theme-toggle.tsx`。
- 標準 ja: {theme}に変更
- en・既存表示: Switch to {theme}
- 目的: 変更先のテーマを読み上げで特定する。
- 背景・根拠: 既存はテーマ: {theme}、titleとsr-onlyはテーマ名。
- 変数: `{theme}`。

### proposal.histogramBar

- 対応要素: A-12-G、A-14-G、A-16-G。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: {start}〜{end}: {count}サンプル
- en・既存表示: {start}–{end}: {count} samples
- 目的: 棒の区間とサンプル数を示す。
- 背景・根拠: 既存SVG titleは{start}-{end}: {count}。
- 変数: `{start}`、`{end}`、`{count}`。

### proposal.scatterAria

- 対応要素: A-19。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 標準 ja: 写真の色のLab a\*-b\*分布
- en・既存表示: Photo color distribution in Lab a\*-b\*
- 目的: role=imgの図の内容を識別する。
- 背景・根拠: 未実装の読み上げ補完案。

### metadata.title

- 対応要素: B-03。
- 参照元: `web/src/app/layout.tsx`。
- 標準 ja: IroMap | Photo Color Analyzer
- en・既存表示: IroMap | Photo Color Analyzer
- 目的: ブラウザタブで製品を識別する。
- 背景・根拠: layout.tsxの既存値を維持。

### metadata.description

- 対応要素: B-03。
- 参照元: `web/src/app/layout.tsx`。
- 標準 ja: Understand the color structure of your photos
- en・既存表示: Understand the color structure of your photos
- 目的: 既存のページ説明を参照する。
- 背景・根拠: layout.tsxの既存値を維持。

### api.eyebrow

- 対応要素: X-01。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。
- 標準 ja: Analyze
- en・既存表示: Analyze
- 目的: 補助画面を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.title

- 対応要素: X-01。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。
- 標準 ja: 画像分析APIの確認
- en・既存表示: AI agent image analysis
- 目的: APIを試す用途を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.description

- 対応要素: X-01。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。
- 標準 ja: 画像を送信し、APIの分析結果を確認できます。APIはJSON形式で結果を返します。
- en・既存表示: Upload an image to call the same raw-body API that agents use. The page renders a structured HTML result while the API returns JSON.
- 目的: 通常の色探索との違いを説明する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.input

- 対応要素: X-02。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 入力
- en・既存表示: Input
- 目的: 入力カードの名前を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.supportedTypes

- 対応要素: X-02。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 対応形式: {types}
- en・既存表示: Supported types: {types}
- 目的: 対応MIME一覧を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{types}`。

### api.fileInput

- 対応要素: X-02-F。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 分析する画像を選ぶ
- en・既存表示: Choose an image to analyze
- 目的: ネイティブ入力の読み上げ名を補完する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.submit

- 対応要素: X-02-S。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 画像を分析する
- en・既存表示: Analyze image
- 目的: 実行対象を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.submitting

- 対応要素: X-02-S。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 分析中…
- en・既存表示: Analyzing...
- 目的: 既存の処理案内を定義する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.previewAlt

- 対応要素: X-02-I。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 分析対象画像: {fileName}
- en・既存表示: {fileName}
- 目的: ファイル名を含めて対象を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{fileName}`。

### api.previewFallback

- 対応要素: X-02-I。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 標準 ja: 分析対象画像
- en・既存表示: Uploaded preview
- 目的: ファイル名がない場合の既存代替情報を補足する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.resultHeading

- 対応要素: X-03。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 標準 ja: 結果の概要
- en・既存表示: Response summary
- 目的: 結果カードを識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.resultEmpty

- 対応要素: X-03。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 標準 ja: 分析結果はまだありません。
- en・既存表示: No analysis result yet.
- 目的: 空欄の意味を伝える。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.size

- 対応要素: X-04。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 標準 ja: 画像の大きさ
- en・既存表示: Size
- 目的: 縦横の項目を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.colorSpace

- 対応要素: X-05。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 標準 ja: 画像の色空間
- en・既存表示: Color space
- 目的: 入力の色空間を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.brightness

- 対応要素: X-06。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 標準 ja: 平均明るさ
- en・既存表示: Brightness
- 目的: APIの要約値を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.saturation

- 対応要素: X-06-S。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 標準 ja: 平均彩度
- en・既存表示: Saturation
- 目的: APIの要約値を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.summaryDescription

- 対応要素: X-07。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 標準 ja: 色の特徴
- en・既存表示: Description
- 目的: 動的な要約の項目を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanations

- 対応要素: X-09。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`。
- 標準 ja: 可視化の説明
- en・既存表示: Visualization explanations
- 目的: 説明領域を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationSummary

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 解析サマリー
- en・既存表示: 解析サマリー
- 目的: 既存の説明項目を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationSummaryDescription

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 主要色と統計値から画像全体の色傾向を要約する
- en・既存表示: 主要色と統計値から画像全体の色傾向を要約する
- 目的: 既存の生成文を保管する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationCube

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: RGBの色分布
- en・既存表示: RGB Cube 分布
- 目的: 説明対象の図を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationCubeDescription

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: RGB立方体内で色の分布密度を見る
- en・既存表示: RGB立方体内で色の分布密度を見る
- 目的: 既存の生成文を保管する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationCubeFindings

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 主要な量子化色: {colors}
- en・既存表示: 主要な量子化色は {colors}
- 目的: 動的な色の列を説明する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{colors}`。

### api.explanationCubeEmpty

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 分布は限定的
- en・既存表示: 分布は限定的
- 目的: 既存の所見文を保管する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationHue

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 色相ヒストグラム
- en・既存表示: Hue Histogram
- 目的: 説明対象を主画面と同じ名前にする。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationHueDescription

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 色相分布の偏りを見る
- en・既存表示: 色相分布の偏りを見る
- 目的: 既存の生成文を保管する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### api.explanationHueFindings

- 対応要素: X-10、R-03。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 色が含まれる区間数: {count}
- en・既存表示: 有効 bin 数は {count}
- 目的: binを意味で説明する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{count}`。

### html.title

- 対応要素: R-01。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: IroMap 画像の分析結果
- en・既存表示: IroMap image analysis result
- 目的: 単独の結果を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.summary

- 対応要素: R-01。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 解析の概要
- en・既存表示: Analysis summary
- 目的: 結果の情報群を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.imageSize

- 対応要素: R-02。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像の大きさ
- en・既存表示: Image size
- 目的: HTML結果の値を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.colorSpace

- 対応要素: R-02。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像の色空間
- en・既存表示: Color space
- 目的: HTML結果の値を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.dominantColors

- 対応要素: R-02。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 主要色
- en・既存表示: Dominant colors
- 目的: HTML結果の色の列を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.avgBrightness

- 対応要素: R-02。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 平均明るさ
- en・既存表示: Average brightness
- 目的: HTML結果の値を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.avgSaturation

- 対応要素: R-02。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 平均彩度
- en・既存表示: Average saturation
- 目的: HTML結果の値を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### html.description

- 対応要素: R-02。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 色の特徴
- en・既存表示: Description
- 目的: HTML結果の説明を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.title

- 対応要素: D-01。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: Agent API
- en・既存表示: Agent API
- 目的: 技術仕様のページを識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.intro

- 対応要素: D-01。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 画像のバイナリを受け取り、JSON形式で結果を返す公開APIです。呼び出し元IPによるVercel Rate Limitingの制限があります。
- en・既存表示: The API accepts raw image bytes and returns structured JSON. This endpoint is public and currently guarded by Vercel Rate Limiting on the caller IP.
- 目的: APIの前提を説明する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.endpoint

- 対応要素: D-02。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: エンドポイント
- en・既存表示: Endpoint
- 目的: 呼び出し先を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.endpointValue

- 対応要素: D-02。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: POST /api/analyze
- en・既存表示: POST /api/analyze
- 目的: 既存のメソッドとURLを維持する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.request

- 対応要素: D-03、D-04。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: リクエスト
- en・既存表示: Request
- 目的: 入力の条件と例を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.types

- 対応要素: D-03。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 対応Content-Type: {types}
- en・既存表示: Supported Content-Type: {types}
- 目的: MIME形式を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{types}`。

### docs.bodySize

- 対応要素: D-03。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 最大リクエストサイズ: {bytes} bytes
- en・既存表示: Maximum body size: {bytes} bytes
- 目的: 上限と単位を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{bytes}`。

### docs.pixels

- 対応要素: D-03。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 最大画素数: {pixels}
- en・既存表示: Maximum pixel count: {pixels}
- 目的: 上限を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{pixels}`。

### docs.response

- 対応要素: D-05、D-06。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: レスポンス
- en・既存表示: Response
- 目的: 出力の説明と例を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.responseDescription

- 対応要素: D-05。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 成功時は200 OKで、input、summary、analysis、visualization、explanationsを含むJSONを返します。
- en・既存表示: Successful responses return 200 OK with JSON containing input, summary, analysis, visualization, and explanations.
- 目的: 返却構造を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.errors

- 対応要素: D-07。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: エラーコード
- en・既存表示: Error codes
- 目的: 既存のエラー説明を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.error400

- 対応要素: D-07。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 400: 対応していないContent-Type
- en・既存表示: 400 unsupported content type
- 目的: 原因をコードと結びつける。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.error413

- 対応要素: D-07。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 413: リクエストサイズの上限超過
- en・既存表示: 413 payload too large
- 目的: 原因をコードと結びつける。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.error422

- 対応要素: D-07。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 422: 画像の読み取り失敗、または画素数の上限超過
- en・既存表示: 422 decode failure or pixel limit exceeded
- 目的: 原因をコードと結びつける。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.error429

- 対応要素: D-07。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 429: リクエスト回数の制限
- en・既存表示: 429 rate limited
- 目的: 原因をコードと結びつける。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.error408

- 対応要素: D-07。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 標準 ja: 408: 分析の時間制限
- en・既存表示: 408 analysis timeout
- 目的: 原因をコードと結びつける。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.rate

- 対応要素: D-08。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: アクセス回数の制限
- en・既存表示: Rate limiting
- 目的: 利用条件を識別する。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。

### docs.ratePolicy

- 対応要素: D-08。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 標準 ja: 初回公開時の制限: IPあたり1分間に{limit}回。
- en・既存表示: Initial policy: {limit} requests / minute / IP. This is intentionally conservative for the first public release.
- 目的: 既存の制限値を示す。
- 背景・根拠: 既存の直書き文言。en欄は現行表示、ja欄は日本語表示時の標準案。
- 変数: `{limit}`。

### api.error.IMAGE_DECODE_FAILED_DIMENSIONS

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像の大きさを読み取れませんでした。
- en・既存表示: Failed to decode image dimensions.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.PIXEL_COUNT_EXCEEDED

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像の画素数が上限を超えています。
- en・既存表示: Image pixel count exceeds the limit.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.ANALYSIS_TIMEOUT

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 分析の時間制限を超えました。
- en・既存表示: Analysis exceeded the time limit.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.RATE_CHECK_FAILED

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: アクセス回数の制限を確認できませんでした。
- en・既存表示: Rate limit check failed unexpectedly.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.UNSUPPORTED_CONTENT_TYPE

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: JPEG・PNG・WebPの画像を指定してください。
- en・既存表示: Supported content types are image/jpeg, image/png, and image/webp.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.EMPTY_IMAGE

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像データがありません。
- en・既存表示: Image body is empty.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.PAYLOAD_TOO_LARGE

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像データのサイズが上限を超えています。
- en・既存表示: Image body exceeds the maximum allowed size.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.IMAGE_DECODE_FAILED_BYTES

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 画像データを読み取れませんでした。
- en・既存表示: Failed to decode image bytes.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.INTERNAL_ERROR

- 対応要素: X-03。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 標準 ja: 分析を完了できませんでした。
- en・既存表示: Unexpected server error during analysis.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.RATE_LIMITED

- 対応要素: X-03。
- 参照元: `web/src/app/api/analyze/route.ts`。
- 標準 ja: このIPからのリクエスト回数が上限を超えています。
- en・既存表示: Too many requests from this IP address.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

### api.error.REQUEST_FAILED

- 対応要素: X-03。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。
- 標準 ja: サーバーの応答を受け取れませんでした。
- en・既存表示: Request failed before the server returned a response.
- 目的: APIエラーの本文を読み取れるようにする。
- 背景・根拠: 既存のサービスまたは確認ページから届く本文。error.codeは翻訳しない。

## 動的な表示値の文言定義

### 写真と解析の値

- 対応要素: P-05、P-13、P-16。
- 目的: ファイル名・密度・採取数・処理時間を文字列として識別する。
- 背景: 値は写真ごとに異なるため固定の見出しだけでは足りない。
- 値: fileName、value、sampleCount、sampledPixels、elapsedMs。
- 見える値はファイル名と単位を維持し、内部targetIdやanalysisIdは画面に表示しない。
- 既存の要約文字列photoSummaryは今回そのまま保管する。

### 図の値

- 対応要素: C-04、C-12、S-03、S-04、S-05。
- 目的: 空間・軸・固定値・表示点数の意味を図に付随させる。
- 背景: 図の色だけでは座標の意味が分からない。
- 空間名: RGB、HSL、Lab。
- 軸名: R、G、B、H、S、L、L\*、a\*、b\*。
- 値: 固定軸の現在値、図のサイズpx、RGB各成分の段階数、写真の点の数。
- 数値の取り得る範囲は情報設計S-04を参照する。
- ラベルの適用単位を初期のRGBだけに固定しない。

### 分析の繰り返し項目

- 対応要素: A-02、A-M01〜A-M11、A-11、A-12-G、A-14-G、A-16-G。
- 目的: 各項目の値を共通の型で読めるようにする。
- 背景: データの量に応じて行・棒・色見本が繰り返される。
- 指標: グループ名、指標名、数値、短い説明、補足説明。
- 面積比: 代表色のrgb文字列またはその他、割合、小数1桁の%。
- 棒: 区間の開始・終了・件数。
- 色コードの文法・数値精度・コピーの出力項目は既存仕様を継承する。

### API概要の生成文

- 対応要素: X-07、X-10、R-02、R-03。
- 目的: 動的な色の特徴の文章を漏れなく整理する。
- 背景: 既存APIは決まった断片を組み合わせてdescriptionを作る。
- 既存の温度傾向: 暖色寄り、寒色寄り、中立寄り。
- 既存の彩度傾向: 低彩度中心、低から中彩度中心、中彩度中心、高彩度中心。
- 既存の明暗傾向: コントラストは穏やか、コントラストは中程度、コントラストは強め。
- 既存の暗部の断片: 暗部は暖色、暗部は寒色。
- 組み合わせの区切り: 読点。
- 生成ルール・閾値・APIレスポンスの文字列は今回変更しない。
- 動的な数値と色: 画像の縦横、colorSpace、avgBrightness、avgSaturation、HEX値、割合、量子化色の列、有効区間数。

### API説明画面の表示例

- 対応要素: D-04、D-06。
- 目的: コード例の文字列も表示内容として定義する。
- 背景: 説明画面の一部なので通常のラベルだけを棚卸ししない。
- リクエスト例の識別子: curl、POST、$BASE_URL/api/analyze、Content-Type、Accept、--data-binary、photo.jpg。
- レスポンス例の識別子: input、mimeType、width、height、pixelCount、colorSpace、summary、dominantColors、hex、ratio、rgb、r、g、b、avgBrightness、avgSaturation、description。
- 既存の例の値と文字列を維持する。
- APIのキー・MIME・HTTPコード・error.codeは翻訳しない。
