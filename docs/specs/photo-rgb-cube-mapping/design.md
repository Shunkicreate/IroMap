# Design: Photo RGB Cube Mapping

## 1. 目的

- `spec.md` の FR-1 から FR-5 を満たすため、photo analysis の画像サンプリング結果を RGB キューブ描画へ統合する設計方針を定義する

## 2. 全体方針

- 画像由来の色分布は、photo analysis 側で生成した集約済み点群として扱う
- RGB キューブ描画は既存の固定グリッド描画を維持しつつ、画像点群 overlay を追加する
- Workbench を状態集約点とし、画像解析結果と RGB キューブ表示設定を接続する
- 初期実装は Canvas ベースのまま進め、描画点数制御で性能を担保する

## 3. アーキテクチャ上の位置づけ

- `domain/photo-analysis`: 画像サンプル抽出、量子化、頻度集計、画像点群データ生成
- `features/photo-analysis`: 画像選択、ワーカー実行、分析結果の UI 反映、workbench への結果通知
- `features/workbench`: 入力画像と分析結果の共有状態、RGB キューブ表示モードの管理
- `features/rgb-cube`: 固定グリッド描画、画像点群 overlay 描画、ヒットテスト対象の統合

## 4. ドメインモデル

- `PixelSample`: 既存流用。画像から抽出した RGB サンプル
- `RgbCubePoint`: `{ color: RgbColor; count: number; ratio: number }`
- `RgbCubeOverlayMode`: `"grid" | "image" | "both"`
- `PhotoAnalysisResult`: 既存の分析結果に `cubePoints: RgbCubePoint[]` を追加する

`RgbCubePoint` は個々のピクセルではなく、量子化済み RGB バケットの代表点を表す。これにより、描画点数を制御しつつ頻度差を保持する。

## 5. シーケンス

1. ユーザーが Photo Analysis UI から画像を選択する
2. `PhotoAnalysisPanel` が画像を `ImageData` 化し、既存ワーカーへ渡す
3. `analyzePhoto` がサンプリング済みピクセル列から histogram / colorAreas / cubePoints を一括生成する
4. `PhotoAnalysisPanel` が `PhotoAnalysisResult` を保持し、`onAnalysisComplete` で workbench へ通知する
5. `ColorWorkbench` が `cubePoints` と `overlayMode` を `RgbCubeCanvas` に渡す
6. `RgbCubeCanvas` が現在の回転・色空間設定に応じて投影し、固定グリッドと画像点群を描画する

## 6. API設計

- `domain/photo-analysis/photo-analysis.ts`
  - `type RgbCubePoint = { color: RgbColor; count: number; ratio: number }`
  - `analyzePhoto(imageData): PhotoAnalysisResult`
  - 内部関数例:
    - `buildRgbCubePoints(samples, quantizeStep, maxPoints): RgbCubePoint[]`
    - `quantizeRgbColor(color, bucketSize): RgbColor`

- `features/photo-analysis/photo-analysis-panel.tsx`
  - `onAnalysisComplete?: (result: PhotoAnalysisResult | null) => void`
  - 画像クリア時は `null` を通知する

- `features/workbench/color-workbench.tsx`
  - `const [cubeOverlayMode, setCubeOverlayMode] = useState<RgbCubeOverlayMode>("both")`
  - `const [photoCubePoints, setPhotoCubePoints] = useState<RgbCubePoint[]>([])`

- `features/rgb-cube/rgb-cube-canvas.tsx`
  - props 追加:
    - `imageCubePoints?: RgbCubePoint[]`
    - `overlayMode: RgbCubeOverlayMode`
  - 描画関数追加:
    - `projectRgbCubePoint(...)`
    - `drawImageCubeOverlay(...)`

## 7. 例外系

- 画像デコード失敗時は既存の photo analysis エラー導線を使い、点群も更新しない
- 有効ピクセル 0 件時は `cubePoints` を空配列とし、画像 overlay を描画しない
- ワーカー失敗時はメインスレッド fallback を継続し、結果整合を保つ

## 8. セキュリティ考慮

- 画像処理はクライアント内で完結させる
- 画像ピクセルデータや分析結果をネットワーク送信しない

## 9. 可観測性

- 既存の `elapsedMs` により分析時間を継続計測する
- 開発時は `sampledPixels` に加え `cubePoints.length` を確認できるようにし、点数上限の妥当性を評価する

## 10. トレードオフ

- 初期実装では WebGL へ移行せず、Canvas + 量子化で性能を確保する
- 頻度表現はまず alpha 中心とし、必要になれば点サイズ変更を追加する
- 画像点群は RGB 空間と最も意味が一致するため、他空間タブでの表示は簡易対応または将来検討とする

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
