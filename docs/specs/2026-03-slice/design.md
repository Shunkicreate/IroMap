# Design: Slice表示

## 1. 目的

- spec.md の FR-1〜FR-3 を満たすための設計方針を定義する

## 2. 全体方針

- RGBの任意軸を固定した2D断面を表示する
- 固定値操作により断面の表示を更新する
- 断面の位置は3D表示と同期させる

## 6. API設計

- 該当なし（クライアント内表示機能）

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
