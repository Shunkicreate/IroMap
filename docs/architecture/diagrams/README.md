# Diagrams README

`docs/architecture/diagrams/` はアーキテクチャ図の補助資料を置くフォルダです。

## 意図

- テキストだけで把握しにくい構造やフローを可視化する
- `architecture/*.md` の補足として一貫した図を管理する

## 対象

- Mermaid 定義（`.mmd`）
- 画像ファイル（`.png`, `.svg` など）
- 必要に応じて図の説明用 `.md`

## 推奨フォーマット（図の説明md）

```md
# <Diagram Title>

## 目的
...

## 参照元
- ../context.md
- ../containers.md

## 注意点
- ...
```

## 書き方の意味

- 図だけを置かず、どの文書を補足する図かを明記する
- 図更新時は関連する `architecture/*.md` も同時に更新する
