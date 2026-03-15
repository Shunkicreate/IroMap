# Notes: Photo Analysis Workbench

- この spec は `2026-03-photo-analysis-mvp` の後続段階として扱う
- MVP の主眼は `相互参照 / 局所選択 / 2 件比較 / 指標表コピー / L* histogram` に置く
- `Lab a-b scatter` は主表示から外すが、完全削除ではなく補助分析として残す余地を残す
- `Neutral Distance` は MVP では `C*` と同義で扱い、UI 上の名称だけ後続で調整可能にする
- 履歴、選択保存、注釈メモは P1 以降の状態設計だけ先に確保する

## 確定した設計論点

- 用語と比較単位
  - `target / baseline target / compare target / snapshot / selection / hover` を定義済み
  - 比較単位は `full-image / matched-selection` に固定済み
- 状態モデル
  - source of truth と派生 state の境界を定義済み
  - `hover` と `selection` を分離済み
  - 同一 target 内で `selection A / selection B` の 2 slot を持つ前提を定義済み
- 選択と相互ハイライト
  - event source、hover rule、selection rule、正規化ルールを定義済み
- 指標と histogram
  - 指標の計算対象、丸め、`N/A`、`L* histogram` の固定 bin を定義済み
- 比較と差分
  - 差分方向を `compare - baseline` に固定済み
  - `compare_to_baseline_mean_lab_delta_e76` を平均 Lab 同士の単一比較値として定義済み
  - `Selection A-B ΔE` を同一 target 内の 2 selection 比較指標として定義済み
- UI レイアウト
  - `上段 = 主表示行`、`下段 = 補助情報行` を定義済み
  - デスクトップでは `下段のみ独立スクロール` を採用する
- 性能とテスト
  - 再計算トリガー、hover 非再計算、domain/component/e2e の責務分割を定義済み

## まだ残っている未決事項

- `snapshot` を UI 上でどのタイミングで露出するか
- ブラシ選択や色域選択を追加するときの selection union モデル
- 比較対象の保持単位を最終的に `画像` と `解析スナップショット` のどちらへ寄せるか

## 後続で検討するとよい項目

- `Neutral Distance` と `C*` の UI 名称を分けるか統合するか
- `L* histogram` 以外の histogram をどの順番で P1 へ戻すか
- `Lab a-b scatter` を補助分析としてどこへ置くか
