# Design: Color Space 3D Visualization

## 1. 目的

- `spec.md` の FR-1〜FR-10 を満たす実装方式を定義する。

## 2. 全体方針

- 既存 `RgbCubeCanvas` を色空間切替対応の3D描画コンポーネントとして拡張する。
- 点群サンプルは RGB グリッド（16^3）を共通利用し、表示座標のみ空間別に変換する。
- 選択結果は既存どおり `RgbColor` で扱い、Inspector/Copy の API を変えない。
- 操作補助（軸ガイド、サイズ調整、タブ強調）を追加し視認性と操作性を改善する。
- Slice は空間別軸を扱い、2D平面の軸情報と 3D の固定軸面表示を同期する。

## 3. アーキテクチャ上の位置づけ

- `ColorWorkbench` に色空間 state（`rgb | hsl | lab`）を追加する。
- 3D表示パネル内に tabs を配置して空間切替を行う。
- `ColorWorkbench` に表示補助 state を追加する。
  - `showAxisGuide`（3D軸ガイド表示）
  - `showCubeSizeSlider`（サイズスライダー表示）
  - `cubeSize`（キャンバス高さ）
- RGBキューブパネルと Slice パネルを同一グリッドに配置する。

## 4. ドメインモデル

- `ColorSpace3d = "rgb" | "hsl" | "lab"` を追加する。
- `SliceAxis` は RGB/HSL/Lab の軸集合を扱う。
- 3D描画では `RgbColor -> SpacePoint(x,y,z)` 変換を空間別に実施する。
  - RGB: `r/g/b` を `[-1, 1]` に正規化。
  - HSL: `x=s*cos(h), y=l, z=s*sin(h)` の円柱系。
  - Lab: `x=a, y=l, z=b` を正規化。
- 3D軸ガイドは空間ごとにラベルを切り替える。
  - RGB: `R / G / B`
  - HSL: `S*cos(H) / L / S*sin(H)`
  - Lab: `a / L / b`
- 固定軸面は空間ごとに描画形状を切り替える。
  - RGB: 固定チャネル平面
  - HSL: H固定=半径方向面, S固定=円筒側面, L固定=円盤
  - Lab: L*/a/b 固定平面

## 5. シーケンス

1. ユーザーがタブで色空間を選択する。
2. `ColorWorkbench` の `space` state が更新される。
3. 3D描画コンポーネントが空間別座標へ再投影して再描画する。
4. Slice の軸UIと固定値スライダーが空間に応じて切り替わる。
5. 3Dは固定軸面を重ね描きし、ホバー/クリックは最近傍の RGB サンプルを返す。
6. 必要に応じて軸ガイド表示、サイズスライダー表示を切り替える。

## 6. API設計

- サーバーAPI変更なし。
- クライアント props 変更:
  - `RgbCubeCanvas` に `space: ColorSpace3d` を追加。
  - `RgbCubeCanvas` に `axisGuideMode: "visible" | "hidden"` を追加。
  - `RgbCubeCanvas` に `cubeSize: number` を追加。
  - `drawSlicePlane` は `space` と `sliceAxis` を受け取り、空間別に面描画する。

## 7. 例外系

- ポインタ位置に近傍点がない場合、hover は `null` を返す。
- 色空間切替後でも選択色は保持し、ユーザーフローを中断しない。
- Slice の軸切替時に 2D 軸ラベルと3Dの固定軸面を同時更新する。

## 8. セキュリティ考慮

- 該当なし（クライアント描画機能）。

## 9. 可観測性

- 今回は新規メトリクスは追加しない。
- 受け入れは `test-cases.md` の手動確認で追跡する。

## 10. トレードオフ

- 共有サンプル方式により実装と比較一貫性を優先する。
- 空間ごとの最適サンプリングは将来改善とし、今回対象外とする。

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
