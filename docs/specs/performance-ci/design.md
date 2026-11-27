# Performance CI Design

## 実行環境

ブラウザーを使用する性能検証とE2Eのrunnerは `ubuntu-24.04` に固定する。
固定中のPlaywright 1.51.1はUbuntu 26.04に対応しておらず、
`ubuntu-latest` の更新で `install --with-deps chromium` が失敗したため。
実際のGitHub Actionsでブラウザーの導入からテスト完了までを確認する。

## 要求への対応

- FR-1: 既存 ESLint に react-perf のオブジェクト・配列・関数ルールを限定適用する
- FR-2: 独立した Playwright 設定で production server のライフサイクルを管理し、既存ベンチマークを子プロセスとして実行する
- FR-2: 閾値は `web/scripts/workbench-perf-budgets.json`、判定は `workbench-perf-budget.mjs` に分離する
- FR-3: 平均・中央値・最小・最大・件数を保持し、計測値を捨てて欠落を隠さない
- FR-3: 選択操作の source が一致するトレースだけを評価する
- FR-3: 判定結果と設定を JSON 保存後に失敗させ、Actions の artifact に保存する
- FR-3: `workbench-performance` は `retention-days: 1` で保存し、`if: always()` と `if-no-files-found: ignore` を維持する

閾値・ローカル実行方法は `docs/development/performance-benchmark.md` を参照する。
