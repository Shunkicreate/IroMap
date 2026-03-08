# Design: ログイン

## 1. 目的
この設計は `spec.md` の FR-1, FR-2 を満たすための実装方針を定義する。

## 2. 全体方針
- 認証 API で資格情報を検証
- ユーザー状態が active の場合のみ JWT を発行
- 認証失敗時は統一エラーで返却

## 3. アーキテクチャ上の位置づけ
- Web API
- Auth Service
- User Repository
- PostgreSQL

## 4. ドメインモデル
### User
- id
- email
- password_hash
- status: pending | active | suspended

### AuthToken
- sub
- iat
- exp
- jti

## 5. シーケンス
1. ユーザーがログイン API を呼ぶ
2. 入力バリデーション
3. email でユーザー検索
4. password_hash 照合
5. user.status チェック
6. JWT 発行
7. レスポンス返却

## 6. API設計
### POST /auth/login
request:
- email
- password

response:
- 200 OK（access_token）
- 401 Unauthorized（認証失敗）

## 7. 例外系
- メール未登録
- パスワード不一致
- pending ユーザー
- JWT 署名鍵エラー

## 8. セキュリティ考慮
- パスワード照合は定数時間比較を使う
- エラー文言は存在有無を推測不能にする
- JWT 秘密鍵は安全なストアで管理する

## 9. 可観測性
- login.request.count
- login.success.count
- login.failure.count
- login.pending_rejected.count

## 10. トレードオフ
- シンプルな JWT のみ構成は実装が容易
- ただし失効制御は別設計（ブラックリストや短寿命化）が必要

## 11. 関連ADR
- ADR-0003: Auth by JWT
