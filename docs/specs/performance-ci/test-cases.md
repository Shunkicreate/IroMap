# Performance CI Test Cases

- TC-001: 対象 renderer の新規オブジェクト・配列・関数 props をエラーにする（FR-1）
- TC-002: DOM props と適用外コンポーネントに react-perf を適用しない（FR-1）
- TC-003: 操作 UI の新規関数は許可し、データ props の新規生成は検出する（FR-1）
- TC-004: 予算内・境界値では成功し、中央値が予算を超えるとサイズと指標名付きで失敗する（FR-2）
- TC-005: 欠落・非有限値・負値・回数不足・サイズ不足・不正設定は失敗する（FR-3）
- TC-006: production build で両サイズの画像解析・点選択・矩形選択を実行し JSON を保存する（FR-2, FR-3）
