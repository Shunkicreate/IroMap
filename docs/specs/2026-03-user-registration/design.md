# Design: ユーザー登録

## 1. 目的
この設計は `spec.md` の FR-1, FR-2 を満たすための実装方針を定義する。

## 2. 全体方針
- API で仮登録ユーザーを作成
- 確認メール送信はジョブキュー経由で非同期化
- メール確認完了時に本登録状態へ更新

## 3. アーキテクチャ上の位置づけ
- Web API
- User Service
- Mail Worker
- PostgreSQL
- Redis Queue

## 4. ドメインモデル
### User
- id
- email
- password_hash
- status: pending | active | suspended
- created_at

### EmailVerificationToken
- user_id
- token_hash
- expires_at
- consumed_at

## 5. シーケンス
1. ユーザーが登録 API を呼ぶ
2. バリデーション
3. pending user 作成
4. verification token 作成
5. mail job enqueue
6. 確認メール送信
7. リンク押下
8. token 検証
9. user.status を active に更新

## 6. API設計
### POST /users/register
request:
- email
- password

response:
- 202 Accepted
- 汎用メッセージ

### POST /users/verify-email
request:
- token

response:
- 200 OK / 400 Bad Request

## 7. 例外系
- 重複メール
- token 期限切れ
- queue enqueue 失敗
- mail provider 障害

## 8. セキュリティ考慮
- token は平文保存しない
- password は Argon2 または bcrypt
- account enumeration を避ける

## 9. 可観測性
- register.request.count
- register.success.count
- verify.success.count
- mail.enqueue.failure.count

## 10. トレードオフ
- メール送信は同期のほうが単純だが、API 遅延と障害影響が大きい
- 非同期化で複雑性は増えるが、UX と耐障害性は改善する

## 11. 関連ADR
- ADR-0004: 確認メール送信を非同期化する
