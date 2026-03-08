# Specs README

`docs/specs/` は機能単位の仕様セットを管理するフォルダです。

## 意図
- 1 機能 = 1 ディレクトリで要求から実装計画まで追跡可能にする
- `spec -> design -> tasks -> test-cases` の整合を維持する

## ディレクトリ命名
- `YYYY-MM-<feature-name>`
- 例: `2026-03-login`

## 各機能ディレクトリの標準構成
- `spec.md`: 要求定義（What）
- `design.md`: 実現方式（How）
- `tasks.md`: 実装計画（Work items）
- `test-cases.md`: 受け入れ観点
- `notes.md`: 未決事項・補足メモ

## 最小フォーマット
```md
# Feature Spec: <機能名>
## 1. 背景
## 2. スコープ
## 5. 機能要求
## 10. 未決事項
```

```md
# Design: <機能名>
## 1. 目的
## 2. 全体方針
## 6. API設計
## 11. 関連ADR
```

## 書き方の意味
- `spec.md` は「何を満たすか」を定義する
- `design.md` は「どう満たすか」を定義する
- `tasks.md` と `test-cases.md` は要求 ID に紐づける

