# Constraints

## 技術制約
- 仕様書は Markdown で管理する
- 機能単位のドキュメントは `docs/specs/` 配下に配置する
- 技術判断は `docs/adr/` で管理する
- 技術MVPは RGB 可視化を優先し、描画基盤の安定化を先行する
- 機能MVPは Lab / Hue / Saturation / 面積比の分析価値を優先する

## 運用制約
- 実装前に `spec.md` と `design.md` を更新する
- 受け入れ観点は `test-cases.md` へ明示する
- 技術MVPと機能MVPを同一スプリントで混在させる場合、完了条件を分離して追跡する
