# Notes: AI Agent対応画像解析インターフェース

- レート制限は Vercel Rate Limiting を第一候補とする
- IPベース制限のみでどこまで耐えるかは、公開後のアクセス傾向を見て再評価する
- `llms.txt` と `openapi.json` の両方を初回から公開するかは実装時に確定する
