# ADR-0003: 認証方式に JWT を採用する

## Status
Accepted

## Context
ログイン機能を追加する際、ステートレスで API 連携しやすい認証方式が必要。

## Decision
認証トークンに JWT を採用する。

## Consequences
### Positive
- API スケール時にセッション共有コストを抑えられる
- クライアント連携を単純化しやすい

### Negative
- 失効戦略や鍵ローテーション運用が必要
- トークン漏えい時の影響が大きい

## Alternatives Considered
- サーバーセッション方式
- PASETO
