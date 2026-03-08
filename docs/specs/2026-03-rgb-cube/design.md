# Design: RGBキューブ表示

## 1. 目的
- spec.md の FR-1〜FR-3 を満たすための設計方針を定義する

## 2. 全体方針
- RGB色空間を3Dキューブとして描画する
- 操作は回転のみに絞り、他操作は将来対応とする
- 解像度は256固定とする

## 6. API設計
- 該当なし（クライアント内表示機能）

## 11. 関連ADR
- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
