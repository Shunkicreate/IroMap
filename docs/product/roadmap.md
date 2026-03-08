# Product Roadmap

## 方針

- IroMap は Photo Color Analyzer として設計する
- RGB Cube は技術MVP（描画基盤）として扱い、分析コアは別トラックで進める

## フェーズ

### Phase 1: 技術MVP（完了条件: 描画基盤の安定化）

- RGB visualization
- カメラ操作
- 点群描画パフォーマンス確認
- GPU処理検証

### Phase 2: 分析MVP（完了条件: 写真分析の最小価値提供）

- Lab a-b scatter
- Hue histogram
- Saturation histogram
- Color area ratio

### Phase 3: 診断拡張

- Colorfulness（Hasler-Suesstrunk）
- Dominant color cluster（k-means）
- Hue entropy
- DeltaE分布

### Phase 4: 高度分析

- Local contrast（RMS contrast）
- Spatial frequency（Laplacian / FFT）
- Saliency
- DeltaE heatmap / saturation map / saliency map

## 優先順位

1. RGB visualization
2. Lab a-b scatter
3. Hue histogram / Saturation histogram
4. Color area ratio
5. Colorfulness / Cluster analysis

## 診断出力の方向性

- High-key / Low-key の判定
- 主要色と被写体色の面積比
- 色多様性（Hue entropy）と改善提案
