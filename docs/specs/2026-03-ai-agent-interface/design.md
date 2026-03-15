# Design: AI Agent対応画像解析インターフェース

## 1. 目的

- `spec.md` の FR-1 から FR-8 を満たす実現方式を定義する
- 人間向けUIと AI / エージェント向けAPIで、同一の解析結果モデルを共有する

## 2. 全体方針

- 入力は `file upload` と `raw image body` を共通の画像バイト列へ正規化する
- 解析はサーバー側で実行し、結果は共通のドメインモデルへ集約する
- 出力は同一モデルから `HTML` と `JSON` の両形式へ変換する
- 可視化はクライアントで補助的に描画しつつ、意味情報はサーバー生成テキストとして返す
- 元画像は解析リクエストのライフサイクル内だけで利用し、永続保存しない
- 公開APIは無認証で提供し、`User-Agent` 判定は認証根拠に使わない
- Vercel Functions の request body 上限 `4.5 MB` を踏まえ、アプリケーション上限は `4.0 MB` とする
- 濫用抑制の初期値として `IPごとに 10 req/min` を適用する

## 3. アーキテクチャ上の位置づけ

- `Analyze Page`: `/analyze` のアップロードUI、プレビュー、HTML結果表示
- `Analyze API`: `POST /api/analyze` でJSON結果を返すエンドポイント
- `Agent Docs`: `/docs/agent-api` で入力形式、制限、リクエスト例、レスポンス例を案内するページ
- `Machine-readable Docs`: `/openapi.json` と `/llms.txt` を公開する
- `Input Adapter`: multipart file / raw body を共通入力へ変換
- `Rate Limit Guard`: Vercel Rate Limiting を使ったIP単位の制限とpayload上限検証
- `Analysis Engine`: 画像メタデータ抽出、色空間変換、分布集計、主要色抽出、解釈生成
- `Presenter`: `AnalysisResult` から HTML ViewModel / JSON DTO を生成

## 4. ドメインモデル

- `AnalyzeImageInput`: `{ sourceType, mimeType, bytes, byteLength }`
- `ImageMetadata`: `{ width, height, pixelCount, colorSpace }`
- `DominantColor`: `{ hex, ratio, rgb }`
- `MetricSummary`: `{ avgBrightness, avgSaturation, brightnessVariance, saturationVariance }`
- `AnalysisNarrative`: `{ overallDescription, temperatureBias, saturationBias, contrastTrend, shadowColorBias }`
- `VisualizationExplanation`: `{ id, title, colorSpace, axes, description, findings }`
- `VisualizationData`: `{ rgbCube, slice, labScatter, hueHistogram, saturationHistogram, colorAreaRatio }`
- `AnalysisSummary`: `{ dominantColors, avgBrightness, avgSaturation, description }`
- `AnalysisResult`: `{ input, summary, analysis, visualization, explanations }`
- `AnalyzeError`: `{ code, message, retryable }`
- `RateLimitPolicy`: `{ ipPerMinute, maxBodyBytes, maxPixels, timeoutMs }`

## 5. シーケンス

1. クライアントまたは外部エージェントが画像ファイルまたは raw image body を送信する
2. `Rate Limit Guard` が IP と body size を検証する
3. `Input Adapter` が入力形式と `Content-Type` を検証し、共通入力へ正規化する
4. `Analysis Engine` が画像をデコードし、メタデータとピクセルサンプルを取得する
5. 画素数が上限超過の場合は解析前に失敗を返す
6. 色空間変換と集計処理で主要色、統計値、可視化用データを生成する
7. 解釈生成処理で短い要約文と可視化ごとの説明文を構築する
8. `Presenter` が同一 `AnalysisResult` から HTML と JSON の出力モデルを生成する
9. レスポンス返却後、元画像バイト列と一時データを破棄する

## 6. API設計

### `POST /api/analyze`

- 目的: AI / エージェント向けにJSON結果を返す
- 入力:
  - `Content-Type: image/jpeg | image/png | image/webp`
  - request body に画像バイナリを直接格納する
- 正常レスポンス:
  - `200 OK`
  - `AnalysisResult` を返す
- エラーレスポンス:
  - `400 Bad Request`: 未対応形式、サポート外 `Content-Type`
  - `413 Payload Too Large`: 画像サイズ超過
  - `422 Unprocessable Entity`: デコード不能画像、画素数超過
  - `429 Too Many Requests`: レート制限超過
  - `408 Request Timeout` または `504`: アプリケーション上の解析時間超過

### `GET /docs/agent-api`

- 目的: AI / エージェント向けの利用ガイドを提供する
- 内容:
  - 対応 `Content-Type`
  - サイズ上限、画素数上限、レート制限
  - request / response 例
  - エラーコード一覧

### `GET /openapi.json`

- 目的: 機械可読なAPI定義を提供する

### `GET /llms.txt`

- 目的: LLM向けの短い案内と主要導線へのリンクを提供する

### `/analyze`

- 目的: 人間向け解析ページを提供する
- 構成:
  - ファイルアップロード
  - 画像プレビュー
  - サマリー
  - 可視化とテキスト説明
  - API利用方法への補助導線

## 7. 例外系

- MIME type または拡張子が非対応の場合は `400` を返す
- body size が `4.0 MB` を超える場合は `413` を返す
- 画像デコード後の画素数が `12 MP` を超える場合は `422` を返す
- IPの制限を超えた場合は `429` を返す
- 画像デコード失敗時は `422` を返し、解析を中断する
- 解析が `15 秒` を超える場合はタイムアウトエラーへ変換する
- 解析途中で内部例外が発生した場合は、内部詳細を露出しない汎用エラーへ変換する

## 8. セキュリティ考慮

- アップロード画像は一時メモリまたは一時領域のみで扱い、永続保存しない
- `User-Agent` や送信元ドメインは認証根拠に使わない
- レート制限は Vercel Rate Limiting を使ってIP単位で適用する
- 初期実装では Vercel KV を直接カウンタ保存先として使わない
- IP偽装や分散送信による回避は、初期段階では許容する
- HTML出力へ埋め込む文字列はエスケープし、入力由来の注入を防ぐ
- JSONエラーでは内部実装詳細やスタックトレースを返さない

## 9. 可観測性

- 入力種別ごとの件数を記録する
- 画像サイズ、処理時間、エラー率を測定する
- サイズ超過、画素数超過、レート制限超過を分類して観測できるようにする
- JSONスキーマ変更は最新デプロイ基準で管理し、旧バージョン互換性は追わない

## 10. トレードオフ

- 元画像を保存しないため、再訪URLや再現実行には再入力が必要になる
- HTMLとJSONを同一モデルから生成することで整合性は上がるが、Presenter層の責務は増える
- raw body 入力に絞ることで仕様は単純になるが、クライアント側には画像バイナリ送信実装が必要になる
- 公開APIを無認証にすることで導入は容易になるが、悪用耐性はIP制限頼みになる
- 解釈文をテンプレート生成に寄せることで再現性は高まるが、表現の柔軟性は制限される

## 11. 関連ADR

- [ADR-0001: 描画スタックとして Three.js + Canvas を採用する](../../adr/0001-rendering-stack-threejs-canvas.md)
- [ADR-0002: フロントエンド基盤として Next.js（React）+ Turbopack を採用する](../../adr/0002-frontend-framework-nextjs-turbopack.md)
