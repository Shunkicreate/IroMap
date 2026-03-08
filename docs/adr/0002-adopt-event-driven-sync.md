# ADR-0002: 内部同期をイベント駆動にする

## Status
Accepted

## Context
UI 操作や設定変更の反映を疎結合にし、将来の機能追加に備える必要がある。

## Decision
内部同期方式としてイベント駆動モデルを採用する。

## Consequences
### Positive
- コンポーネント間依存を減らせる
- 機能追加時の変更影響を局所化しやすい

### Negative
- イベント設計と可観測性整備が必須
- デバッグ難易度が上がる

## Alternatives Considered
- 直接呼び出し中心の同期連携
- 共有状態へのポーリング
