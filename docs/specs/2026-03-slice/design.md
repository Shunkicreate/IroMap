# Design: Slice表示

## 1. 目的

- spec.md の FR-1〜FR-3 を満たすための設計方針を定義する

## 2. 全体方針

- RGBの任意軸を固定した2D断面を表示する
- 固定値操作により断面の表示を更新する
- 断面の位置は3D表示と同期させる

## 3. 選択色の断面位置への移動（FR-6）

- Workbench の `selectedColor` を `SliceCanvas` に渡す
- 固定値スライダーの隣に共通 `Button` を配置し、未選択時は無効にする
- クリック時に RGB 成分、または既存の `rgbToHsl` / `rgbToLab` で変換した成分を取得する
- 現在の固定軸に対応する値を整数に丸め、既存の軸範囲で clamp する
- 既存の `onValueChange` で Workbench の固定値を更新し、2D/3D の同期と永続化を維持する
- 選択色・固定軸・色空間は変更しない。自動追従は行わず、ボタン操作時だけ移動する
- 整数スライダーに合わせるため、HSL/Lab の小数部分には最大 0.5 の丸め誤差を許容する

## 6. API設計

- 該当なし（クライアント内表示機能）

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
