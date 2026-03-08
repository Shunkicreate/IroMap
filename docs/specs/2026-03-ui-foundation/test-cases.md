# Test Cases: UI Foundation (shadcn/ui + Radix)

## 対応要求
- FR-1
- FR-2
- FR-3
- FR-4
- FR-5
- FR-6
- FR-7
- FR-8

## 正常系
- TC-001: 主要UIコンポーネントを import して表示できる（FR-1）
- TC-002: トップページに Hero / Workbench Preview / Feature Cards / Docs導線が表示される（FR-2）
- TC-003: テーマトグル操作でライト/ダークが切り替わる（FR-3）
- TC-004: Select/Tabs/Tooltip をキーボードで操作できる（FR-1）
- TC-005: テーマ切替UIが画面上に表示され、常時操作可能である（FR-4）
- TC-006: ライト/ダーク切替後もワークベンチ主要テキストが判読可能である（FR-4, NFR-3）
- TC-007: RGBキューブ/スライスでキーボードまたは代替UIにより色選択できる（FR-5）
- TC-008: 画面上に内部要件ID表記が表示されない（FR-6）
- TC-009: 散布図/ヒストグラムに軸または凡例が表示される（FR-7）
- TC-010: コピー成功/失敗と分析状態が toast または同等UIで通知される（FR-8）

## 異常系
- TC-101: テーマ切替直後に hydration warning が発生しない（FR-3）
- TC-102: 390px幅で要素が重なって読めなくならない（FR-2）
- TC-103: Clipboard API が利用できない環境で失敗通知が表示される（FR-8）
- TC-104: 画像分析失敗時にエラーメッセージが表示され、再試行可能である（FR-8）
