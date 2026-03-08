# Test Cases: UI Foundation (shadcn/ui + Radix)

## 対応要求
- FR-1
- FR-2
- FR-3

## 正常系
- TC-001: 主要UIコンポーネントを import して表示できる（FR-1）
- TC-002: トップページに Hero / Workbench Preview / Feature Cards / Docs導線が表示される（FR-2）
- TC-003: テーマトグル操作でライト/ダークが切り替わる（FR-3）
- TC-004: Select/Tabs/Tooltip をキーボードで操作できる（FR-1）

## 異常系
- TC-101: テーマ切替直後に hydration warning が発生しない（FR-3）
- TC-102: 390px幅で要素が重なって読めなくならない（FR-2）
