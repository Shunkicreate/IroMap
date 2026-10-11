# 情報整理の棚卸しと照合記録

- 目的: 情報要素の抜けと、既存機能・今回の提案の混同を検出する。
- 背景: 「画面のすべての要素」を定義するため、実際に使われる画面・構成部品・辞書を照合する必要がある。
- 対象の正本: [情報の重要度と開示階層](information-architecture.md)、[用語集](glossary.md)、[標準表示文言](ui-copy.md)。
- 参照: [mainの固定コミット](https://github.com/Shunkicreate/IroMap/tree/3256f13ffd13b86c84889a6e12bbdcd36ffc6713)。
- 棚卸し方式: ソース上の画面・描画・繰り返し項目・可視文言・読み上げ情報の照合。
- 検証範囲: ソースと文書の照合。起動したアプリの画面監査や利用者テストの完了を意味しない。
- 状態遷移・更新規則の監査はこの記録の対象外。
- 文書の役割: 過去の棚卸し根拠と検査結果。実装が従う正本は情報設計・用語集・標準表示文言・state-transitions.mdに置く。
- 実装との対応: コードのパスと辞書キーは下流のimplementation-map.mdへ分離した。正本にはコード参照の必須項目を持たせない。
- 追加の棚卸し: リモートで統合された3D軸の数値目盛りをC-04とHSLの投影の定義へ反映。現在の照合対象は更新後のコード、初回の根拠は以下の固定コミットとして保持する。

## 対象の境界

- 主画面: /。
- API確認画面: /analyze。
- APIの説明画面: /docs/agent-api。
- APIの可視出力: POST /api/analyzeのHTML結果。
- ページ共通要素: テーマ、通知、読み上げ、ブラウザタブの名称。
- サンプル点・ヒストグラムの棒・表の行・主要色・説明文は繰り返し表示の型として定義する。
- 写真の点・領域・一時参照の目印、図の軸・描画層・装飾アイコンも所属要素の内容として定義する。
- ネイティブのファイル選択ダイアログやOS・ブラウザ自身の文言は範囲外。アプリからの入力入口と読み上げ名は範囲内。
- JSONだけのAPI契約、非表示の内部ID、解析の性能ログ、保存キー、開発ツールは画面情報の定義から除く。
- 現在の経路に配置されていないPhotoAnalysisPanel・WorkbenchScatterPanel等は、現在の画面要素として追加しない。
- 配色、角丸、ガラス表現、アニメーション、具体寸法はこの情報整理で確定しない。

## 要素の対応

- 情報単位の定義数: 126。領域・複合要素・繰り返し項目の型を含み、DOMノードの個数とは別。
- 共通用語の定義数: 42。
- 各情報単位に目的・背景・重要度・開示区分・内容・根拠区分を持たせた。実装の参照元を定義の前提にしない。

### 作業画面の共通情報

- 対応する要素: W-00、W-01、W-02、W-03。
- 照合対象: `web/src/app/page.tsx`、`web/src/components/theme-toggle.tsx`、`web/src/features/inspector/color-inspector.tsx`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### 写真

- 対応する要素: P-00、P-01、P-02、P-03、P-04、P-05、P-06、P-07、P-08、P-09、P-10、P-11、P-12、P-13、P-14、P-15、P-16。
- 照合対象: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### 3Dキューブ

- 対応する要素: C-00、C-01、C-02、C-03、C-04、C-05、C-06、C-07、C-08、C-09、C-10、C-11、C-12。
- 照合対象: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### スライス

- 対応する要素: S-00、S-01、S-02、S-03、S-04、S-05、S-06、S-07、S-08、S-09、S-10。
- 照合対象: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### 色の数値

- 対応する要素: I-00、I-01、I-02、I-03、I-04、I-05、I-06、I-07、I-08。
- 照合対象: `web/src/features/inspector/color-inspector.tsx`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### 補助分析

- 対応する要素: A-00、A-01、A-02、A-M01、A-M02、A-M03、A-M04、A-M05、A-M06、A-M07、A-M08、A-M09、A-M10、A-M11、A-03、A-04、A-05、A-06、A-07、A-08、A-09、A-10、A-11、A-12、A-12-G、A-14、A-14-G、A-16、A-16-G、A-18、A-19、A-20、A-21。
- 照合対象: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`、`web/src/features/workbench/workbench-histogram-chart.tsx`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### 案内と結果の文言

- 対応する要素: F-00、F-01、F-02、F-03、F-04、F-05、F-06。
- 照合対象: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/inspector/color-inspector.tsx`、`web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/components/ui/sonner.tsx`、`web/src/app/layout.tsx`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### APIの分析確認画面

- 対応する要素: X-00、X-01、X-02、X-02-F、X-02-S、X-02-I、X-03、X-04、X-05、X-06、X-06-S、X-07、X-08、X-09、X-10。
- 照合対象: `web/src/features/agent-api/agent-analyze-page.tsx`、`web/src/features/agent-api/agent-analyze-input-card.tsx`、`web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`、`web/src/features/agent-api/agent-analyze-explanations.tsx`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### APIの説明画面

- 対応する要素: D-00、D-01、D-02、D-03、D-04、D-05、D-06、D-07、D-08。
- 照合対象: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### APIのHTML結果

- 対応する要素: R-00、R-01、R-02、R-03。
- 照合対象: `web/src/lib/agent-analyze.ts`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

### 表示を支える共通要素

- 対応する要素: B-00、B-01、B-02、B-03。
- 照合対象: `web/src/app/layout.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/slice/slice-canvas.tsx`、`web/src/features/inspector/color-inspector.tsx`、`web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/components/theme-toggle.tsx`、`web/src/components/workbench/panel-header.tsx`、`web/src/components/graph/graph-frame.tsx`、`web/src/components/workbench/persisted-disclosure.tsx`、`web/src/components/workbench/color-swatch.tsx`、`web/src/components/workbench/info-tooltip.tsx`。
- 根拠の区別: 既存の内容と、情報の配置・開示・読み上げの追加案を各要素に記載。

## 文言の対応

- 既存ja辞書: 199項目。
- 既存en辞書: 199項目。
- 対応する情報要素を持つ辞書キー: 160項目。
- このうち現行画面の参照コードでは未使用だが設計案に採用するもの: inspectorNoSelected。選択色の最小情報の案内として明記。
- コピー専用の既存項目名: 6項目。コピーの内容は変更しない。
- 現在の表示に採用しない保管項目: 33項目。
- 辞書の各キーは一度ずつui-copy.mdに収録。表示用とコピー用の共有は注記。
- 合成文言・直書き文言・追加案: 81定義。
- 動的な値・文章断片・API説明画面の表示例も別の型として記載。
- 既存プレースホルダー名は維持する。
- 文言の標準化は設計草案。アプリのi18n辞書とAPIの返却文字列は未変更。

### コピー専用の項目

- 目的: 現在の出力項目を失わず、画面にある列と区別する。
- 背景: キー・単位などは画面の表の列に出ていない。
- 対象: workbenchTableKey、workbenchTableUnit、graphAxisBin、graphAxisStart、graphAxisEnd、graphAxisRatio。
- コピー対象・内容・出力の既定値の新しい設計はしない。

### 現在は表示しない項目

- 目的: 辞書にあることと画面にあることを区別する。
- 背景: 古い案や現在未配置の部品の文言も辞書に残っている。
- 対象:
  - landingWorkbenchHeading。
  - workbenchUploadDisclosure。
  - workbenchBaselineLabel。
  - workbenchMetricsTableTitle。
  - workbenchHistogramAllTitle。
  - workbenchMetricLabelSelectionCoverageRatio。
  - workbenchMetricDescriptionSelectionCoverageRatio。
  - workbenchMetricTooltipSelectionCoverageRatio。
  - panelLabScatter。
  - panelLabScatterRequirements。
  - inspectorNoHover。
  - photoPasteZoneLabel。
  - photoPasteZoneTitle。
  - photoPasteZoneHint。
  - photoPasteZoneDescription。
  - photoPasteZoneShortcut。
  - photoPasteButton。
  - photoUploadCtaTitle。
  - photoUploadCtaDescription。
  - photoUploadButton。
  - photoUploadCleared。
  - photoPasteInputHint。
  - photoPasteUnsupported。
  - photoPasteAccessFailed。
  - photoPasteReadFailed。
  - photoPasteRecoveryHint。
  - photoPasteFocusInput。
  - photoInspectOnCube。
  - photoInsightSpread。
  - photoInsightSpreadWide。
  - photoInsightSpreadMedium。
  - photoInsightSpreadNarrow。
  - cubeSpaceOverlay。
- selection_coverage_ratioの3文言は分析表のフィルターで除外される。
- 未表示の辞書項目は削除や画面追加の対象として確定しない。

## 既存との違いを明示した項目

- 写真の参照入口と閉じる操作: スマホの写真を補助領域とする設計案。容器は未決。
- 選択色の最小情報: 詳細なインスペクタから色見本とラベルを主領域へ分ける設計案。
- 分析表・写真分析の詳細開示: 主作業より下位にする設計案。現行画面は展開された領域も含む。
- 3Dの描画補足: 現行は図に重なる文言を表示設定の詳細へまとめる設計案。
- スライスの選択色の位置の目印: 既存のカーソル描画と区別した提案。
- 散布図とAPI用ファイル入力の読み上げ名: 現行の不足を補う提案。
- RGBの初期表示: 既存の確定機能を継承する指示に沿って採用。Labを既定にしないという本人の決定と一致。
- 言葉の変更: 表示だけの標準案で、計算やAPI・コピーの出力内容の変更ではない。

## 参照したソース

### AGENTS.md

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/AGENTS.md)。
- 用途: 参照先と作業ルールの確認。
- ソース識別: 5993d751dc8761b206c69a550b8372e8df9072df。

### docs/development/codex-rules.md

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/docs/development/codex-rules.md)。
- 用途: 参照先と作業ルールの確認。
- ソース識別: ef08008f88134df28e37b814de566f8f7b2a8150。

### docs/product/vision.md

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/docs/product/vision.md)。
- 用途: プロダクトの目的・非目標。
- ソース識別: e5d4bf58fdeff4c47cc37c34f20123d970cdb818。

### web/src/app/analyze/page.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/app/analyze/page.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: d4be2e37d8a77c5ce09e6d723e252223e162b361。

### web/src/app/api/analyze/route.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/app/api/analyze/route.ts)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: b7ad667b9db9fb8917ba6493e85d00a5efa2fe5d。

### web/src/app/docs/agent-api/page.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/app/docs/agent-api/page.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 5539b4300dd0408ffccddab9a64caaa56cac510c。

### web/src/app/layout.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/app/layout.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 552a470ddbdeba84519bc3383fca515b1dfc8f38。

### web/src/app/page.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/app/page.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 361c71008b30809cffe5f8a93b6b140cbf75246a。

### web/src/components/graph/graph-frame.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/graph/graph-frame.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 573847e386b88127c2a1b514c7e27d20ad09e224。

### web/src/components/theme-provider.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/theme-provider.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 0b818eab0f48761660376e1641da4ee69d83fd9f。

### web/src/components/theme-toggle.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/theme-toggle.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: acada346fe572378b5f5237d8178add389c5ba77。

### web/src/components/ui/accordion.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/ui/accordion.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 9262851f85183ba153d44a3bc50aa62bd8a674e9。

### web/src/components/ui/button.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/ui/button.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: b760378ae4cfc8b2481af2ec18c11568ede9ae72。

### web/src/components/ui/checkbox.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/ui/checkbox.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: e32df129aa519a1be56822fd5e57ab52054c9e5a。

### web/src/components/ui/sonner.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/ui/sonner.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 9390a5f71f638153f278f21ee8c866877608cb5a。

### web/src/components/ui/tabs.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/ui/tabs.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: bcef7feaf3eb0faf6cddf104385823ba661abe29。

### web/src/components/workbench/color-swatch.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/workbench/color-swatch.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 1237586cde7a2ddcf6ebe81e3fe8d9e1c51e4894。

### web/src/components/workbench/info-tooltip.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/workbench/info-tooltip.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: a3b91c5e615a335cefed7b73f51a816f2af0cfef。

### web/src/components/workbench/panel-header.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/workbench/panel-header.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 5a30568dcf238eff2b8db215084ab79e85969a71。

### web/src/components/workbench/persisted-disclosure.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/components/workbench/persisted-disclosure.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 3741df54c2983df51cea66e3332ed0af8da965c0。

### web/src/domain/photo-analysis/agent-api-contract.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/domain/photo-analysis/agent-api-contract.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: a6ab4e45e8d1bec50fdcce442d8df23ed3ed87a9。

### web/src/domain/photo-analysis/agent-api-presentation.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/domain/photo-analysis/agent-api-presentation.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: 10e9413f2b8ba283a1380b1b6f45faea22d1384e。

### web/src/domain/photo-analysis/base/photo-analysis-base.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/domain/photo-analysis/base/photo-analysis-base.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: 25d97c9ae1b3f7f01fe494f77f38502836885d2f。

### web/src/domain/photo-analysis/derived/photo-analysis-derived-base-cache.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/domain/photo-analysis/derived/photo-analysis-derived-base-cache.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: 7b10ae6e81f126f7296b7664e7e20f9bc82f45c2。

### web/src/domain/photo-analysis/derived/photo-analysis-derived.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/domain/photo-analysis/derived/photo-analysis-derived.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: 798cc1646f8a8cc49232f190b8cf10c06ca38289。

### web/src/domain/photo-analysis/shared/photo-analysis-constants.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/domain/photo-analysis/shared/photo-analysis-constants.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: 4bb052ded866e56df2530b86593c5e75fbdf22e8。

### web/src/features/agent-api/agent-analyze-explanations.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/agent-api/agent-analyze-explanations.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: bb50d170e7edab99b2b4a6d37a66a35a01cad9c5。

### web/src/features/agent-api/agent-analyze-input-card.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/agent-api/agent-analyze-input-card.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 91acfa814094ff557816c7bcf8c50967579995a0。

### web/src/features/agent-api/agent-analyze-page.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/agent-api/agent-analyze-page.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: ce3983935dacb6373b0019622d12db6296e6a564。

### web/src/features/agent-api/agent-analyze-result-card.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/agent-api/agent-analyze-result-card.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 012567eb5c1e6c2f44983f11a72207ec4f84c172。

### web/src/features/inspector/color-inspector.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/inspector/color-inspector.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 5dc1519ae23fb2dacbd1f3278d9e473ef8b910b5。

### web/src/features/rgb-cube/rgb-cube-canvas.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/rgb-cube/rgb-cube-canvas.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 7383bc19ec99aae7bbf26043d91c6677c3b0ee7e。

### web/src/features/rgb-cube/rgb-cube-core.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/rgb-cube/rgb-cube-core.ts)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 693b158b61df30339146082431183c46e4ff9b67。

### web/src/features/rgb-cube/rgb-cube-guides.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/rgb-cube/rgb-cube-guides.ts)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 682398a37c8df18c509aee20eddcaad77604933f。

### web/src/features/rgb-cube/rgb-cube-projection.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/rgb-cube/rgb-cube-projection.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: f7efba2d44c80ab909eff8c1f813a946aeff790f。

### web/src/features/rgb-cube/rgb-cube-slice-plane.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/rgb-cube/rgb-cube-slice-plane.ts)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 509929999180a2a85150cd969fd28a2acc8dc655。

### web/src/features/slice/slice-canvas.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/slice/slice-canvas.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: d35b9f07bae35fe8152b5742c0404d776356641c。

### web/src/features/workbench/color-workbench.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/workbench/color-workbench.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 573033cca9b493edbc3d2b702bcdaf3c82825c39。

### web/src/features/workbench/workbench-analysis-panel.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/workbench/workbench-analysis-panel.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 9e7e974a74c79b4c90c70a02c2d7b8b8290ac8ca。

### web/src/features/workbench/workbench-histogram-chart.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/workbench/workbench-histogram-chart.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: b2f64e5260039cf850fa29a0eecd853a1f12685b。

### web/src/features/workbench/workbench-metrics-panel.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/workbench/workbench-metrics-panel.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 77bd0b776b1880108e5f08927eb0506c2b135e53。

### web/src/features/workbench/workbench-preview-panel.tsx

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/workbench/workbench-preview-panel.tsx)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 1c7d0d2ab2f911b36743ea808606339b1a988ef4。

### web/src/features/workbench/workbench-shared.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/features/workbench/workbench-shared.ts)。
- 用途: 値・描画・動的表示の根拠の確認。
- ソース識別: 3a4b09c520af26a282af132a9e775b3608d312e7。

### web/src/i18n/messages.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/i18n/messages.ts)。
- 用途: 全辞書のキー・ja/en文字列。
- ソース識別: ea29e5accfba4b7b2d4b5d3b2d4bcadb55d1cf88。

### web/src/lib/agent-analyze.ts

- 参照: [固定コミットのソース](https://github.com/Shunkicreate/IroMap/blob/3256f13ffd13b86c84889a6e12bbdcd36ffc6713/web/src/lib/agent-analyze.ts)。
- 用途: 画面・共通部品・可視出力の棚卸し。
- ソース識別: 26c2911a56b21d3eedcedd54ffde5fbf640560d4。

## 文書の検証

- 見出しとリストのみ: 新規の情報整理・用語集・表示文言・照合記録を検査する。
- 見出し階層: H1からH5までの範囲、階層の飛びと重複IDを検査する。
- 情報単位: 全要素に目的・背景・重要度・開示区分を持つことを検査する。
- キーの分類: 既存辞書199キーが表示160・コピー専用6・保管33に一意に分類されることを検査する。
- 参照コードにあるキー: 表示要素に対応するもの、コピー専用、非表示の選択範囲占有率に分類する。
- 変数: 標準ja/enと設計上の変数定義が一致することを検査する。
- 関連リンク: ローカルの文書リンクの参照先の存在を検査する。
- Markdown: プロジェクトの設定で記法を検査する。
- 検証結果: 見出し・リストのみの構成、階層、126要素の必須項目、280文言定義の双方向の対応、42用語の定義と対象、25操作定義、全要素の操作分類、ja/enの変数、文書リンク、specの命名を検査する。
- 永続する検査: `web/scripts/check-information-architecture.mjs`。文書の検査と実装の照合を分ける。
- 文書の検査: `pnpm run check:information`。要素と文言IDを双方向で確認し、用語・操作・操作一覧が同じ要素IDを指すか検査する。実装と実装対応ファイルを読まない。
- 実装の照合: `pnpm run check:information:implementation`。implementation-map.mdを通じて、対応先ファイルとキー・ja/en辞書が標準文言に従うか検査する。実装を正本へ合わせるための未反映を報告する。
- 検査の限界: 構文木から文字列を読み、コメントを参照実績に数えない。動的に組み立てたキー、実際の描画、イベント、表示条件、直書き文言の実装反映は自動保証しない。追加文言IDは設計上の識別子であり、既存コードに同名キーがあるとは扱わない。
- 設計先行の扱い: 実装の照合には差分が残る。標準文言の更新と選択色の最小情報は未実装。終了コード2を許容し、CIでは差分を参考情報として残す。文書の検査失敗は許容しない。
- 実装照合の結果: 170件の未反映。ja/enの標準文言との違い169件、未実装の未選択案内の実装キー参照1件。参照ファイルの欠落はない。追加の直書き文言と新しい操作の挙動は静的照合の自動保証に含めない。
- 検査処理の確認: `pnpm run test:information`。片方向の対応、重複ID、未知の要素、変数不一致、リンク切れ、操作の欠落、コメントだけのキー、設計先行の文言差分、実装なしでの設計検査、実装キーの改名を検証する。
- 記法の検証結果: 新規4文書と関連する既存設計文書はプロジェクト設定のMarkdown検査を通過。
- 実機検証: 未実施。スクロール、視線の距離、タッチ、キーボード操作、読み上げの実用性は後続で確認する。
- 利用者による文言理解の確認: 未実施。特にスライス・固定軸・サンプリング密度は画面例で確認する。
