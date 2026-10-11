# Notes: スマホの画像貼り付け

- Issue: [スマホのコピーで一部出来ないバグ修正 #86](https://github.com/Shunkicreate/IroMap/issues/86)
- コピー元は Safari、貼り付け先は iPhone Brave。スクリーンショットの iOS アプリ間ペースト許可はユーザーが承認済み。
- JPEG を受け入れる既存実装・擬似 paste テストはあったが、iPhone の実際のクリップボード表現と失敗段階は未確認。
- 対象 JPEG は 4000×2667、558131 バイト。別チャットで Pillow verify が成功している。
- 報告時の Vercel プレビューは #87 のもので、#86 の修正は含まれていなかった。
- 確認した実装上の欠落: files フォールバック、標準ペースト操作用の編集可能欄、画像形式取得失敗時の次候補。
- これらの欠落を修正したことと、報告された note JPEG の原因特定・実機解消確認は別に扱う。
- read/getType の両方の NotAllowedError を許可拒否としていたため、失敗段階を区別し標準ペーストへの復帰を案内する。
- 参考: [WebKit Async Clipboard API](https://webkit.org/blog/10855/async-clipboard-api/)
- 参考: [MDN DataTransfer.files](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/files)
- Windows の pnpm 8 は既存 workspace 設定を解釈できず、pnpm 10 でインストールした。

## 初回検証結果（FR-4 追加前）

- Chromium: 追加5件と既存 slice-and-photo-analysis 8件が成功。
- WebKit 18.4（Playwright / iPhone 13 表示設定）: 追加5件が成功。
- 320 / 375 / 768 / 1024 / 1440px: 入力欄の収まりと横スクロールがないことを自動確認。
- 変更ファイルの ESLint、CSS の Stylelint、TypeScript 型チェックが成功。
- iPhone 実機での note JPEG コピーは未実行。Playwright の WebKit は iOS 実機ではない。

WebKit テスト: `pnpm --dir web exec playwright test --config=playwright.mobile.config.ts`。

## FR-4 追加後の検証結果

- Chromium: 追加9件と既存 slice-and-photo-analysis 8件が成功。
- WebKit 18.4（Playwright / iPhone 13 表示設定）: 追加9件が成功。
- 対象の note 原本 JPEG を mock ClipboardItem.getType から渡し、Chromium/WebKit で 4000×2667 のデコードと解析結果表示に成功。
  この確認はアプリ間の iOS 許可ダイアログや Brave の実際のクリップボード挙動を再現しない。
- web 全体の lint、format:check、TypeScript 型チェック、ルートの Markdown lint が成功。
- Windows チェックアウトの CRLF 警告は、未変更ファイルが Git 原本と CRLF 以外バイト一致することを検証した上で原本バイトに戻して解消。
  PR に無関係な内容の変更は含めない。
- iPhone 実機の Safari → Brave コピーは引き続き未確認。
