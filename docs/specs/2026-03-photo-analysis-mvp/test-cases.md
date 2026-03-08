# Test Cases: Photo Analysis MVP

## 対応要求

- FR-1
- FR-2
- FR-3
- FR-4

## 正常系

- TC-001: 一般的な風景写真でLab scatterが描画される（FR-1）
- TC-002: 暖色主体の画像でHue histogramに偏りが出る（FR-2）
- TC-003: 低彩度画像でSaturation histogramの低彩度側に分布する（FR-3）
- TC-004: 主要色比率が表示され、合計が100%になる（FR-4）

## 異常系

- TC-101: 画像読み込み失敗時にエラー表示される（FR-1,2,3,4）
- TC-102: ピクセル情報が取得できない場合に空状態が表示される（FR-1,2,3,4）
