# IroMap

IroMap は、色空間を理解するための学習・検証向けプロジェクトです。  
README は概要のみを扱い、機能要件や設計詳細は `docs/` に分離して管理します。

## 目的

- 色空間の可視化と変換ロジックを、仕様駆動で継続的に整理する
- 仕様 (`spec`) と設計 (`design`) と実装タスク (`tasks`) を明確に分ける
- ADR により技術判断の根拠を追跡可能にする

## ドキュメント構成

```text
docs/
  product/         # プロダクト方針
  architecture/    # アーキテクチャ全体
  adr/             # 技術意思決定記録
  specs/           # 機能ごとの SDD 一式
  development/     # 開発ガイドラインや環境構築手順
```

詳細は以下を参照してください。

- `docs/product/vision.md`
- `docs/architecture/overview.md`
- `docs/adr/`
- `docs/specs/`

## SDD 運用ルール（要約）

- 機能追加時は `docs/specs/YYYY-MM-feature-name/` を作成する
- `spec.md` で要求を定義し、`design.md` で設計に落とす
- `tasks.md` と `test-cases.md` を更新して実装と受け入れを同期する
- 検討中事項は `notes.md` に残し、確定後に関連ドキュメントへ反映する

## ライセンス

MIT
