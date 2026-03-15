# Notes: Photo Analysis Workbench

- この spec は `2026-03-photo-analysis-mvp` の後続段階として扱う
- 今回の実装対象は `相互参照 / 局所選択 / 指標表コピー / L* histogram` に置く
- 複数画像比較は優先度を下げ、設計メモだけを残して今回の実装から外す
- `Lab a-b scatter` は優先度を下げ、今回の実装から削除する
- `selection slot` は仕様未確定のため、今回の実装から外す
- `Neutral Distance` は MVP では `C*` と同義で扱い、UI 上の名称だけ後続で調整可能にする
- 履歴、選択保存、注釈メモは P1 以降の状態設計だけ先に確保する

## 確定した設計論点

- 用語と比較単位
  - `target / snapshot / selection / hover` を定義済み
  - 比較は後続拡張として扱い、今回の実装からは外す
- 状態モデル
  - source of truth と派生 state の境界を定義済み
  - `hover` と `selection` を分離済み
  - 今回の実装は単一の `activeSelection` のみを扱う
- 選択と相互ハイライト
  - event source、hover rule、selection rule、正規化ルールを定義済み
- 指標と histogram
  - 指標の計算対象、丸め、`N/A`、`L* histogram` の固定 bin を定義済み
- UI レイアウト
  - `上段 = 主表示行`、`下段 = 補助情報行` を定義済み
  - デスクトップでは `下段のみ独立スクロール` を採用する
- 性能とテスト
  - 再計算トリガー、hover 非再計算、domain/component/e2e の責務分割を定義済み

## まだ残っている未決事項

- `snapshot` を UI 上でどのタイミングで露出するか
- ブラシ選択や色域選択を追加するときの selection union モデル
- 複数画像比較を再導入する場合、比較対象の保持単位を最終的に `画像` と `解析スナップショット` のどちらへ寄せるか

## 後続で検討するとよい項目

- `Neutral Distance` と `C*` の UI 名称を分けるか統合するか
- `L* histogram` 以外の histogram をどの順番で P1 へ戻すか
