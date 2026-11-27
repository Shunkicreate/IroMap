# アクセス解析同意の文言

表示文言の正本は [標準表示文言](../workbench-information-architecture/ui-copy.md#アクセス解析への同意と説明)。
この文書は本人の原案の校正方針と根拠を記録する。
同意内容のバージョン: `3`。目的・データの種類・送信先・保存期間などの同意範囲を管理する。
同意済み範囲内のイベントの追加・変更・名称変更や、意味を変えない表現修正では再同意を求めない。
送信先追加・目的変更・取得情報の種類や保存期間の拡大は、同意内容を更新して再同意を得た後に適用する。
CIは同意範囲のハッシュを検証し、個々のイベント一覧や表示文言全体のハッシュは同意判定に使わない。

バージョン3では、イベント更新を同意条件から分離する本人の方針を明記し、
同意範囲を `analytics-consent-scope.json` で管理する。旧版の自動移行はしない。

バージョン2では、本人の希望により同意とCookieの保存期間を365日（1年）に変更する。
180日は法的な必須期間ではなく当初の運用上の初期値だった。
氏名・メールアドレスなどの「直接特定する個人情報」を取得しないことを明示し、
Cookie識別子・端末情報の説明と両立させる。公開リポジトリへの導線も追加する。

## バナー

### consentTitle

- ja: アクセス解析へのご協力のお願い
- en: Help us improve IroMap

### consentPurpose

- ja: 同意いただいた場合に限り、Google アナリティクス（GA4）を使用し、当サイト内での操作や機能の利用状況を取得します。これには、ボタンクリック、スクロール、操作の順序や所要時間などが含まれます。取得したデータは、IroMapのサービス改善に利用します。
- en: With your consent, we use Google Analytics (GA4) to collect interactions and feature usage on this site, including button clicks, scroll milestones, and the order and timing of actions. We use this data to improve IroMap.

### consentData

- ja: アクセス解析では、氏名・メールアドレスなど、ご本人を直接特定する個人情報は取得しません。画像データも送信しません。GA4では、Cookieによる識別情報や、ご利用の端末・ブラウザーに関する情報を利用し、Googleに送信します。
- en: Our analytics does not collect personal information that directly identifies you, such as your name or email address, and we do not send image data. GA4 uses cookie identifiers and information about your device and browser and sends this information to Google.

### consentChoice

- ja: 同意しなくても、すべての機能をご利用いただけます。同意は「Cookie設定」からいつでも撤回できます。
- en: You can use all features without consenting. You can withdraw your consent at any time in Cookie settings.

### consentSource

- ja: 取得する情報や送信の仕組みは、公開リポジトリで確認できます。
- en: You can review the information we collect and how it is sent in our public source code.

### consentSourceLink

- ja: 公開リポジトリ（GitHub）
- en: Public repository (GitHub)
- リンク先: <https://github.com/Shunkicreate/IroMap>

### consentVersion

- ja: 同意内容のバージョン: {version}
- en: Consent version: {version}

### consentAccept

- ja: 同意する
- en: Accept

### consentReject

- ja: 同意しない
- en: Reject

### consentSettings

- ja: Cookie設定
- en: Cookie settings

### consentDetails

- ja: アクセス解析と保存期間について
- en: Analytics and storage details

### consentClose

- ja: 閉じる
- en: Close

### consentStorageError

- ja: 設定を保存できないため、アクセス解析は無効のままです。ブラウザーの保存設定をご確認ください。
- en: Your choice could not be saved, so analytics remains disabled. Check your browser storage settings.

## 詳細画面

- 計測内容の変更: 上記の同意範囲内で機能・操作・イベントを追加・変更できる。新しい送信先への提供など同意範囲を超える変更は、説明更新と事前の再同意を必要とする。

- 提供者・目的: IroMapによるサービス改善のためのアクセス解析。Google アナリティクス（GA4）を使用する。
- 取得対象: ボタンクリック、スクロール到達、機能利用、操作順・時刻・所要時間、Cookie識別情報、端末・ブラウザー情報、閲覧ページ。Googleへの通信時にIPアドレスなども送信される。
- 対象外: 画像データ・ファイル名・色値・クリップボード内容・氏名・メールアドレスをアクセス解析イベントに送らない。画像分析APIへの画像送信とは区別する。
- 保存: 判断・説明バージョン・日時はこのブラウザーのローカルストレージに365日（1年）。GA Cookieは最長365日（1年）で自動延長しない。操作順の一時保存は同じタブ内で最終計測から30分。
- GA側の保持期間: プロパティ設定に従う。実際の設定値は未確認のため、公開運用前に管理画面で確認・追記する。
- 撤回: Cookie設定で「同意しない」。以後の送信停止と、このサイトで削除可能なGA Cookie・操作順の一時記録を削除。既にGoogleへ送信済みのデータの削除を意味しない。
- 通常設定: テーマ・パネルの開閉など、利用者が選んだ表示設定は解析への同意と別に保存する。
- Google側の利用方法: Googleの「サービスを使用するサイトやアプリから収集した情報のGoogleによる使用」とプライバシーポリシーへリンクする。

## 校正と調査根拠

「個人を識別するデータは取得しません」はCookie識別子の利用と混同するため、送らない具体的な項目を列挙する。
スクロールや継続利用だけで同意した扱いにはせず、同意・拒否・撤回の明示操作を提供する。

- [Google basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [GA4 Cookie](https://support.google.com/analytics/answer/11397207?hl=ja)
- [Googleの情報の利用](https://policies.google.com/technologies/partner-sites?hl=ja)
- [Cookie等の個人関連情報に関する個人情報保護委員会Q&A](https://www.ppc.go.jp/personalinfo/faq/APPI_QA/)
- [英国ICOの同意の実装指針](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice)

英国ICOの指針は拒否・撤回を容易にする設計の参考とし、日本を含む全地域で同一の法的義務があるとは扱わない。
