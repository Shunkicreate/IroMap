# Architecture README

`docs/architecture/` はシステム全体の構造を整理するフォルダです。

## 意図

- 実装詳細に入る前に、構造と責務分割を共有する
- どこに何を置くか、品質をどう担保するかを明確化する

## ファイルの意味

- `overview.md`: 全体概要と各文書への導線
- `context.md`: システム境界と外部要素
- `containers.md`: 実行単位（API、DB、Workerなど）
- `components.md`: コンテナ内の主要コンポーネント
- `data-model.md`: ドメイン/データ構造
- `quality-attributes.md`: 品質特性と設計方針
- `diagrams/`: Mermaid や画像などの補助図

## 推奨フォーマット

```md
# <Document Title>

## 目的
...

## 対象範囲
...

## 構成 / 要素
- ...

## 主要な設計判断
- ...

## 関連資料
- ...
```

## 書き方の意味

- 「要素の列挙」だけでなく「責務の境界」を明記する
- `specs/*/design.md` で参照される前提をここに置く
