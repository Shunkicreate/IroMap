# 設計に対する実装対応

- 位置づけ: 設計を実装へ対応させる下流の照合資料。設計の正本ではない。
- 依存方向: 実装対応は情報設計・用語集・標準表示文言に従う。コード変更を理由に正本を自動更新しない。
- 実装ファイルと辞書キーはこの文書へ記録する。未実装の設計にもIDを定義できる。
- 辞書キーが変わったときは実装側の対応を更新し、設計IDは改名しない。
- 文言の標準値はui-copy.mdから読む。ここには複製しない。
- 一時的な未実装・参照元の欠落は実装差分として報告する。
- 追加文言IDは現時点で実装の辞書キーへ未対応。参照コードは調査位置であり、文字列や表示条件の一致を保証しない。

## 情報要素の実装位置

### W-00

- 参照元: `web/src/app/page.tsx`。

### W-01

- 参照元: `web/src/app/page.tsx`。

### W-02

- 参照元: `web/src/components/theme-toggle.tsx`。

### W-03

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### P-00

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-01

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-02

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-03

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-04

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-05

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-06

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-07

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-08

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-09

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-10

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-11

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-12

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-13

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### P-14

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-15

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-16

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### C-00

- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### C-01

- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### C-02

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### C-03

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### C-04

- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。

### C-05

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### C-06

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### C-07

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### C-08

- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### C-09

- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### C-10

- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。

### C-11

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### C-12

- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### S-00

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-01

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-02

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-03

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-04

- 参照元: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### S-05

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-06

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-07

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-08

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-09

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### S-10

- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### I-00

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-01

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-02

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-03

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-04

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-05

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-06

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-07

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### I-08

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### A-00

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-01

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### A-02

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### A-M01

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M02

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M03

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M04

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M05

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M06

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M07

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M08

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M09

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M10

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-M11

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-03

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### A-04

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### A-05

- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### A-06

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-07

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-08

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### A-09

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### A-10

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-11

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### A-12

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-12-G

- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-14

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-14-G

- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-16

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-16-G

- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-18

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-19

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-20

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-21

- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### F-00

- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/inspector/color-inspector.tsx`。

### F-01

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### F-02

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### F-03

- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### F-04

- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### F-05

- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### F-06

- 参照元: `web/src/components/ui/sonner.tsx`、`web/src/app/layout.tsx`。

### X-00

- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。

### X-01

- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。

### X-02

- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### X-02-F

- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### X-02-S

- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### X-02-I

- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### X-03

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### X-04

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### X-05

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### X-06

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。

### X-06-S

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。

### X-07

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### X-08

- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### X-09

- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`。

### X-10

- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。

### D-00

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-01

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-02

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-03

- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### D-04

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-05

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-06

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-07

- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-08

- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### R-00

- 参照元: `web/src/lib/agent-analyze.ts`。

### R-01

- 参照元: `web/src/lib/agent-analyze.ts`。

### R-02

- 参照元: `web/src/lib/agent-analyze.ts`。

### R-03

- 参照元: `web/src/lib/agent-analyze.ts`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。

### B-00

- 参照元: `web/src/app/layout.tsx`。

### B-01

- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/slice/slice-canvas.tsx`、`web/src/features/inspector/color-inspector.tsx`、`web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/components/theme-toggle.tsx`。

### B-02

- 参照元: `web/src/components/workbench/panel-header.tsx`、`web/src/components/graph/graph-frame.tsx`、`web/src/components/workbench/persisted-disclosure.tsx`、`web/src/components/workbench/color-swatch.tsx`、`web/src/components/workbench/info-tooltip.tsx`。

### B-03

- 参照元: `web/src/app/layout.tsx`。

## 文言IDと実装キー

### heroTitle

- 文言ID: `heroTitle`。
- 実装キー: `heroTitle`。
- 参照元: `web/src/app/page.tsx`。

### heroDescription

- 文言ID: `heroDescription`。
- 実装キー: `heroDescription`。
- 参照元: `web/src/app/page.tsx`。

### workbenchThemeLabel

- 文言ID: `workbenchThemeLabel`。
- 実装キー: `workbenchThemeLabel`。
- 参照元: `web/src/components/theme-toggle.tsx`。

### workbenchThemeLight

- 文言ID: `workbenchThemeLight`。
- 実装キー: `workbenchThemeLight`。
- 参照元: `web/src/components/theme-toggle.tsx`。

### workbenchThemeDark

- 文言ID: `workbenchThemeDark`。
- 実装キー: `workbenchThemeDark`。
- 参照元: `web/src/components/theme-toggle.tsx`。

### workbenchInspectorDisclosure

- 文言ID: `workbenchInspectorDisclosure`。
- 実装キー: `workbenchInspectorDisclosure`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### workbenchDisplayOptionsDisclosure

- 文言ID: `workbenchDisplayOptionsDisclosure`。
- 実装キー: `workbenchDisplayOptionsDisclosure`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`、`web/src/features/slice/slice-canvas.tsx`。

### previewShowSamplingGrid

- 文言ID: `previewShowSamplingGrid`。
- 実装キー: `previewShowSamplingGrid`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### previewSamplingGridColorLabel

- 文言ID: `previewSamplingGridColorLabel`。
- 実装キー: `previewSamplingGridColorLabel`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### previewSamplingGridColorWhite

- 文言ID: `previewSamplingGridColorWhite`。
- 実装キー: `previewSamplingGridColorWhite`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### previewSamplingGridColorBlack

- 文言ID: `previewSamplingGridColorBlack`。
- 実装キー: `previewSamplingGridColorBlack`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### previewSamplingDensityLabel

- 文言ID: `previewSamplingDensityLabel`。
- 実装キー: `previewSamplingDensityLabel`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### previewSamplingDensityFullWarning

- 文言ID: `previewSamplingDensityFullWarning`。
- 実装キー: `previewSamplingDensityFullWarning`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchShowWhiteMappingCube

- 文言ID: `workbenchShowWhiteMappingCube`。
- 実装キー: `workbenchShowWhiteMappingCube`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### workbenchShowSelectedMappingCube

- 文言ID: `workbenchShowSelectedMappingCube`。
- 実装キー: `workbenchShowSelectedMappingCube`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### workbenchShowWhiteMappingSlice

- 文言ID: `workbenchShowWhiteMappingSlice`。
- 実装キー: `workbenchShowWhiteMappingSlice`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### workbenchShowSelectedMappingSlice

- 文言ID: `workbenchShowSelectedMappingSlice`。
- 実装キー: `workbenchShowSelectedMappingSlice`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### workbenchCopyFormatWorkbenchLabel

- 文言ID: `workbenchCopyFormatWorkbenchLabel`。
- 実装キー: `workbenchCopyFormatWorkbenchLabel`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchExportMarkdown

- 文言ID: `workbenchExportMarkdown`。
- 実装キー: `workbenchExportMarkdown`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchExportCsv

- 文言ID: `workbenchExportCsv`。
- 実装キー: `workbenchExportCsv`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchExportTsv

- 文言ID: `workbenchExportTsv`。
- 実装キー: `workbenchExportTsv`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchTableCopy

- 文言ID: `workbenchTableCopy`。
- 実装キー: `workbenchTableCopy`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchHistogramCopy

- 文言ID: `workbenchHistogramCopy`。
- 実装キー: `workbenchHistogramCopy`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### workbenchTableGroup

- 文言ID: `workbenchTableGroup`。
- 実装キー: `workbenchTableGroup`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchTableMetric

- 文言ID: `workbenchTableMetric`。
- 実装キー: `workbenchTableMetric`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchTableValue

- 文言ID: `workbenchTableValue`。
- 実装キー: `workbenchTableValue`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchTableDescription

- 文言ID: `workbenchTableDescription`。
- 実装キー: `workbenchTableDescription`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchMetricHelpLabel

- 文言ID: `workbenchMetricHelpLabel`。
- 実装キー: `workbenchMetricHelpLabel`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### workbenchHistogramCardTitle

- 文言ID: `workbenchHistogramCardTitle`。
- 実装キー: `workbenchHistogramCardTitle`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### workbenchMetricTableCopied

- 文言ID: `workbenchMetricTableCopied`。
- 実装キー: `workbenchMetricTableCopied`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### workbenchHistogramCopied

- 文言ID: `workbenchHistogramCopied`。
- 実装キー: `workbenchHistogramCopied`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### workbenchSelectionUpdated

- 文言ID: `workbenchSelectionUpdated`。
- 実装キー: `workbenchSelectionUpdated`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### workbenchSelectedColorUpdated

- 文言ID: `workbenchSelectedColorUpdated`。
- 実装キー: `workbenchSelectedColorUpdated`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### workbenchMetricLabelLMean

- 文言ID: `workbenchMetricLabelLMean`。
- 実装キー: `workbenchMetricLabelLMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelLStddev

- 文言ID: `workbenchMetricLabelLStddev`。
- 実装キー: `workbenchMetricLabelLStddev`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelLP95

- 文言ID: `workbenchMetricLabelLP95`。
- 実装キー: `workbenchMetricLabelLP95`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelAMean

- 文言ID: `workbenchMetricLabelAMean`。
- 実装キー: `workbenchMetricLabelAMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelBMean

- 文言ID: `workbenchMetricLabelBMean`。
- 実装キー: `workbenchMetricLabelBMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelCMean

- 文言ID: `workbenchMetricLabelCMean`。
- 実装キー: `workbenchMetricLabelCMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelCP95

- 文言ID: `workbenchMetricLabelCP95`。
- 実装キー: `workbenchMetricLabelCP95`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelNeutralDistanceMean

- 文言ID: `workbenchMetricLabelNeutralDistanceMean`。
- 実装キー: `workbenchMetricLabelNeutralDistanceMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelHighlightAMean

- 文言ID: `workbenchMetricLabelHighlightAMean`。
- 実装キー: `workbenchMetricLabelHighlightAMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelHighlightBMean

- 文言ID: `workbenchMetricLabelHighlightBMean`。
- 実装キー: `workbenchMetricLabelHighlightBMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricLabelHighlightNeutralDistanceMean

- 文言ID: `workbenchMetricLabelHighlightNeutralDistanceMean`。
- 実装キー: `workbenchMetricLabelHighlightNeutralDistanceMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionLMean

- 文言ID: `workbenchMetricDescriptionLMean`。
- 実装キー: `workbenchMetricDescriptionLMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionLStddev

- 文言ID: `workbenchMetricDescriptionLStddev`。
- 実装キー: `workbenchMetricDescriptionLStddev`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionLP95

- 文言ID: `workbenchMetricDescriptionLP95`。
- 実装キー: `workbenchMetricDescriptionLP95`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionAMean

- 文言ID: `workbenchMetricDescriptionAMean`。
- 実装キー: `workbenchMetricDescriptionAMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionBMean

- 文言ID: `workbenchMetricDescriptionBMean`。
- 実装キー: `workbenchMetricDescriptionBMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionCMean

- 文言ID: `workbenchMetricDescriptionCMean`。
- 実装キー: `workbenchMetricDescriptionCMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionCP95

- 文言ID: `workbenchMetricDescriptionCP95`。
- 実装キー: `workbenchMetricDescriptionCP95`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionNeutralDistanceMean

- 文言ID: `workbenchMetricDescriptionNeutralDistanceMean`。
- 実装キー: `workbenchMetricDescriptionNeutralDistanceMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionHighlightAMean

- 文言ID: `workbenchMetricDescriptionHighlightAMean`。
- 実装キー: `workbenchMetricDescriptionHighlightAMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionHighlightBMean

- 文言ID: `workbenchMetricDescriptionHighlightBMean`。
- 実装キー: `workbenchMetricDescriptionHighlightBMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricDescriptionHighlightNeutralDistanceMean

- 文言ID: `workbenchMetricDescriptionHighlightNeutralDistanceMean`。
- 実装キー: `workbenchMetricDescriptionHighlightNeutralDistanceMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipLMean

- 文言ID: `workbenchMetricTooltipLMean`。
- 実装キー: `workbenchMetricTooltipLMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipLStddev

- 文言ID: `workbenchMetricTooltipLStddev`。
- 実装キー: `workbenchMetricTooltipLStddev`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipLP95

- 文言ID: `workbenchMetricTooltipLP95`。
- 実装キー: `workbenchMetricTooltipLP95`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipAMean

- 文言ID: `workbenchMetricTooltipAMean`。
- 実装キー: `workbenchMetricTooltipAMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipBMean

- 文言ID: `workbenchMetricTooltipBMean`。
- 実装キー: `workbenchMetricTooltipBMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipCMean

- 文言ID: `workbenchMetricTooltipCMean`。
- 実装キー: `workbenchMetricTooltipCMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipCP95

- 文言ID: `workbenchMetricTooltipCP95`。
- 実装キー: `workbenchMetricTooltipCP95`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipNeutralDistanceMean

- 文言ID: `workbenchMetricTooltipNeutralDistanceMean`。
- 実装キー: `workbenchMetricTooltipNeutralDistanceMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipHighlightAMean

- 文言ID: `workbenchMetricTooltipHighlightAMean`。
- 実装キー: `workbenchMetricTooltipHighlightAMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipHighlightBMean

- 文言ID: `workbenchMetricTooltipHighlightBMean`。
- 実装キー: `workbenchMetricTooltipHighlightBMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### workbenchMetricTooltipHighlightNeutralDistanceMean

- 文言ID: `workbenchMetricTooltipHighlightNeutralDistanceMean`。
- 実装キー: `workbenchMetricTooltipHighlightNeutralDistanceMean`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### panelRgbCube

- 文言ID: `panelRgbCube`。
- 実装キー: `panelRgbCube`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### panelRgbCubeRequirements

- 文言ID: `panelRgbCubeRequirements`。
- 実装キー: `panelRgbCubeRequirements`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### panelInspector

- 文言ID: `panelInspector`。
- 実装キー: `panelInspector`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### panelInspectorRequirements

- 文言ID: `panelInspectorRequirements`。
- 実装キー: `panelInspectorRequirements`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### panelSlice

- 文言ID: `panelSlice`。
- 実装キー: `panelSlice`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### panelSliceRequirements

- 文言ID: `panelSliceRequirements`。
- 実装キー: `panelSliceRequirements`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### panelMetrics

- 文言ID: `panelMetrics`。
- 実装キー: `panelMetrics`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### panelMetricsRequirements

- 文言ID: `panelMetricsRequirements`。
- 実装キー: `panelMetricsRequirements`。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### panelPhotoAnalysis

- 文言ID: `panelPhotoAnalysis`。
- 実装キー: `panelPhotoAnalysis`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### panelPhotoAnalysisRequirements

- 文言ID: `panelPhotoAnalysisRequirements`。
- 実装キー: `panelPhotoAnalysisRequirements`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### spaceRgb

- 文言ID: `spaceRgb`。
- 実装キー: `spaceRgb`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### spaceHsl

- 文言ID: `spaceHsl`。
- 実装キー: `spaceHsl`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### spaceLab

- 文言ID: `spaceLab`。
- 実装キー: `spaceLab`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeShowAxisGuide

- 文言ID: `cubeShowAxisGuide`。
- 実装キー: `cubeShowAxisGuide`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。

### cubeShowSizeSlider

- 文言ID: `cubeShowSizeSlider`。
- 実装キー: `cubeShowSizeSlider`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeSizeLabel

- 文言ID: `cubeSizeLabel`。
- 実装キー: `cubeSizeLabel`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeOverlayModeLabel

- 文言ID: `cubeOverlayModeLabel`。
- 実装キー: `cubeOverlayModeLabel`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeOverlayModeGrid

- 文言ID: `cubeOverlayModeGrid`。
- 実装キー: `cubeOverlayModeGrid`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeOverlayModeImage

- 文言ID: `cubeOverlayModeImage`。
- 実装キー: `cubeOverlayModeImage`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeOverlayModeBoth

- 文言ID: `cubeOverlayModeBoth`。
- 実装キー: `cubeOverlayModeBoth`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### cubeOverlayStatus

- 文言ID: `cubeOverlayStatus`。
- 実装キー: `cubeOverlayStatus`。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### inspectorPreview

- 文言ID: `inspectorPreview`。
- 実装キー: `inspectorPreview`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### inspectorSelected

- 文言ID: `inspectorSelected`。
- 実装キー: `inspectorSelected`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### inspectorHoverLabel

- 文言ID: `inspectorHoverLabel`。
- 実装キー: `inspectorHoverLabel`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### inspectorSelectedLabel

- 文言ID: `inspectorSelectedLabel`。
- 実装キー: `inspectorSelectedLabel`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### inspectorNoSelected

- 文言ID: `inspectorNoSelected`。
- 実装キー: `inspectorNoSelected`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyFormatHex

- 文言ID: `copyFormatHex`。
- 実装キー: `copyFormatHex`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyFormatRgb

- 文言ID: `copyFormatRgb`。
- 実装キー: `copyFormatRgb`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyFormatHsl

- 文言ID: `copyFormatHsl`。
- 実装キー: `copyFormatHsl`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyButton

- 文言ID: `copyButton`。
- 実装キー: `copyButton`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyNeedSelection

- 文言ID: `copyNeedSelection`。
- 実装キー: `copyNeedSelection`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyCopied

- 文言ID: `copyCopied`。
- 実装キー: `copyCopied`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyFailed

- 文言ID: `copyFailed`。
- 実装キー: `copyFailed`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyPasteButton

- 文言ID: `copyPasteButton`。
- 実装キー: `copyPasteButton`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyPasteApplied

- 文言ID: `copyPasteApplied`。
- 実装キー: `copyPasteApplied`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyPasteUnsupported

- 文言ID: `copyPasteUnsupported`。
- 実装キー: `copyPasteUnsupported`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### copyPasteFailed

- 文言ID: `copyPasteFailed`。
- 実装キー: `copyPasteFailed`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### inspectorPasteSection

- 文言ID: `inspectorPasteSection`。
- 実装キー: `inspectorPasteSection`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### inspectorPasteHint

- 文言ID: `inspectorPasteHint`。
- 実装キー: `inspectorPasteHint`。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### sliceAxisLabel

- 文言ID: `sliceAxisLabel`。
- 実装キー: `sliceAxisLabel`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisR

- 文言ID: `sliceAxisR`。
- 実装キー: `sliceAxisR`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisG

- 文言ID: `sliceAxisG`。
- 実装キー: `sliceAxisG`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisB

- 文言ID: `sliceAxisB`。
- 実装キー: `sliceAxisB`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisH

- 文言ID: `sliceAxisH`。
- 実装キー: `sliceAxisH`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisS

- 文言ID: `sliceAxisS`。
- 実装キー: `sliceAxisS`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisL

- 文言ID: `sliceAxisL`。
- 実装キー: `sliceAxisL`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisLabL

- 文言ID: `sliceAxisLabL`。
- 実装キー: `sliceAxisLabL`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisLabA

- 文言ID: `sliceAxisLabA`。
- 実装キー: `sliceAxisLabA`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisLabB

- 文言ID: `sliceAxisLabB`。
- 実装キー: `sliceAxisLabB`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceValueLabel

- 文言ID: `sliceValueLabel`。
- 実装キー: `sliceValueLabel`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### sliceMoveToSelectedColor

- 文言ID: `sliceMoveToSelectedColor`。
- 実装キー: `sliceMoveToSelectedColor`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceFixedAxisLabel

- 文言ID: `sliceFixedAxisLabel`。
- 実装キー: `sliceFixedAxisLabel`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### sliceAxisXLabel

- 文言ID: `sliceAxisXLabel`。
- 実装キー: `sliceAxisXLabel`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### sliceAxisYLabel

- 文言ID: `sliceAxisYLabel`。
- 実装キー: `sliceAxisYLabel`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### photoUploadLabel

- 文言ID: `photoUploadLabel`。
- 実装キー: `photoUploadLabel`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPreviewTitle

- 文言ID: `photoPreviewTitle`。
- 実装キー: `photoPreviewTitle`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoMetaSummary

- 文言ID: `photoMetaSummary`。
- 実装キー: `photoMetaSummary`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPreviewAlt

- 文言ID: `photoPreviewAlt`。
- 実装キー: `photoPreviewAlt`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPreviewEmpty

- 文言ID: `photoPreviewEmpty`。
- 実装キー: `photoPreviewEmpty`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### photoUploadSelected

- 文言ID: `photoUploadSelected`。
- 実装キー: `photoUploadSelected`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPasteApplied

- 文言ID: `photoPasteApplied`。
- 実装キー: `photoPasteApplied`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### photoPasteNoImage

- 文言ID: `photoPasteNoImage`。
- 実装キー: `photoPasteNoImage`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### photoChooseAction

- 文言ID: `photoChooseAction`。
- 実装キー: `photoChooseAction`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPasteAction

- 文言ID: `photoPasteAction`。
- 実装キー: `photoPasteAction`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPasteActionHint

- 文言ID: `photoPasteActionHint`。
- 実装キー: `photoPasteActionHint`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoPasteChooseRecovery

- 文言ID: `photoPasteChooseRecovery`。
- 実装キー: `photoPasteChooseRecovery`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### photoPasteInputLabel

- 文言ID: `photoPasteInputLabel`。
- 実装キー: `photoPasteInputLabel`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### photoAnalyzing

- 文言ID: `photoAnalyzing`。
- 実装キー: `photoAnalyzing`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### photoError

- 文言ID: `photoError`。
- 実装キー: `photoError`。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。

### photoLabScatter

- 文言ID: `photoLabScatter`。
- 実装キー: `photoLabScatter`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### photoHueHistogram

- 文言ID: `photoHueHistogram`。
- 実装キー: `photoHueHistogram`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### photoSaturationHistogram

- 文言ID: `photoSaturationHistogram`。
- 実装キー: `photoSaturationHistogram`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### photoColorAreaRatio

- 文言ID: `photoColorAreaRatio`。
- 実装キー: `photoColorAreaRatio`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### photoInsightTitle

- 文言ID: `photoInsightTitle`。
- 実装キー: `photoInsightTitle`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### photoInsightHue

- 文言ID: `photoInsightHue`。
- 実装キー: `photoInsightHue`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightSaturation

- 文言ID: `photoInsightSaturation`。
- 実装キー: `photoInsightSaturation`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightHueBalanced

- 文言ID: `photoInsightHueBalanced`。
- 実装キー: `photoInsightHueBalanced`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightHueModerate

- 文言ID: `photoInsightHueModerate`。
- 実装キー: `photoInsightHueModerate`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightHueNarrow

- 文言ID: `photoInsightHueNarrow`。
- 実装キー: `photoInsightHueNarrow`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightSatHigh

- 文言ID: `photoInsightSatHigh`。
- 実装キー: `photoInsightSatHigh`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightSatMid

- 文言ID: `photoInsightSatMid`。
- 実装キー: `photoInsightSatMid`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoInsightSatLow

- 文言ID: `photoInsightSatLow`。
- 実装キー: `photoInsightSatLow`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。

### photoOthers

- 文言ID: `photoOthers`。
- 実装キー: `photoOthers`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### photoSummary

- 文言ID: `photoSummary`。
- 実装キー: `photoSummary`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### graphAxisLabA

- 文言ID: `graphAxisLabA`。
- 実装キー: `graphAxisLabA`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### graphAxisLabB

- 文言ID: `graphAxisLabB`。
- 実装キー: `graphAxisLabB`。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### graphAxisHue

- 文言ID: `graphAxisHue`。
- 実装キー: `graphAxisHue`。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### graphAxisLuminance

- 文言ID: `graphAxisLuminance`。
- 実装キー: `graphAxisLuminance`。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### graphAxisSaturation

- 文言ID: `graphAxisSaturation`。
- 実装キー: `graphAxisSaturation`。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### graphAxisCount

- 文言ID: `graphAxisCount`。
- 実装キー: `graphAxisCount`。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### cubeCanvasAriaLabel

- 文言ID: `cubeCanvasAriaLabel`。
- 実装キー: `cubeCanvasAriaLabel`。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### sliceCanvasAriaLabel

- 文言ID: `sliceCanvasAriaLabel`。
- 実装キー: `sliceCanvasAriaLabel`。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

### cubeResolutionOverlay

- 文言ID: `cubeResolutionOverlay`。
- 実装キー: `cubeResolutionOverlay`。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。

### cubeSliceOverlay

- 文言ID: `cubeSliceOverlay`。
- 実装キー: `cubeSliceOverlay`。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。

### workbenchTableKey

- 文言ID: `workbenchTableKey`。
- 実装キー: `workbenchTableKey`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### workbenchTableUnit

- 文言ID: `workbenchTableUnit`。
- 実装キー: `workbenchTableUnit`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### graphAxisBin

- 文言ID: `graphAxisBin`。
- 実装キー: `graphAxisBin`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### graphAxisStart

- 文言ID: `graphAxisStart`。
- 実装キー: `graphAxisStart`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### graphAxisEnd

- 文言ID: `graphAxisEnd`。
- 実装キー: `graphAxisEnd`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### graphAxisRatio

- 文言ID: `graphAxisRatio`。
- 実装キー: `graphAxisRatio`。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

### landingWorkbenchHeading

- 文言ID: `landingWorkbenchHeading`。
- 実装キー: `landingWorkbenchHeading`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchUploadDisclosure

- 文言ID: `workbenchUploadDisclosure`。
- 実装キー: `workbenchUploadDisclosure`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchBaselineLabel

- 文言ID: `workbenchBaselineLabel`。
- 実装キー: `workbenchBaselineLabel`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchMetricsTableTitle

- 文言ID: `workbenchMetricsTableTitle`。
- 実装キー: `workbenchMetricsTableTitle`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchHistogramAllTitle

- 文言ID: `workbenchHistogramAllTitle`。
- 実装キー: `workbenchHistogramAllTitle`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchMetricLabelSelectionCoverageRatio

- 文言ID: `workbenchMetricLabelSelectionCoverageRatio`。
- 実装キー: `workbenchMetricLabelSelectionCoverageRatio`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchMetricDescriptionSelectionCoverageRatio

- 文言ID: `workbenchMetricDescriptionSelectionCoverageRatio`。
- 実装キー: `workbenchMetricDescriptionSelectionCoverageRatio`。
- 参照元: `web/src/i18n/messages.ts`。

### workbenchMetricTooltipSelectionCoverageRatio

- 文言ID: `workbenchMetricTooltipSelectionCoverageRatio`。
- 実装キー: `workbenchMetricTooltipSelectionCoverageRatio`。
- 参照元: `web/src/i18n/messages.ts`。

### panelLabScatter

- 文言ID: `panelLabScatter`。
- 実装キー: `panelLabScatter`。
- 参照元: `web/src/i18n/messages.ts`。

### panelLabScatterRequirements

- 文言ID: `panelLabScatterRequirements`。
- 実装キー: `panelLabScatterRequirements`。
- 参照元: `web/src/i18n/messages.ts`。

### inspectorNoHover

- 文言ID: `inspectorNoHover`。
- 実装キー: `inspectorNoHover`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteZoneLabel

- 文言ID: `photoPasteZoneLabel`。
- 実装キー: `photoPasteZoneLabel`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteZoneTitle

- 文言ID: `photoPasteZoneTitle`。
- 実装キー: `photoPasteZoneTitle`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteZoneHint

- 文言ID: `photoPasteZoneHint`。
- 実装キー: `photoPasteZoneHint`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteZoneDescription

- 文言ID: `photoPasteZoneDescription`。
- 実装キー: `photoPasteZoneDescription`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteZoneShortcut

- 文言ID: `photoPasteZoneShortcut`。
- 実装キー: `photoPasteZoneShortcut`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteButton

- 文言ID: `photoPasteButton`。
- 実装キー: `photoPasteButton`。
- 参照元: `web/src/i18n/messages.ts`。

### photoUploadCtaTitle

- 文言ID: `photoUploadCtaTitle`。
- 実装キー: `photoUploadCtaTitle`。
- 参照元: `web/src/i18n/messages.ts`。

### photoUploadCtaDescription

- 文言ID: `photoUploadCtaDescription`。
- 実装キー: `photoUploadCtaDescription`。
- 参照元: `web/src/i18n/messages.ts`。

### photoUploadButton

- 文言ID: `photoUploadButton`。
- 実装キー: `photoUploadButton`。
- 参照元: `web/src/i18n/messages.ts`。

### photoUploadCleared

- 文言ID: `photoUploadCleared`。
- 実装キー: `photoUploadCleared`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteInputHint

- 文言ID: `photoPasteInputHint`。
- 実装キー: `photoPasteInputHint`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteUnsupported

- 文言ID: `photoPasteUnsupported`。
- 実装キー: `photoPasteUnsupported`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteAccessFailed

- 文言ID: `photoPasteAccessFailed`。
- 実装キー: `photoPasteAccessFailed`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteReadFailed

- 文言ID: `photoPasteReadFailed`。
- 実装キー: `photoPasteReadFailed`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteRecoveryHint

- 文言ID: `photoPasteRecoveryHint`。
- 実装キー: `photoPasteRecoveryHint`。
- 参照元: `web/src/i18n/messages.ts`。

### photoPasteFocusInput

- 文言ID: `photoPasteFocusInput`。
- 実装キー: `photoPasteFocusInput`。
- 参照元: `web/src/i18n/messages.ts`。

### photoInspectOnCube

- 文言ID: `photoInspectOnCube`。
- 実装キー: `photoInspectOnCube`。
- 参照元: `web/src/i18n/messages.ts`。

### photoInsightSpread

- 文言ID: `photoInsightSpread`。
- 実装キー: `photoInsightSpread`。
- 参照元: `web/src/i18n/messages.ts`。

### photoInsightSpreadWide

- 文言ID: `photoInsightSpreadWide`。
- 実装キー: `photoInsightSpreadWide`。
- 参照元: `web/src/i18n/messages.ts`。

### photoInsightSpreadMedium

- 文言ID: `photoInsightSpreadMedium`。
- 実装キー: `photoInsightSpreadMedium`。
- 参照元: `web/src/i18n/messages.ts`。

### photoInsightSpreadNarrow

- 文言ID: `photoInsightSpreadNarrow`。
- 実装キー: `photoInsightSpreadNarrow`。
- 参照元: `web/src/i18n/messages.ts`。

### cubeSpaceOverlay

- 文言ID: `cubeSpaceOverlay`。
- 実装キー: `cubeSpaceOverlay`。
- 参照元: `web/src/i18n/messages.ts`。

### proposal.photoOpen

- 文言ID: `proposal.photoOpen`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### proposal.photoClose

- 文言ID: `proposal.photoClose`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### proposal.metricsOpen

- 文言ID: `proposal.metricsOpen`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### proposal.analysisOpen

- 文言ID: `proposal.analysisOpen`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### proposal.copyColorFormat

- 文言ID: `proposal.copyColorFormat`。
- 実装キー: 未対応。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### proposal.colorMissing

- 文言ID: `proposal.colorMissing`。
- 実装キー: 未対応。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。

### proposal.metricMissing

- 文言ID: `proposal.metricMissing`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

### proposal.metricGroupChroma

- 文言ID: `proposal.metricGroupChroma`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### proposal.metricGroupHighlight

- 文言ID: `proposal.metricGroupHighlight`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### proposal.metricGroupLightness

- 文言ID: `proposal.metricGroupLightness`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### proposal.metricGroupColorBias

- 文言ID: `proposal.metricGroupColorBias`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### proposal.metricGroupNeutral

- 文言ID: `proposal.metricGroupNeutral`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。

### proposal.themeAction

- 文言ID: `proposal.themeAction`。
- 実装キー: 未対応。
- 参照元: `web/src/components/theme-toggle.tsx`。

### proposal.histogramBar

- 文言ID: `proposal.histogramBar`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### proposal.scatterAria

- 文言ID: `proposal.scatterAria`。
- 実装キー: 未対応。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

### metadata.title

- 文言ID: `metadata.title`。
- 実装キー: 未対応。
- 参照元: `web/src/app/layout.tsx`。

### metadata.description

- 文言ID: `metadata.description`。
- 実装キー: 未対応。
- 参照元: `web/src/app/layout.tsx`。

### api.eyebrow

- 文言ID: `api.eyebrow`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。

### api.title

- 文言ID: `api.title`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。

### api.description

- 文言ID: `api.description`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。

### api.input

- 文言ID: `api.input`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.supportedTypes

- 文言ID: `api.supportedTypes`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.fileInput

- 文言ID: `api.fileInput`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.submit

- 文言ID: `api.submit`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.submitting

- 文言ID: `api.submitting`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.previewAlt

- 文言ID: `api.previewAlt`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.previewFallback

- 文言ID: `api.previewFallback`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。

### api.resultHeading

- 文言ID: `api.resultHeading`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### api.resultEmpty

- 文言ID: `api.resultEmpty`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### api.size

- 文言ID: `api.size`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### api.colorSpace

- 文言ID: `api.colorSpace`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### api.brightness

- 文言ID: `api.brightness`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。

### api.saturation

- 文言ID: `api.saturation`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。

### api.summaryDescription

- 文言ID: `api.summaryDescription`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### api.explanations

- 文言ID: `api.explanations`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`。

### api.explanationSummary

- 文言ID: `api.explanationSummary`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationSummaryDescription

- 文言ID: `api.explanationSummaryDescription`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationCube

- 文言ID: `api.explanationCube`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationCubeDescription

- 文言ID: `api.explanationCubeDescription`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationCubeFindings

- 文言ID: `api.explanationCubeFindings`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationCubeEmpty

- 文言ID: `api.explanationCubeEmpty`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationHue

- 文言ID: `api.explanationHue`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationHueDescription

- 文言ID: `api.explanationHueDescription`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### api.explanationHueFindings

- 文言ID: `api.explanationHueFindings`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/lib/agent-analyze.ts`。

### html.title

- 文言ID: `html.title`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.summary

- 文言ID: `html.summary`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.imageSize

- 文言ID: `html.imageSize`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.colorSpace

- 文言ID: `html.colorSpace`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.dominantColors

- 文言ID: `html.dominantColors`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.avgBrightness

- 文言ID: `html.avgBrightness`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.avgSaturation

- 文言ID: `html.avgSaturation`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### html.description

- 文言ID: `html.description`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### docs.title

- 文言ID: `docs.title`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.intro

- 文言ID: `docs.intro`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.endpoint

- 文言ID: `docs.endpoint`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.endpointValue

- 文言ID: `docs.endpointValue`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.request

- 文言ID: `docs.request`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### docs.types

- 文言ID: `docs.types`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### docs.bodySize

- 文言ID: `docs.bodySize`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### docs.pixels

- 文言ID: `docs.pixels`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### docs.response

- 文言ID: `docs.response`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.responseDescription

- 文言ID: `docs.responseDescription`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.errors

- 文言ID: `docs.errors`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.error400

- 文言ID: `docs.error400`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.error413

- 文言ID: `docs.error413`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.error422

- 文言ID: `docs.error422`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.error429

- 文言ID: `docs.error429`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.error408

- 文言ID: `docs.error408`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### docs.rate

- 文言ID: `docs.rate`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### docs.ratePolicy

- 文言ID: `docs.ratePolicy`。
- 実装キー: 未対応。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。

### api.error.IMAGE_DECODE_FAILED_DIMENSIONS

- 文言ID: `api.error.IMAGE_DECODE_FAILED_DIMENSIONS`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.PIXEL_COUNT_EXCEEDED

- 文言ID: `api.error.PIXEL_COUNT_EXCEEDED`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.ANALYSIS_TIMEOUT

- 文言ID: `api.error.ANALYSIS_TIMEOUT`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.RATE_CHECK_FAILED

- 文言ID: `api.error.RATE_CHECK_FAILED`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.UNSUPPORTED_CONTENT_TYPE

- 文言ID: `api.error.UNSUPPORTED_CONTENT_TYPE`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.EMPTY_IMAGE

- 文言ID: `api.error.EMPTY_IMAGE`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.PAYLOAD_TOO_LARGE

- 文言ID: `api.error.PAYLOAD_TOO_LARGE`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.IMAGE_DECODE_FAILED_BYTES

- 文言ID: `api.error.IMAGE_DECODE_FAILED_BYTES`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.INTERNAL_ERROR

- 文言ID: `api.error.INTERNAL_ERROR`。
- 実装キー: 未対応。
- 参照元: `web/src/lib/agent-analyze.ts`。

### api.error.RATE_LIMITED

- 文言ID: `api.error.RATE_LIMITED`。
- 実装キー: 未対応。
- 参照元: `web/src/app/api/analyze/route.ts`。

### api.error.REQUEST_FAILED

- 文言ID: `api.error.REQUEST_FAILED`。
- 実装キー: 未対応。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。
