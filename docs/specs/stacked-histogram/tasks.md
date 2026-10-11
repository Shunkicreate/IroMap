# Tasks: Stacked Histogram for Photo Analysis

## ルール

- 各タスクは `spec.md` の要求ID（FR/NFR）に紐づける
- 実装タスクはドメイン層とUI層を分離して完了条件を持つ
- テストタスクは受け入れ条件の検証観点を明示する

## 実装

- [ ] T-001 ヒストグラム用ドメインモデルを拡張する（FR-1, FR-2, FR-5）
  - 完了条件: `StackedHistogramBin` / `StackSegment` 等の型が定義される
- [ ] T-002 Saturation x Hue の縦積み集計を実装する（FR-1）
  - 完了条件: `saturationByHue` を bin単位で生成できる
- [ ] T-003 Saturation x Lightness の縦積み集計を実装する（FR-1）
  - 完了条件: `saturationByLightness` を bin単位で生成できる
- [ ] T-004 Hue x Saturation の縦積み集計を実装する（FR-2）
  - 完了条件: `hueBySaturation` を bin単位で生成できる
- [ ] T-005 Hue x Lightness の縦積み集計を実装する（FR-2）
  - 完了条件: `hueByLightness` を bin単位で生成できる
- [ ] T-006 集計整合チェックを実装する（FR-1, FR-2）
  - 完了条件: 各binで `segments合計 = totalCount` を満たし、simple総数とも一致する
- [ ] T-007 Hue histogram の表示モード/スタック軸切替UIを実装する（FR-3）
  - 完了条件: `Simple/Stacked` と `Saturation/Lightness` を独立して切替できる
- [ ] T-008 Saturation histogram の表示モード/スタック軸切替UIを実装する（FR-3）
  - 完了条件: `Simple/Stacked` と `Hue/Lightness` を独立して切替できる
- [ ] T-009 スタック描画コンポーネントを実装する（FR-1, FR-2, FR-4）
  - 完了条件: カテゴリ色で積層表示し、凡例と一致する
- [ ] T-010 ツールチップ表示を拡張する（FR-4）
  - 完了条件: `bin範囲 / カテゴリ / count / 構成比` を表示できる
- [ ] T-011 ビン境界と端値取り扱いを仕様化し実装へ反映する（FR-5）
  - 完了条件: hue=360, saturation=1.0 等の端値が一意に集計される

## テスト

- [ ] T-101 Saturation stacked（Hue軸）で総数整合を確認する（FR-1）
  - 完了条件: 単純表示と stacked 表示で各bin総数が一致する
- [ ] T-102 Saturation stacked（Lightness軸）で総数整合を確認する（FR-1）
  - 完了条件: 各binで `segments合計 = totalCount` を満たす
- [ ] T-103 Hue stacked（Saturation軸）で総数整合を確認する（FR-2）
  - 完了条件: 単純表示と stacked 表示で各bin総数が一致する
- [ ] T-104 Hue stacked（Lightness軸）で総数整合を確認する（FR-2）
  - 完了条件: 各binで `segments合計 = totalCount` を満たす
- [ ] T-105 ヒストグラム別の独立切替を確認する（FR-3）
  - 完了条件: 片方の設定変更がもう片方へ影響しない
- [ ] T-106 ツールチップと凡例の整合を確認する（FR-4）
  - 完了条件: ホバー情報と凡例色が一致する
- [ ] T-107 端値の集計ルールを確認する（FR-5）
  - 完了条件: 境界値入力で期待どおりのbinへ入る

## 監視 / 運用

- [ ] T-201 モード切替時の再描画時間を計測し記録する（NFR-1）
  - 完了条件: 代表画像で 200ms 目安に収まるかを記録する
- [ ] T-202 同一入力で再分析結果が一致することを確認する（NFR-2）
  - 完了条件: 再実行時に集計値差分がない
- [ ] T-203 カテゴリ数増加時の可読性チェックを実施する（NFR-3）
  - 完了条件: 凡例・配色コントラスト要件を満たす
