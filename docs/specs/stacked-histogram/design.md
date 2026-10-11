# Design: Stacked Histogram for Photo Analysis

## 1. 目的

- `spec.md` の FR-1 から FR-5 を満たすため、既存の単純ヒストグラム集計を拡張し、スタック表示用データを提供する

## 2. 全体方針

- 既存 `PhotoAnalysisResult` を後方互換に保ちつつ、スタック用データを追加する
- 集計処理は `domain/photo-analysis` に閉じ、UI層は表示モード切替と描画責務に集中させる
- ヒストグラムの総数整合（simple合計 = stacked合計）をドメイン側で保証する
- 2つのヒストグラム（Hue / Saturation）の表示モードとスタック軸を独立状態として管理する

## 3. アーキテクチャ上の位置づけ

- `Image Sampling`: 既存のピクセルサンプリング処理を再利用
- `Color Transform`: RGB -> HSV/HSL/Lab 変換（Lightness採用方式は未決）
- `Metric Engine`:
  - 既存: `hueHistogram`, `saturationHistogram`
  - 追加: `hueHistogramStacked`, `saturationHistogramStacked`
- `Visualization`:
  - 表示モード `Simple / Stacked`
  - スタック軸切替 `Hue/Saturation/Lightness`
  - 凡例/ツールチップの一貫表示

## 4. ドメインモデル

- `HistogramBin`: `{ start, end, count }`（既存）
- `StackAxisKey`: `'hue' | 'saturation' | 'lightness'`
- `StackSegment`: `{ categoryKey, categoryLabel, count }`
- `StackedHistogramBin`: `{ start, end, totalCount, segments: StackSegment[] }`
- `StackedHistogramSet`:
  - `saturationByHue: StackedHistogramBin[]`
  - `saturationByLightness: StackedHistogramBin[]`
  - `hueBySaturation: StackedHistogramBin[]`
  - `hueByLightness: StackedHistogramBin[]`
- `PhotoAnalysisResult`（拡張）:
  - 既存項目 + `stackedHistograms: StackedHistogramSet`

## 5. シーケンス

1. 画像を読み込み、既存ロジックでサンプルピクセル列を取得する
2. 各ピクセルについて Hue/Saturation/Lightness のビン index を算出する
3. 単純ヒストグラム（Hue/Saturation）を既存どおり集計する
4. クロス集計で stacked 用 bin を生成する
5. binごとの `segments` 合計と `totalCount` の整合チェックを行う
6. UIへ結果を渡し、表示モード・スタック軸に応じて描画する

## 6. API設計

- ドメイン関数（追加案）
  - `buildStackedHistograms(samples): StackedHistogramSet`
  - `buildStackedHistogram(primaryAxis, stackAxis, samples): StackedHistogramBin[]`
- UI補助関数（追加案）
  - `resolveHueHistogramData(mode, stackAxis, result)`
  - `resolveSaturationHistogramData(mode, stackAxis, result)`
- 状態管理（`photo-analysis-panel.tsx`）
  - `hueHistogramMode: 'simple' | 'stacked'`
  - `hueStackAxis: 'saturation' | 'lightness'`
  - `saturationHistogramMode: 'simple' | 'stacked'`
  - `saturationStackAxis: 'hue' | 'lightness'`

## 7. 例外系

- 画像デコード失敗時は既存エラー表示を維持
- サンプル0件時は全bin 0件として扱い、描画崩れを防止
- 無彩色ピクセルのHue扱いは仕様で固定化する（0固定 or 専用カテゴリ）

## 8. セキュリティ考慮

- 既存方針どおり、解析はローカル処理のみ
- 追加データ構造はメモリ内保持のみで外部送信しない

## 9. 可観測性

- 既存 `elapsedMs` を利用し、stacked集計追加後の処理時間増加を比較可能にする
- 開発時に `simple total` と `stacked total` の一致を検証できるログ/アサーションを用意する

## 10. トレードオフ

- 事前に全組み合わせの stacked データを算出すると切替は高速だがメモリを増やす
- 切替時オンデマンド算出はメモリ効率が良いがUI応答が遅くなる
- 本機能では「切替体験優先」で事前算出を採用する

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
