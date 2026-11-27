# 利用状況・導線・時系列の計測

## 計測対象

固定 ID の一覧と機能・操作先の対応は [`analytics-catalog.ts`](../../web/src/lib/analytics-catalog.ts) が正本。
操作 ID は翻訳や表示文言に依存しない。

| イベント           | 意味                     | 例                                                                     |
| ------------------ | ------------------------ | ---------------------------------------------------------------------- |
| `page_view`        | 画面へのアクセス         | `/`, `/analyze`, `/docs/agent-api`                                     |
| `ui_action`        | ボタン・設定・開閉の操作 | ファイル選択を開く、コピーを押す、表示設定を開く                       |
| `feature_use`      | 成立した機能利用         | 画像入力、RGB/HSL/Lab 切替、画像の点・範囲選択、キューブ回転           |
| `operation_result` | 非同期処理の開始・結果   | 解析・コピー・ペーストの `started`, `succeeded`, `failed`, `cancelled` |

画像入力はファイル選択と貼り付けを区別する。インスペクタのコピーは HEX / RGB / HSL を区別する。
キーボードでのタブ切替も計測する。スクロールは25/50/75/90%の到達だけを画面ごとに計測する。
ホバー・マウス移動・描画フレームは送信しない。
スライダーは確定操作を計測し、途中の値を送信しない。
ヘルプボタンは共通の `metric-help` で集計する。

## 共通パラメーター

| パラメーター                         | 意味                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `feature`                            | 機能の集計単位                                                                       |
| `control_id`                         | 操作対象の固定 ID                                                                    |
| `destination`                        | 操作先。画面内の機能への導線も含む                                                   |
| `action`                             | click / change / open / close / enable / disable / select / input / rotate、処理結果 |
| `page_path`                          | 許可されたパス。その他は `/other`                                                    |
| `journey_id`                         | 同じタブ内の操作を関連付けるランダム UUID                                            |
| `event_sequence`                     | journey 内で増加する連番                                                             |
| `occurred_at_ms`                     | ブラウザーで発生した UTC epoch milliseconds                                          |
| `journey_elapsed_ms`                 | journey 開始からの時間                                                               |
| `since_previous_ms`                  | 直前のイベントからの時間                                                             |
| `previous_event`, `previous_control` | 直前のイベント種別と操作 ID                                                          |
| `operation_id`                       | 処理の開始と結果を結び付ける ID                                                      |
| `duration_ms`                        | 処理開始から結果までの時間                                                           |

journey は sessionStorage に保存し、リロードと同一タブの画面移動で継続する。
最後の計測から30分後の次の操作で新しくなる。GA 自体のセッション ID とは別物。
保存できない環境では現在のページ内でのみ継続する。
厳密なタブ間の分離や複数端末の同一人物の追跡は行わない。

## 本番の有効化

1. デプロイ先の本番環境に `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...` を設定する。
2. 本番ビルドを再デプロイする。`NEXT_PUBLIC_*` はビルド時に埋め込まれる。
3. 画面でアクセス解析に同意する。GA4 のリアルタイム画面または Tag Assistant で、画像入力・解析完了・コピーが届くことを確認する。

本番モードかつ有効な測定 ID があり、最新版への同意が有効な場合だけ読み込み・送信する。
開発モードでは同意してもGAへ送信しない。
Vercel Preview も本番ビルドなので、Preview 用環境には本番の測定 ID を設定しない。
GA4 の拡張計測で「ブラウザー履歴に基づくページ変更」の自動計測は無効にし、
この実装の `page_view` と二重計測しないようにする。
スクロールの重複やその他の自動取得を避けるため、拡張計測のスクロール・フォーム・ダウンロードなども無効にし、
許可リストで定義したイベントを使う。

## バージョン付き同意

- 保存先: `localStorage` の `iromap.privacy.analytics-consent`。既存の表示設定と同じブラウザー内保存。
- 保存項目: `schemaVersion`, `policyVersion`, `decision`, `decidedAt`, `expiresAt`。
- 有効条件: `policyVersion` が `analyticsConsentVersion` と完全一致し、`decision=granted` かつ期限内。
- 未保存・破損・旧版・未知の新版・期限切れ・保存不可では、タグも計測用キューも作らない。同意前の操作は再送しない。
- 同意・拒否とも365日（1年）で確認し直す。これは運用方針であり法令一律の指定期間ではない。
- 最新版への同意は常設の Cookie 設定から撤回できる。他のタブにも反映される。
- 撤回時は Google の送信無効化フラグを即時設定し、GA Cookie・journey・キューを削除する。
- 読み込み済みライブラリの再実行を避け、同じページでの再同意は既存ライブラリを再利用する。次の画面読み込みでは同意の検査からやり直す。
- 送信済みのデータは撤回では削除されない。画像入力や選択中の作業データ・表示設定は保持する。
- Google basic consent mode を採用し、広告関連の同意は常に denied とする。
- GA Cookieはホスト限定・最長365日（1年）・自動延長なし。Google側のデータ保持期間は別設定。
- イベントには同意済みの説明バージョン `consent_version` を付ける。

文言の正本は [標準表示文言](../specs/workbench-information-architecture/ui-copy.md#アクセス解析への同意と説明)、
校正と調査の記録は [consent-copy.md](../specs/usage-analytics/consent-copy.md)、公開画面は `/privacy`。
同意内容の範囲は `web/src/lib/analytics-consent-scope.json` に定義する。
目的・データの種類・送信先・保存期間などの範囲を変更するときは、この定義の `version` を更新し、
`tests/fixtures/analytics-consent-versions.json` に新しいバージョンのSHA-256を追加する。
既存バージョンのハッシュは変更しない。CIは同意範囲のハッシュ照合と、mainにある既存バージョンの不変性を検査する。
版1・2の登録値は旧方式の文言ハッシュ、版3以降は範囲のハッシュとする。
同じ範囲内のイベント追加・変更・名称変更、意味を変えない文言修正はバージョンを変えず、再同意を求めない。
イベントカタログと表示文言は同意範囲のハッシュに含めない。表示文言の正本との整合は別の検査で確認する。
同意判定をbooleanやバージョンの大小比較に置き換えたり、旧版同意を自動移行したりしない。

| 変更                                                                                                     | 再同意                                   |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 同じサービス改善目的・データ種類・Google Analyticsへの送信範囲で、新しいボタンや機能のイベントを追加する | 不要                                     |
| イベント名・表示名の整理や、意味を変えない説明の修正                                                     | 不要                                     |
| 新しいサービス・送信先への提供、目的変更、取得するデータの種類や保持期間の拡大                           | 範囲定義と説明を更新し、変更適用前に必要 |

GA4への既存の送信も外部送信であり、その同意を撤廃する方針ではない。
新しい外部送信など、既存の同意を超える取扱いを始める前に確認する。
CIは宣言した範囲の変更を検知する。任意の実装やGA管理画面で追加した送信経路を自動発見するわけではなく、レビューでも照合する。

公開運用前に GA 管理画面で実際の解析データ保持期間・拡張計測・Googleへのデータ共有設定を確認する。
現時点ではアカウント側の保持期間は未確認。確認した値を範囲定義と説明へ記録し、既存の同意を超えて保持期間を拡大する場合はバージョンを更新する。
第三者への送信と個人関連情報の適用判断は、[調査根拠](../specs/usage-analytics/consent-copy.md#校正と調査根拠)を参照する。

初期化コードと独自イベントは URL のクエリ・ハッシュ、参照元のパスを除去する。
独自イベントには画像データ・ファイル名・色値・クリップボードの内容・エラー文・自由入力を渡さない。
GA 管理画面側で追加された拡張計測・他のタグの送信内容は、この許可リストの対象外。
GA を遮断するブラウザーや通信エラーでは欠損し得る。画面録画・完全な操作監査ログではない。
API を直接呼ぶクライアントの利用はこのブラウザー計測には含まれない。

## GA4 で機能と導線を見る

同意内容はバージョン3。イベント追加だけで再同意しない方針を明記した。
同意判断とGA Cookieの期限は365日（1年）を維持する。旧版1・2の同意では有効化しない。
公開リポジトリへのリンクを同意画面と詳細説明に設ける。

## 保存期間と料金の区別

- 同意設定: 閲覧者のブラウザー内のlocalStorageに保存するため、保存するためのサーバーストレージ料金は発生しない。
- GA Cookie: ブラウザー内の保存期間は365日（1年）。Cookieの期限を延長しても、それ自体でGAのストレージ課金は発生しない。
- GA4通常版: [基本サービスは無料](https://marketingplatform.google.com/about/analytics/)。
- GAサーバー側の詳細データ保持: 通常版では2か月または14か月。標準集計レポートとは区別する。[Googleの保持期間の説明](https://support.google.com/analytics/answer/7667196?hl=ja)
- さらに長い詳細操作ログの保存: BigQuery Exportを利用する場合は、保存量・クエリ量などに応じて別料金。無料枠もある。[BigQuery料金](https://cloud.google.com/bigquery/pricing)

Cookie等も取扱いによって個人情報または個人関連情報となり得るため、
「個人情報ではないから無期限でよい」とは扱わず、目的と保存期間を明示する。
GAプロパティの保持期間やBigQueryの契約・接続状態はこの実装では変更していない。

## GA4 のカスタム定義

GA4 管理のカスタム定義で、次をイベントスコープのカスタムディメンションとして登録する。

- `feature`
- `control_id`
- `destination`
- `action`
- `previous_control`
- `previous_event`
- `consent_version`

処理時間を集計する場合は `duration_ms` をカスタム指標として登録する。
登録後の利用可能時期や必要権限は [GA4 のカスタムパラメーター設定](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters)を参照。

探索の自由形式では、`feature` × `control_id` × `action` で利用回数を集計する。
`previous_control` → `control_id` → `destination` で直前の操作から次の操作への導線を見る。
ファネルは例として、`photo-file` または `photo-paste` の `feature_use` →
`photo-analysis` の成功 → `preview-point` / `preview-region` / `cube-pick` / `slice-pick` →
`metrics-copy` / `histogram-copy` の成功、と設定する。
同じ処理の started と succeeded は別イベントなので、成功数は `action=succeeded` で絞る。

`journey_id`, `operation_id`, 連番、時刻は高カーディナリティになるため、
カスタムディメンションに登録せず BigQuery の詳細解析で使う。
GA 管理画面の設定変更・本番反映・BigQuery 接続はこのコード変更では実施していない。

## BigQuery で操作を時系列に取り出す

GA4 の管理画面で [BigQuery Export](https://support.google.com/analytics/answer/9358801?hl=ja) を接続する。
接続後に収集されたデータが対象となり、過去の未収集操作は復元できない。
次のプロジェクト・プロパティ ID と日付を置き換える。

```sql
WITH timeline AS (
  SELECT
    user_pseudo_id,
    event_timestamp,
    event_name,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'journey_id') AS journey_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'event_sequence') AS sequence,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'occurred_at_ms') AS occurred_at_ms,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_path') AS page_path,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'feature') AS feature,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'control_id') AS control_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'previous_control') AS previous_control,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'destination') AS destination,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'action') AS action,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'operation_id') AS operation_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'duration_ms') AS duration_ms
  FROM `YOUR_PROJECT.analytics_PROPERTY_ID.events_*`
  WHERE _TABLE_SUFFIX BETWEEN '20261128' AND '20261130'
    AND event_name IN ('page_view', 'ui_action', 'feature_use', 'operation_result')
)
SELECT *, TIMESTAMP_MILLIS(occurred_at_ms) AS occurred_at
FROM timeline
WHERE journey_id IS NOT NULL
ORDER BY user_pseudo_id, journey_id, sequence, event_timestamp;
```

ブラウザーの時計は端末依存なので、同一 journey 内の操作順には `sequence` を使う。
非同期処理は `operation_id` で対応付ける。GA 到達順だけでは操作順を決めない。

## 追加と CI 検証

1. `analytics-catalog.ts` に ID・機能・操作先を登録する。
2. ボタン・設定に `data-analytics-id`、開閉 UI に `analyticsId` を付ける。
3. タブなど状態変更で計測する UI は `data-analytics-mode="manual"` を付け、確定ハンドラーで `trackFeature` を呼ぶ。
4. 非同期処理は `startAnalyticsOperation` の返り値に成功・失敗・中断を一度渡す。
5. テストを更新し、次を実行する。

```bash
pnpm --dir web run test:analytics
pnpm --dir web run test:analytics:e2e
```

CI は固定 ID と主要 UI の対応、時系列、無効化、例外処理を検査する。
通常の UI 回帰テストは拒否済み状態から開始する。同意専用E2Eは保存状態なしで開始し、
未同意・拒否・旧版・期限切れ・保存失敗・撤回・別タブ・再同意を検証する。
本番 E2E は合成の測定 ID `G-ANALYTICSTEST` でビルドし、Google への通信を遮断して
dataLayer への実際のイベント出力を検査する。実際の GA サーバーの受信確認は含まれない。
古い未使用の `PhotoAnalysisPanel` と汎用 `components/ui` の内部部品は UI 網羅検査の対象外。
GA 管理画面にカスタム定義を自動作成する CI は含まない。新規イベント自体はコードのデプロイで追加される。
