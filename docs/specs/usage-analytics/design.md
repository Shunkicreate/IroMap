# Design: 利用状況と操作導線の計測

## 全体方針

同意の文言は [標準表示文言](../workbench-information-architecture/ui-copy.md#アクセス解析への同意と説明) を正本とする。
校正方針と公式の調査根拠は [Cookie同意の文言](consent-copy.md) に残す。
`analytics-consent.ts` は localStorage の判断をバージョン・日時・期限まで検証する。
既存の表示設定用 hook は初回読み込み時に値を書き戻すため、同意では流用せず、
同じ localStorage に専用キーで保存し `useSyncExternalStore` で変更を同期する。
旧版同意の自動移行・読み込み時の同意保存はしない。
同意は365日（1年）で失効する。これは実装上の方針であり、法令共通の指定期間ではない。

Googleの basic consent mode として、同意前はタグ・計測キューとも作らない。
同意後に consent default denied → analytics granted（広告3種類は denied）→ js → config の順で初期化する。
広告関連の機能は config でも無効にする。GA Cookie はホスト限定、365日（1年）、期限の自動延長なし。
撤回は `ga-disable-測定ID` を即時設定し、キュー・journey・GA Cookie を破棄する。
読み込み済みライブラリは再実行せず、Google の送信無効化フラグで停止する。
再同意時は新規 journey として再開する。次のページ読み込みではタグ自体を読み込まない。
別タブの storage イベントと有効期限タイマーでも停止する。
送信境界は毎回保存された同意を検査し、失効・取り消し後の非同期完了も破棄する。

設定 UI は拒否と許可を同じ強さで提示し、未操作・閲覧継続・スクロールを同意とみなさない。
同意状態の変更は GA に送らない。拒否を含む判断のみローカルに保存する。

## 同意範囲とイベントの分離

`analytics-consent-scope.json` が目的・データの種類・除外対象・送信先・保存期間・広告利用禁止の範囲を定義する。
同意バージョンとブラウザー内の保存期限はこの定義を参照する。
同意の対象はこの範囲であり、操作 ID・イベント一覧・イベント数ではない。
カタログのイベント追加・名称変更と、意味を変えない文言修正は同意バージョンを変更しない。
新しい送信先、目的、データの種類や保存期間の拡大は範囲定義を変更し、最新版の再同意を必要とする。

CIは範囲定義をキー順・集合順に依存しない形でハッシュ化する。
現在のバージョンのハッシュが登録値と異なる場合は失敗し、公開済みの版の上書きも拒否する。
版1・2の登録値は過去の文言ハッシュとして保存し、版3以降は同意範囲のハッシュを保存する。
表示文言は標準表示文言との照合で検証する。文言自体をハッシュに含めて再同意を強制しない。
実装やGA管理画面側の変更が範囲外の処理を生まないかはレビューで確認する。
CIが任意の新しい送信経路を自動発見するとは扱わない。

`lib/analytics-catalog.ts` の許可リストを操作 ID と機能・導線の正本とする。
UI は `data-analytics-id` を付け、共通のクライアントコンポーネントがクリック・変更・開閉を収集する。
タブは Radix がマウスダウンやキーボードで選択するため、状態変更ハンドラーで計測する。
Canvas の選択、回転、非同期解析やコピーの成否は各処理の確定箇所から明示的に送る。

## イベント

- `ui_action`: ボタンや設定の操作意図。
- `feature_use`: ファイル入力、タブ切替、選択、回転などの成立した操作。
- `operation_result`: 解析・コピー・ペーストの started / succeeded / failed / cancelled。
- `page_view`: 既知の画面のみ。GA 初期設定の自動送信は無効化して重複を防ぐ。

すべての独自イベントに `feature`, `control_id`, `destination`, `action`, `page_path`,
`journey_id`, `event_sequence`, `occurred_at_ms`, `journey_elapsed_ms`, `since_previous_ms`,
`previous_event`, `previous_control` を付ける。結果には `operation_id` と所要時間を付ける。
非同期の完了は operation ID で開始と対応付ける。
自由なオブジェクトを受け取る送信 API は用意せず、許可された enum と数値だけを送る。

## 性能と例外系

document の委譲リスナーを使い、ホバーやReactの描画に計測状態を持ち込まない。
スライダーは native change の確定通知のみ。GA 読込前は dataLayer に順序を保ってキューする。
sessionStorage の読み書きと gtag 呼出の例外は計測境界で処理する。
Strict Mode の再実行と同一ページへの再描画で page_view を重複させない。

## 関連 ADR

- [ADR-0003](../../adr/0003-usage-analytics.md)
