# Test Cases: Photo Analysis Workbench

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

- TC-001: デスクトップ幅で画像プレビュー、3D 色空間、スライス + インスペクタが同時表示される（FR-1）
- TC-001.1: 下段をスクロールしても上段 3 ペインが分析主戦場として維持される（FR-1）
- TC-002: 画像上で選択した領域が 3D 色空間とスライス上で強調表示される（FR-2, FR-3）
- TC-003: 色空間上で選択した点群に対応する画像領域がハイライト表示される（FR-2）
- TC-004: 矩形選択後、指標表と L* histogram が選択領域ベースへ切り替わる（FR-3, FR-5, FR-7）
- TC-004.1: 選択解除後に `full-image` 集計へ戻る（FR-3）
- TC-005: 2 件比較で `ΔL* / Δa* / Δb* / ΔC* / ΔE` が表示される（FR-4）
- TC-005.1: compare target 未設定時でも baseline target の分析を継続できる（FR-4）
- TC-006: 指標表を Markdown Table / CSV / TSV でコピーできる（FR-6）
- TC-007: L* histogram の bin データをコピーできる（FR-6, FR-7）
- TC-008: 指標表の数値が小数第 2 位、histogram ratio が小数第 4 位でコピーされる（FR-5, FR-6）
- TC-009: baseline と compare の histogram が同じ 20 bins で重ね表示される（FR-4, FR-7）
- TC-010: 狭幅レイアウトへ切り替えても compare と selection の state が維持される（FR-1, NFR-4）

## 異常系

- TC-101: Highlight 条件に一致する画素がない場合、Highlight Neutrality が `N/A` 表示になる（FR-5）
- TC-102: 選択領域が空または極小の場合、再集計が安全に中断される（FR-3）
- TC-103: 画像読み込み失敗時に比較対象へ追加されず、エラー表示される（FR-4）
- TC-104: 単色画像でも histogram と差分計算 UI が破綻しない（FR-5, FR-7）
- TC-105: 比較対象未設定時に差分列や重ね表示が誤って表示されない（FR-4）
- TC-106: baseline または compare の値が `N/A` のとき差分列も `N/A` になる（FR-4, FR-5）
- TC-107: hover 操作だけでは再集計が走らず、selection が保持される（FR-2, NFR-5）
