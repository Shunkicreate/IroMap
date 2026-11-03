# IroMap

IroMap は、写真の色構造を可視化・診断する **Photo Color Analyzer** です。  
README は概要のみを扱い、機能要件や設計詳細は `docs/` に分離して管理します。

## プロダクト定義

> Understand the color structure of your photos

- 主目的: 写真の色構造（分布・面積比・多様性）を分析する
- 技術MVP: Three.js による RGB 可視化基盤を安定化する
- 機能MVP: Lab散布図 / Hue・Saturationヒストグラム / 色面積比を提供する

## ドキュメント構成

```text
docs/
  product/         # プロダクト方針・ロードマップ
  architecture/    # アーキテクチャ全体
  adr/             # 技術意思決定記録
  specs/           # 機能ごとの SDD 一式
  development/     # 開発ガイドラインや環境構築手順
```

詳細は以下を参照してください。

- `docs/product/vision.md`
- [デザインの上位方針](docs/product/design-foundation.md)
- [ライト／ダークの色ルール](docs/specs/theme-color-system/design.md) / [文字の基礎ルール](docs/specs/theme-color-system/typography.md) / [配色・文字見本](docs/specs/theme-color-system/preview.html)
- [情報の重要度と開示階層](docs/specs/workbench-information-architecture/information-architecture.md)
- [共通用語集](docs/specs/workbench-information-architecture/glossary.md) / [標準表示文言](docs/specs/workbench-information-architecture/ui-copy.md)
- [情報単位ごとの操作と状態](docs/specs/workbench-information-architecture/state-transitions.md)
- `docs/architecture/overview.md`
- `docs/adr/`
- `docs/specs/`

## SDD 運用ルール（要約）

- 機能追加時は `docs/specs/<feature-name>/` を作成する
- `spec.md` で要求を定義し、`design.md` で設計に落とす
- `tasks.md` と `test-cases.md` を更新して実装と受け入れを同期する
- 検討中事項は `notes.md` に残し、確定後に関連ドキュメントへ反映する
- 日付別のspec管理は行わず、機能名で同じ仕様を更新する
- 設計を先に変更する期間の実装差分は許容し、文書の整合検査と実装照合を分ける
- 用語と表示文言の正本に実装が従う。情報要素ごとの操作・状態も設計の正本に定義する

## 現在の優先順位

1. RGB visualization（技術MVP）
2. Lab a-b scatter（分析コア）
3. Hue / Saturation histogram
4. Color area ratio
5. Colorfulness / cluster analysis

## ライセンス

MIT
