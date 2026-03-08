# Design: Color Space 3D Visualization

## 1. 目的

- `spec.md` の FR-1〜FR-4 を満たす実装方式を定義する。

## 2. 全体方針

- 既存 `RgbCubeCanvas` を色空間切替対応の3D描画コンポーネントとして拡張する。
- 点群サンプルは RGB グリッド（16^3）を共通利用し、表示座標のみ空間別に変換する。
- 選択結果は既存どおり `RgbColor` で扱い、Inspector/Copy の API を変えない。

## 3. アーキテクチャ上の位置づけ

- `ColorWorkbench` に色空間 state（`rgb | hsl | lab`）を追加する。
- 3D表示パネル内に tabs を配置して空間切替を行う。

## 4. ドメインモデル

- `ColorSpace3d = "rgb" | "hsl" | "lab"` を追加する。
- 3D描画では `RgbColor -> SpacePoint(x,y,z)` 変換を空間別に実施する。
  - RGB: `r/g/b` を `[-1, 1]` に正規化。
  - HSL: `x=s*cos(h), y=l, z=s*sin(h)` の円柱系。
  - Lab: `x=a, y=l, z=b` を正規化。

## 5. シーケンス

1. ユーザーがタブで色空間を選択する。
2. `ColorWorkbench` の `space` state が更新される。
3. 3D描画コンポーネントが空間別座標へ再投影して再描画する。
4. ホバー/クリックは最近傍の RGB サンプルを返し、Inspector/Copy へ連携される。

## 6. API設計

- サーバーAPI変更なし。
- クライアント props 変更:
  - `RgbCubeCanvas` に `space: ColorSpace3d` を追加。

## 7. 例外系

- ポインタ位置に近傍点がない場合、hover は `null` を返す。
- 色空間切替後でも選択色は保持し、ユーザーフローを中断しない。

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
