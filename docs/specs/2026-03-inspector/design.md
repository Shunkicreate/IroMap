# Design: カラーインスペクタ

## 1. 目的

- spec.md の FR-1〜FR-4 を満たすための設計方針を定義する

## 2. 全体方針

- ホバーによるプレビュー表示とクリックによる選択色表示を分離する
- RGB/HEX/HSL を常に同時表示する
- プレビュー領域と選択領域を横並びで比較しやすく配置する

## 6. API設計

- 該当なし（クライアント内表示機能）

## 11. 関連ADR

- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
