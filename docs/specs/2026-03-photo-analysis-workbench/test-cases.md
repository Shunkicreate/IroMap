# Test Cases: Photo Analysis Workbench

## 対応要求

- FR-1
- FR-2
- FR-3
- FR-5
- FR-6
- FR-7
- FR-8
- FR-9

## 正常系

- TC-001: デスクトップ幅で画像プレビュー、3D 色空間、スライスが同時表示され、インスペクタは下段補助領域で利用できる（FR-1）
- TC-001.1: 下段をスクロールしても上段 3 ペインが分析主戦場として維持される（FR-1）
- TC-002: 画像上で選択した領域が 3D 色空間とスライス上で強調表示される（FR-2, FR-3）
- TC-003: 色空間上で選択した点群に対応する画像領域がハイライト表示される（FR-2）
- TC-004: 矩形選択後、指標表と `L* histogram` が選択領域ベースへ切り替わる（FR-3, FR-5, FR-7）
- TC-004.1: 選択解除後に `full-image` 集計へ戻る（FR-3）
- TC-006: 指標表を Markdown Table / CSV / TSV でコピーできる（FR-6）
- TC-007: `L* histogram` の bin データをコピーできる（FR-6, FR-7）
- TC-008: 指標表の数値が小数第 2 位、histogram ratio が小数第 4 位でコピーされる（FR-5, FR-6）
- TC-009: `highlight a* mean` と `Highlight (L* > 80)` 条件表示を確認できる（FR-5）
- TC-011: `i` アイコンの hover / focus で指標説明を確認できる（FR-5）
- TC-012: RGBキューブ / スライスの白マッピングと選択色マッピングを個別に切り替えられる（FR-2, FR-8）
- TC-013: 折りたたみ状態がリロード後も復元される（FR-8）
- TC-014: 画像入力 disclosure を閉じても画面全体 paste で画像投入できる（FR-8）
- TC-010: 狭幅レイアウトへ切り替えても selection の state が維持される（FR-1, NFR-4）

## 異常系

- TC-101: Highlight 条件に一致する画素がない場合、Highlight Neutrality が `N/A` 表示になる（FR-5）
- TC-102: 選択領域が空または極小の場合、再集計が安全に中断される（FR-3）
- TC-104: 単色画像でも histogram と指標 UI が破綻しない（FR-5, FR-7）
- TC-107: hover 操作だけでは再集計が走らず、selection が保持される（FR-2, NFR-5）
