# ADR-0001: PostgreSQL を採用する

## Status
Accepted

## Context
ユーザー情報、認証状態、設定データなどの整合性が必要な構造化データを扱う。

## Decision
主要データストアとして PostgreSQL を採用する。

## Consequences
### Positive
- トランザクション整合性を確保しやすい
- スキーマとクエリの保守性が高い

### Negative
- マイグレーション運用が必要
- スケーリング戦略の設計が必要

## Alternatives Considered
- SQLite
- ドキュメント DB
