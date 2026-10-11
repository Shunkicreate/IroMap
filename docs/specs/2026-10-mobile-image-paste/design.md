# Design: スマホの画像貼り付け

## 方針

workbench 専用の clipboard-image.ts に画像抽出処理を集約する（FR-1/FR-3）。
items を順に調べ、取得できなければ files を調べる。MIME が空の場合だけ拡張子を補助情報に使う。
貼り付けエリアと window のハンドラーで同じ抽出処理を利用する。
エリアのイベントは preventDefault と stopPropagation で二重適用を防ぐ。

画像入力欄だけを contenteditable にし、アップロードボタンなどは編集対象にしない（FR-2）。
標準 paste イベントを親エリアで処理し、ブラウザの HTML 挿入は常に抑止する。
入力文字は onInput で除去する。貼り付けた HTML や URL を解析・取得しない。

Async Clipboard API はユーザー操作中に read を呼ぶ（FR-3）。
PNG 優先で各画像形式の getType を試し、全画像形式が失敗した場合は最後のエラーを UI に伝える。

## 許可後の失敗と復帰（FR-4）

ClipboardImageReadError が unsupported / clipboard-read / image-data の段階を保持する。
NotAllowedError も段階に沿って表示し、ユーザーが許可を拒否したとは断定しない。
画像データを一つ取得できればエラーを表示せず、すべて失敗した場合だけ案内する。

workbench が復帰メッセージと読み取り中の状態を保持し、preview panel に渡す。
案内のボタンは編集可能欄へフォーカス・スクロールする。OS の標準「ペースト」はユーザーが実行する。
この操作は clipboard.read を再実行しない。ファイル選択・貼り付けが成功したら案内を解除する。
コンソールは段階・例外名のみを記録し、ユーザーの画像データは含めない。

## トレードオフ

編集可能欄はモバイルのキーボードを表示することがあるが、OS 標準のペースト操作を可能にする。
今回の変更は既存 workbench の入力互換性修正で、アーキテクチャや依存方向を変更しない。
