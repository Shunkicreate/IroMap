# ADR README

`docs/adr/` は Architecture Decision Record（技術判断記録）を保管するフォルダです。

## 意図

- 重要な技術判断を「なぜその判断をしたか」まで残す
- 後続の設計や実装が、判断の前提を参照できるようにする

## ファイル命名

- `0001-<kebab-case-title>.md`
- 1 ADR = 1 意思決定

## 標準フォーマット

```md
# ADR-xxxx: <決定タイトル>

## Status
Accepted | Proposed | Deprecated

## Context
...

## Decision
...

## Consequences
### Positive
- ...

### Negative
- ...

## Alternatives Considered
- ...
```

## 書き方の意味

- `Context`: 判断が必要になった背景と制約
- `Decision`: 採用した案を一文で明確化
- `Consequences`: 採用時の利点と欠点
- `Alternatives Considered`: 検討したが採用しなかった案
