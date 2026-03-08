# ADR-0004: 確認メール送信を非同期化する

## Status
Accepted

## Context
ユーザー登録時に確認メール送信が必要だが、同期送信は API 応答時間と可用性に影響する。

## Decision
確認メール送信はジョブキュー経由の非同期処理とする。

## Consequences
### Positive
- API の応答時間を短く保てる
- メール基盤障害の影響を局所化できる

### Negative
- queue/worker の運用が必要
- リトライと重複送信制御が必要

## Alternatives Considered
- 同期送信
- API 成功後の best-effort 送信
