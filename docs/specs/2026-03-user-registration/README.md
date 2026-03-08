# User Registration Spec Set README

`docs/specs/2026-03-user-registration/` は「ユーザー登録機能」の仕様セットです。

## 意図
- 登録フロー（仮登録、確認メール、認証完了）の要件を明確化する
- 要求からテストまでの一貫性を保つ

## ファイルの意味
- `spec.md`: 機能要求（`FR-*`）と非機能要求、制約
- `design.md`: API/ドメインモデル/シーケンス/例外設計
- `tasks.md`: 実装、テスト、監視の作業計画
- `test-cases.md`: 要求に紐づく受け入れテスト観点
- `notes.md`: 保留事項と議論メモ

## 書き方フォーマット
```md
# Design: ユーザー登録
## 5. シーケンス
1. ...
2. ...
```

```md
# Test Cases: ユーザー登録
## 対応要求
- FR-1
- FR-2
```

## 記述ルールの意味
- `spec.md`: 何を実現するか（What）
- `design.md`: どう実現するか（How）
- `test-cases.md`: どの要求をどう検証するか

