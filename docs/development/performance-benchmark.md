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

| Size      |    Pixels | Photo Avg | Photo Median | Decode Avg | Analyze Avg | Derived Avg | Derived Median | Metrics Avg | Sampled Pixels |
| --------- | --------: | --------: | -----------: | ---------: | ----------: | ----------: | -------------: | ----------: | -------------: |
| 512x512   |   262,144 |   168.4ms |      163.5ms |     52.8ms |      29.1ms |      40.2ms |         35.7ms |      36.6ms |         65,536 |
| 1024x1024 | 1,048,576 |   172.0ms |      161.6ms |     56.9ms |      28.8ms |      36.9ms |         32.2ms |      33.9ms |         65,536 |
| 2048x1536 | 3,145,728 |   247.5ms |      241.3ms |     88.9ms |      42.8ms |      58.4ms |         56.1ms |      54.0ms |         87,552 |
| 3840x2160 | 8,294,400 |   267.6ms |      259.0ms |    109.4ms |      47.6ms |      56.5ms |         52.5ms |      52.4ms |         82,944 |

## 5. 読み取り

- `1024x1024` までは sampling 上限の影響で `analyze` の増加は小さい
- `2048x1536` 以上では `decode` と `derived(metrics)` の寄与が目立つ
- 4K でも `analyze` 単体は約 `47.6ms` 平均だが、初回解析全体では `decode` を含めて約 `267.6ms` 平均になる
- 派生再計算の大半は `metrics` 計算なので、次の最適化対象はここ

## 6. 備考

- この値はローカル `dev` 実行の基準値であり、CI や production build の値とは一致しない
- 比較を継続する場合は同じサイズ、同じ反復回数、同じ reload 条件で実行する

## 7. Integer Storage Branch Re-Run

- 実行日: 2026-03-26
- 実行場所: `/Users/shunki.tada/VSCode/IroMap/.worktree/feature/integer-storage-roi-analysis`
- 対象コミット: `0078cd8 feat(perf): add integer photo analysis storage`
- 実行条件: baseline と同じ

| Size      |    Pixels | Photo Avg | Photo Median | Decode Avg | Analyze Avg | Derived Avg | Derived Median | Metrics Avg | Sampled Pixels |
| --------- | --------: | --------: | -----------: | ---------: | ----------: | ----------: | -------------: | ----------: | -------------: |
| 512x512   |   262,144 |   247.5ms |      210.9ms |     56.1ms |      33.2ms |      16.1ms |         11.8ms |       0.0ms |         65,536 |
| 1024x1024 | 1,048,576 |   211.4ms |      209.0ms |     53.1ms |      26.5ms |      11.3ms |         10.9ms |       0.0ms |         65,536 |
| 2048x1536 | 3,145,728 |   265.8ms |      249.6ms |     72.1ms |      35.7ms |      11.5ms |         10.4ms |       0.0ms |         64,460 |
| 3840x2160 | 8,294,400 |   241.4ms |      236.2ms |     80.9ms |      33.0ms |      11.2ms |          8.3ms |       0.0ms |         57,600 |

### Comparison vs. Baseline

| Size      |        Photo Delta |      Derived Delta | Sampled Pixels Delta |
| --------- | -----------------: | -----------------: | -------------------: |
| 512x512   | +79.1ms (`+47.0%`) | -24.1ms (`-60.0%`) |           0 (`0.0%`) |
| 1024x1024 | +39.4ms (`+22.9%`) | -25.6ms (`-69.4%`) |           0 (`0.0%`) |
| 2048x1536 |  +18.3ms (`+7.4%`) | -46.9ms (`-80.3%`) |   -23,092 (`-26.4%`) |
| 3840x2160 |  -26.2ms (`-9.8%`) | -45.3ms (`-80.2%`) |   -25,344 (`-30.6%`) |

### Reading

- 派生再計算は全サイズで大きく改善し、`derived avg` は `36.9-58.4ms` から `11.2-16.1ms` まで低下した
- `metrics avg` は実質 `0ms` まで低下し、selection 後の重さの主因は解消された
- 初回解析は小さい画像では悪化し、4K では改善した
- 大きい画像で `sampledPixels` が減っているため、今回の改善は「初回解析を一律に速くする」より「大きい画像と派生再計算を軽くする」性質が強い
