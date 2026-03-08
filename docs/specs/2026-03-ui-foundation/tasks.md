# Tasks: UI Foundation (shadcn/ui + Radix)

## ルール

- 各タスクは spec の要求 ID に紐づける

## 実装

- [x] T-001 shadcn/ui + Radix 依存を追加する（FR-1）
  - 完了条件: 必要パッケージが `web/package.json` に追加される
- [x] T-002 UI基盤コンポーネントを追加する（FR-1）
  - 完了条件: Button/Card/Input/Select/Tabs/Separator/Skeleton/Tooltip/Toast が利用可能
- [ ] T-003 トップページを1ページ構成に置換する（FR-2）
  - 完了条件: Hero / Workbench Preview / Feature Cards / Docs導線を表示する
- [ ] T-004 テーマ切替を実装する（FR-3）
  - 完了条件: ライト/ダーク切替が可能で見た目が崩れない
  - メモ: `ThemeProvider` / `ThemeToggle` は実装済み。トップページへのトグル配置は未反映

## テスト

- [ ] T-101 lint と format:check を通過する（FR-1, FR-2, FR-3）
- [x] T-102 モバイル幅でレイアウト崩れがないことを確認する（NFR-2）
- [ ] T-103 キーボード操作で Radix コンポーネントが操作可能であることを確認する（NFR-1）

## 監視 / 運用

- [ ] T-201 今後追加する feature で `components/ui` 再利用を優先する運用ルールを共有する（FR-1）
