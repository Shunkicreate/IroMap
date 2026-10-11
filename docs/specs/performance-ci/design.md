# Performance CI Design

- FR-1: 既存 ESLint に react-perf のオブジェクト・配列・関数ルールを限定適用する
- FR-2: 独立した Playwright 設定で production server のライフサイクルを管理し、既存ベンチマークを子プロセスとして実行する
- FR-2: 閾値は `web/scripts/workbench-perf-budgets.json`、判定は `workbench-perf-budget.mjs` に分離する
- FR-3: 平均・中央値・最小・最大・件数を保持し、計測値を捨てて欠落を隠さない
- FR-3: 選択操作の source が一致するトレースだけを評価する
- FR-3: 判定結果と設定を JSON 保存後に失敗させ、Actions の artifact に保存する

閾値・ローカル実行方法は `docs/development/performance-benchmark.md` を参照する。
