# Performance Benchmark

IroMap のローカル性能計測手順と、基準値を記録する。

## 1. ベンチマーク対象

- 対象画面: workbench (`/`)
- 対象操作:
  - 画像アップロード後の初回解析
  - 初回派生再計算
- 計測ソース:
  - `window.__IROMAP_PERF__`
  - `workbench.photo-analysis.total`
  - `workbench.derived-analysis.total`
- ベンチマークスクリプト: `web/scripts/workbench-perf-benchmark.mjs`

## 2. 実行方法

開発サーバーを起動する。

```bash
pnpm --dir web run dev
```

ベンチマークを実行する。

```bash
IROMAP_PERF_ITERATIONS=100 IROMAP_PERF_RELOAD_EVERY=10 pnpm --dir web run perf:workbench
```

特定サイズだけを再計測する場合:

```bash
IROMAP_PERF_ITERATIONS=100 IROMAP_PERF_SIZES=2048x1536,3840x2160 IROMAP_PERF_RELOAD_EVERY=10 pnpm --dir web run perf:workbench
```

## 3. ベンチマーク条件

- 実行日: 2026-03-25
- 実行場所: `/Users/shunki.tada/VSCode/IroMap/.worktree/feature/perf-async-analysis`
- 実行モード: `next dev`
- ブラウザ: Playwright Chromium
- 入力画像: スクリプトで毎回生成する合成 PNG
- 画像サイズ:
  - `512x512`
  - `1024x1024`
  - `2048x1536`
  - `3840x2160`
- 各サイズ 100 回実行
- 10 回ごとに page reload して file input の不安定化を避ける

## 4. 基準値

| Size | Pixels | Photo Avg | Photo Median | Decode Avg | Analyze Avg | Derived Avg | Derived Median | Metrics Avg | Sampled Pixels |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 512x512 | 262,144 | 168.4ms | 163.5ms | 52.8ms | 29.1ms | 40.2ms | 35.7ms | 36.6ms | 65,536 |
| 1024x1024 | 1,048,576 | 172.0ms | 161.6ms | 56.9ms | 28.8ms | 36.9ms | 32.2ms | 33.9ms | 65,536 |
| 2048x1536 | 3,145,728 | 247.5ms | 241.3ms | 88.9ms | 42.8ms | 58.4ms | 56.1ms | 54.0ms | 87,552 |
| 3840x2160 | 8,294,400 | 267.6ms | 259.0ms | 109.4ms | 47.6ms | 56.5ms | 52.5ms | 52.4ms | 82,944 |

## 5. 読み取り

- `1024x1024` までは sampling 上限の影響で `analyze` の増加は小さい
- `2048x1536` 以上では `decode` と `derived(metrics)` の寄与が目立つ
- 4K でも `analyze` 単体は約 `47.6ms` 平均だが、初回解析全体では `decode` を含めて約 `267.6ms` 平均になる
- 派生再計算の大半は `metrics` 計算なので、次の最適化対象はここ

## 6. 備考

- この値はローカル `dev` 実行の基準値であり、CI や production build の値とは一致しない
- 比較を継続する場合は同じサイズ、同じ反復回数、同じ reload 条件で実行する

## 7. CI 性能ゲート

`quality-gate` の `performance` ジョブで production build を起動し、
Playwright Chromium で `512x512` と `3840x2160` の画像を計測する。
WASM の再生成に使う Rust は `rust-toolchain.toml` と CI で `1.94.1` に固定する。
Rust の更新時は生成物を再生成し、バイト一致と動作を検証する。
各サイズは 2 回のウォームアップ後に 10 回計測し、各回ページを再読み込みする。
viewport は `1440x1000`、新しいブラウザコンテキストの初期設定で実行する。

```bash
pnpm --dir web run build
pnpm --dir web run perf:workbench:ci
```

サーバーの起動・終了は Playwright が管理する。既定のポートは `3101`。
ローカルで使用中の場合は `IROMAP_PERF_PORT` で別のポートを指定できる。
ブラウザが未導入なら先に `pnpm --dir web exec playwright install chromium` を実行する。

判定対象は初回画像解析、初回派生計算、点選択後の派生計算、矩形選択後の派生計算。
選択後の値は `selectionSource` が一致するエントリを待ち、別処理の値で代用しない。
これらはアプリの既存トレース区間の時間であり、画面描画完了や FPS の計測ではない。

| サイズ | 画像解析 | 初回派生計算 | 点選択の派生計算 | 矩形選択の派生計算 |
| --- | ---: | ---: | ---: | ---: |
| 512x512 | 1000ms | 500ms | 500ms | 500ms |
| 3840x2160 | 2000ms | 1000ms | 750ms | 750ms |

中央値が上限を超えた場合、計測値が欠落・非有限値・負値の場合、
設定したサイズや計測回数が不足した場合にジョブを失敗させる。
中央値を使うため、単発の遅延は抑制するが継続的な遅延は検出する。
上限は `web/scripts/workbench-perf-budgets.json` で管理する。
現時点では共有 CI runner のばらつきを見込んだ初期の絶対上限であり、
前回実行との相対比較ではない。CI の実測値を蓄積してから調整する。

結果は `web/performance-results/results.json` に保存し、
成功・閾値超過時とも GitHub Actions の `workbench-performance` artifact に残す。
計測途中のタイムアウトでは完全な JSON は生成されず、テストログに原因が出る。

通常の `perf:workbench` は予算ファイルを指定しない限り計測のみ実行する。
追加の環境変数:

- `IROMAP_PERF_WARMUP`: 各サイズのウォームアップ回数（既定 `2`、`0` も可）
- `IROMAP_PERF_BUDGETS`: 閾値判定用 JSON のパス。対象の全サイズ・指標を定義する
- `IROMAP_PERF_REPORT`: JSON レポート保存先

判定ロジックのテストは `pnpm --dir web run test:perf-budget` で実行できる。

## 8. React の静的性能解析

既存の `eslint-config-next/core-web-vitals` に加え、`eslint-plugin-react-perf` を利用する。
`pnpm --dir web run lint` と CI の既存 lint ステップで違反をエラーとして検出する。

- `workbench` / `rgb-cube` / `slice`: 子コンポーネントに渡す新規オブジェクト・配列を検出
- `rgb-cube` / scatter panel / histogram chart: 子コンポーネントに渡す新規関数も検出
- DOM 要素の props は対象外。workbench / slice の操作 UI は新規関数の検出対象外

参照の変化が常に性能劣化を意味するわけではないため、上記の範囲から開始する。
新しい関数が不要な再描画を起こす場合だけ適用範囲を広げ、
機械的にすべての関数へ `useCallback` を追加しない。
ルールの検出範囲は `pnpm --dir web run test:perf-lint` で検証する。
