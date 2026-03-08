# Design: Photo Analysis MVP

## 1. 目的
- `spec.md` の FR-1 から FR-4 を満たす設計方針を定義する

## 2. 全体方針
- 画像入力を共通のピクセルサンプリング処理で正規化する
- 分析指標ごとに独立した計算モジュールを持たせる
- 表示層は「散布図」「ヒストグラム」「比率表示」の3系統に分離する

## 3. アーキテクチャ上の位置づけ
- `Image Sampling`: 入力画像からRGB配列を抽出
- `Color Transform`: RGB -> Lab / HSV 変換
- `Metric Engine`: ヒストグラム集計、面積比集計
- `Visualization`: Scatter / Histogram / Ratio UI

## 4. ドメインモデル
- `PixelSample`: { r, g, b, x, y }
- `LabPoint`: { l, a, b }
- `HueBin`: { start, end, count }
- `SaturationBin`: { start, end, count }
- `ColorArea`: { label, ratio, rgb }

## 5. シーケンス
1. 画像を読み込み、ピクセル配列を取得する
2. RGB から Lab / HSV を計算する
3. 指標ごとに集計する
4. UIコンポーネントへ結果を渡して描画する

## 6. API設計
- クライアント内で完結するため外部APIはなし
- 内部関数例
  - `analyzeLabScatter(samples): LabPoint[]`
  - `buildHueHistogram(samples, bins): HueBin[]`
  - `buildSaturationHistogram(samples, bins): SaturationBin[]`
  - `calculateColorAreaRatio(samples, clusters): ColorArea[]`

## 7. 例外系
- 画像デコード失敗時はエラーメッセージを表示し分析を中断
- サンプル数が0件の場合は空状態UIを表示

## 8. セキュリティ考慮
- ローカル処理を基本とし、画像データを外部送信しない

## 9. 可観測性
- 分析処理時間を計測し、開発時にコンソールで確認可能にする
- 入力画像サイズと処理時間の相関を比較できるようにする

## 10. トレードオフ
- 初期は計算コストを抑えるためサンプリング間引きを許容する
- 面積比は厳密性より説明可能性を優先し、クラスタ数を制限する

## 11. 関連ADR
- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
