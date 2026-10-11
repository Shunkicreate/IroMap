# IroMap 情報の重要度と開示階層

- 文書の位置づけ: 設計草案。画面にある情報の種類・目的・背景・重要度・開示の深さを定義する。
- 対象: 写真・画像の色を分析するプロダクト。主作業は写真の色を3Dキューブとスライスで確かめること。
- 対象外: 状態遷移、操作イベント、データ更新・保持・復帰の規則、実装、配色・書体・質感の確定。
- 記法: 見出しとリストだけを使う。表・図・コードブロックは使わない。
- 根拠: 2026-10-11の本人の説明・決定と、既存画面のソース棚卸し。
- 既存要素の基準: [参照コミット](https://github.com/Shunkicreate/IroMap/tree/3256f13ffd13b86c84889a6e12bbdcd36ffc6713)。ローカルの古いmainや別作業ブランチと混同しない。
- 設計提案は各要素の「根拠区分」に明記する。記載は実装済みや承認済みを意味しない。
- 関連: [用語集](glossary.md)、[標準表示文言](ui-copy.md)、[棚卸しと照合記録](information-audit.md)。

## 定義の読み方

- 目的: この要素が利用者にとって存在する理由。
- 背景: 重要度や開示をそう定める根拠。
- 重要度P1: 主作業の図・操作・現在対象の識別に必要な情報。条件付きの案内も必要な箇所ではP1。
- 重要度P2: 作業の前提・参照対象・低頻度だが必要な入口。
- 重要度P3: 詳細設定・専門的な値・全体の補助分析。
- 重要度は削除可否ではない。P3の既存機能も入口と詳細を定義して維持する。
- H1: プロダクトの情報設計。
- H2: 大きな情報領域・画面。重要度の順位そのものではない。
- H3: 領域名・図・主操作・短い案内・詳細への入口。
- H4: 主作業と一括で並べない詳細グループ。
- H5: 詳細グループ内の設定・値・図の構成。
- H4/H5は所属する入口の下で開示する。一覧を隠す場合もH3の入口と名前を残す。
- 見出しの深さはこの文書の構造。MarkdownやHTMLの見出しだけで実際の開閉が起きるという意味ではない。
- 読み上げ情報は画面上に一括で並べないが、対象要素に付随する情報として省略しない。
- アイコン・枠・描画層は構成要素として記載する。情報や操作が同じ場合は別機能として重複計上しない。
- 動的な点・棒・行・色は繰り返し項目の型と表示項目を定義する。画像内の全画素を個別の見出しにはしない。
- PC: 3Dとスライスと断面スライダーを隣接させる。写真の参照面積は主領域より下位。
- スマホ: 正方形に近い3D図と断面図を縦に並べる。ラベルとスライダーは描画領域の外側で直近に置く。
- 4K・ウルトラワイド: 余った幅で主領域間の距離を広げない。具体的な寸法・開閉容器は後続設計。
- 補助画面: 主画面との関係ではP3でも、その画面内での主情報はP1と明記する。
- 文言IDは既存辞書のキーを基準にする。変更後もキー名の「White」などを意味の定義として使わない。

## W-00 作業画面の共通情報

- 目的: 写真の色を分析する画面であることを伝える。
- 背景: プロダクトの価値は写真の色構造の理解。
- 重要度: P2。
- 開示区分: 常時・小さく。
- 内容:
  - 対象画面: /。
  - タイトル、説明、テーマ、現在の選択色。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/app/page.tsx`。

### W-01 画面タイトルと説明

- 目的: 何を扱うツールか短く伝える。
- 背景: 導入説明で3D・スライスの面積を圧迫しない。
- 重要度: P2。
- 開示区分: 常時・短文。
- 内容:
  - 製品名: IroMap。
  - 見出しと一文の説明。
  - 装飾的な大見出しは重要情報として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/app/page.tsx`。
- 文言ID: `heroTitle`、`heroDescription`。

### W-02 テーマ

- 目的: 観察しやすい背景の明暗を選べるようにする。
- 背景: 写真の色とUI背景の区別が必要。
- 重要度: P2。
- 開示区分: 常時・小さな操作。
- 内容:
  - ライト／ダーク。
  - 変更先のテーマを示す読み上げ名。
  - 操作先のtitle・読み上げ文言。
  - 太陽／月のアイコンはボタンの装飾。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/components/theme-toggle.tsx`。
- 補助文言ID: `proposal.themeAction`。
- 文言ID: `workbenchThemeLabel`、`workbenchThemeLight`、`workbenchThemeDark`。

### W-03 選択色の最小情報

- 目的: 現在見ている色を図の近くで識別する。
- 背景: 詳細な数値よりも対象の取り違え防止が優先。
- 重要度: P1。
- 開示区分: 常時・3Dとスライスの近傍。
- 内容:
  - 現在の選択色の色見本。
  - ラベル: 選択色。
  - 未選択の短い案内。
  - 過去の色・基準色の比較枠は含めない。
- 根拠区分: 設計提案・既存の選択色情報を主領域へ分ける。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `inspectorSelected`、`inspectorNoSelected`。

## P-00 写真

- 目的: 分析対象と写真内の位置を確認できるようにする。
- 背景: 入力操作は低頻度、写真の位置の確認は必要なときに行う。
- 重要度: P2。
- 開示区分: 入口は常時・写真の詳細は要求時。
- 内容:
  - 画像入力。
  - 写真参照。
  - 表示設定。
  - 画像情報。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

### P-01 写真を選ぶ

- 目的: 分析する画像ファイルを指定する。
- 背景: 画像入力の基本操作であり貼り付けが難しい環境でも必要。
- 重要度: P1。
- 開示区分: 入口に表示。
- 内容:
  - ファイル選択ラベル。
  - 画像ファイル入力: image/\*。
  - OSの選択ダイアログはこの情報設計の対象外。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `photoChooseAction`、`photoUploadLabel`。

### P-02 画像を貼り付ける入力欄

- 目的: コピー済みの画像を取り込む入口を示す。
- 背景: キーボードとスマホのペースト操作の双方が使われる。
- 重要度: P1。
- 開示区分: 入口に表示。
- 内容:
  - 編集可能な貼り付け入力欄。
  - プレースホルダー。
  - 入力欄の読み上げ名。
  - 長押し／Ctrl+V／⌘Vの補助文。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `photoPasteAction`、`photoPasteActionHint`、`photoPasteInputLabel`。

### P-03 写真の参照入口

- 目的: 必要なときに写真を大きく参照できるようにする。
- 背景: 探索では3Dとスライスが優先、写真の常時占有を抑える。
- 重要度: P2。
- 開示区分: 常時・小さな入口。
- 内容:
  - 写真を表示する入口。
  - ファイル名と小さな写真の識別表示はこの入口にまとめる。
  - スマホの写真参照容器の形式は未決。
- 根拠区分: 設計提案・入口の具体形は後続の配置設計。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 補助文言ID: `proposal.photoOpen`。

#### P-04 写真の参照領域

- 目的: 写真内の気になる場所と色空間を対応づける。
- 背景: 写真の位置と色の関係が主作業の起点になる。
- 重要度: P2。
- 開示区分: 要求時・スマホでは補助領域。
- 内容:
  - 画像の全体。
  - 点・領域・カーソルの目印。
  - 写真を閉じる操作。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `photoPreviewTitle`。

##### P-05 対象写真と代替情報

- 目的: 対象の内容とファイルを認識する。
- 背景: どの写真の色を調べているか分かる必要がある。
- 重要度: P2。
- 開示区分: 写真の参照領域内。
- 内容:
  - 画像本体。
  - 代替テキスト: 分析対象画像とファイル名。
  - 画像がない場合のImageアイコンと案内。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `photoPreviewAlt`、`photoPreviewEmpty`。

##### P-06 写真上の点の目印

- 目的: 選択点とカーソルの位置を識別する。
- 背景: 色空間との対応を写真上で追える必要がある。
- 重要度: P1。
- 開示区分: 写真の参照領域内・図に重ねる。
- 内容:
  - 選択サンプルの目印。
  - カーソル位置の目印。
  - 色だけに依存しない形・枠。
  - 内部のsampleIdは表示しない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

##### P-07 写真上の領域の枠

- 目的: 分析対象の範囲を認識する。
- 背景: 一点の色と複数画素の領域は別の情報。
- 重要度: P2。
- 開示区分: 写真の参照領域内・図に重ねる。
- 内容:
  - 選択領域の矩形。
  - 領域指定中の矩形。
  - 範囲は画像上の位置で表現。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

##### P-08 写真を閉じる操作

- 目的: 探索の主領域を見やすくする。
- 背景: ユーザーが写真の表示量を自分で決めたい。
- 重要度: P2。
- 開示区分: 写真の参照領域内。
- 内容:
  - ラベル: 写真を閉じる。
  - 閉じるアイコンと読み上げ名。
- 根拠区分: 設計提案・写真を補助領域にした場合の操作。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 補助文言ID: `proposal.photoClose`。

### P-09 写真の表示設定入口

- 目的: 写真に関する低頻度の設定をまとめる。
- 背景: 探索の主領域に設定項目を常時並べない。
- 重要度: P3。
- 開示区分: 入口のみ・詳細は開示。
- 内容:
  - 開閉の要約ラベル。
  - 開閉を表すマーカー。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `workbenchDisplayOptionsDisclosure`。

#### P-10 写真の表示設定

- 目的: 点の採取方法と見え方を確認する。
- 背景: 点群を写真全体の全画素と誤解しないために必要。
- 重要度: P3。
- 開示区分: 設定を開いた範囲。
- 内容:
  - グリッド表示。
  - グリッド線の色。
  - サンプリング密度。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

##### P-11 サンプリンググリッド

- 目的: 採取位置の間隔を写真上で確認する。
- 背景: 解析対象がサンプルであることを理解する補助。
- 重要度: P3。
- 開示区分: 表示設定内・描画は写真上。
- 内容:
  - グリッドを表示するチェックボックス。
  - 画像上の格子パターン。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `previewShowSamplingGrid`。

##### P-12 グリッド線の色

- 目的: 写真に埋もれにくい線色を選べるようにする。
- 背景: 写真の明暗によって目印の読みやすさが変わる。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - ラベル: グリッド線の色。
  - 白／黒の選択肢。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `previewSamplingGridColorLabel`、`previewSamplingGridColorWhite`、`previewSamplingGridColorBlack`。

##### P-13 サンプリング密度

- 目的: 解析対象の細かさと処理量を確認する。
- 背景: 精度と処理負荷に関わる設定だが操作頻度は低い。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - 1〜100%のスライダー、刻み1%。
  - 密度の現在値。
  - サンプル数。
  - 既存の初期値: 40%。
  - 100%の処理負荷についての注意。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 文言ID: `previewSamplingDensityLabel`、`previewSamplingDensityFullWarning`。

### P-14 画像情報の入口

- 目的: 対象ファイルと解析の概要を参照できるようにする。
- 背景: 処理時間などを主作業の図と同じ重さで並べない。
- 重要度: P3。
- 開示区分: 入口のみ・詳細は開示。
- 内容:
  - 画像情報の要約ラベル。
  - 開閉マーカー。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。
- 文言ID: `photoMetaSummary`。

#### P-15 画像情報

- 目的: どのデータを観察しているか確認する。
- 背景: 対象と採取量を必要なときに検証する。
- 重要度: P3。
- 開示区分: 画像情報を開いた範囲。
- 内容:
  - ファイルと解析情報。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`。

##### P-16 ファイルと解析情報の値

- 目的: 対象と計算の規模を具体的に示す。
- 背景: 数値データの前提を確認できるようにする。
- 重要度: P3。
- 開示区分: 画像情報内。
- 内容:
  - ファイル名。
  - 選択中のファイル名の文言。
  - 採取サンプル数。
  - 処理時間、単位ms。
  - 各値の表示書式は既存を基準。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `photoUploadSelected`、`photoSummary`。

## C-00 3Dキューブ

- 目的: 写真の色と色空間内の位置・分布を把握する。
- 背景: 設定操作は低頻度だが図を見る頻度は高い。
- 重要度: P1。
- 開示区分: 主領域・図を大きく。
- 内容:
  - 3D図。
  - 色空間。
  - 図の補足情報。
  - 表示設定。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 文言ID: `panelRgbCube`。

### C-01 3D図

- 目的: 選択色と写真の点群の位置関係を示す。
- 背景: 色をどの方向へ動かすか考えるための手掛かりになる。
- 重要度: P1。
- 開示区分: 常時・主領域。
- 内容:
  - 色空間全体のガイド形状。
  - 規則的に配置された色の点。
  - 写真由来の色の点群。
  - 選択範囲の強調点。
  - 現在のスライス平面。
  - 選択色とカーソル色のフォーカス目印。
  - ベース・フォーカスの描画層は一つの図として扱う。
  - キャンバスの読み上げ名。
  - スマホでは正方形に近い描画領域。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 文言ID: `cubeCanvasAriaLabel`。

### C-02 3D図の短い説明

- 目的: 図の用途を読み取れるようにする。
- 背景: 操作方法だけでは分析で何が分かるか伝わらない。
- 重要度: P2。
- 開示区分: 常時・一文。
- 内容:
  - 位置と分布の確認という用途の説明。
  - 必要最小限のドラッグ操作の説明。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `panelRgbCubeRequirements`。

### C-03 色空間

- 目的: 現在の図の座標の意味を識別する。
- 背景: 軸の名前を理解する前提なので低頻度でも隠し過ぎない。
- 重要度: P2。
- 開示区分: 常時・図の近傍。
- 内容:
  - RGB／HSL／Labの選択肢。
  - 既存の初期値RGBを継承。
  - Labは選択できる補助的な色空間。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `spaceRgb`、`spaceHsl`、`spaceLab`。

### C-04 軸とスライス位置の文脈

- 目的: 図の向きと断面の場所を読む。
- 背景: 3Dとスライスを行き来するときに必要。
- 重要度: P1。
- 開示区分: 図の近傍・短く。
- 内容:
  - 空間ごとの軸名。
  - RGBはR/G/B、HSLはH/S/L、LabはL\*/a\*/b\*。
  - 現在の固定軸と値。
  - 3D内のスライス平面。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。
- 文言ID: `cubeSliceOverlay`。

### C-05 3Dの表示設定入口

- 目的: 低頻度の設定を主作業からまとめて分ける。
- 背景: ボタンの頻度と図の参照頻度を同一視しない。
- 重要度: P3。
- 開示区分: 入口のみ・詳細は開示。
- 内容:
  - 表示設定の要約ラベル。
  - 開閉マーカー。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `workbenchDisplayOptionsDisclosure`。

#### C-06 3Dの表示設定

- 目的: 点群と補助線の表示量を選べるようにする。
- 背景: 用途に応じて図の情報密度を調節する。
- 重要度: P3。
- 開示区分: 設定を開いた範囲。
- 内容:
  - 表示内容。
  - 点の表示。
  - 軸ガイド。
  - 図のサイズ。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。

##### C-07 表示内容

- 目的: 色空間の点と写真の点を区別する。
- 背景: グリッドと画像という略称だけでは中身を理解しにくい。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - 色空間の点のみ。
  - 写真の点のみ。
  - 色空間の点と写真の点。
  - 既存の表示モード3種を継承。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `cubeOverlayModeLabel`、`cubeOverlayModeGrid`、`cubeOverlayModeImage`、`cubeOverlayModeBoth`。

##### C-08 写真の点を表示

- 目的: 写真由来の点群の有無を選べるようにする。
- 背景: 現在の白マッピングという文言は3Dの実際の色付き描画と合わない。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - チェックボックス。
  - 写真全体に由来する点群。
  - 点の数・割合を反映する描画表現。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 文言ID: `workbenchShowWhiteMappingCube`。

##### C-09 選択範囲の点を表示

- 目的: 写真の一部に対応する点群を識別する。
- 背景: 単一の選択色と分析対象の領域の点群は別物。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - チェックボックス。
  - 選択範囲の点群の強調表示。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 文言ID: `workbenchShowSelectedMappingCube`。

##### C-10 軸ガイド

- 目的: 座標の意味を補助線で確認する。
- 背景: 必要なガイドと視覚的な混雑の両方を調整したい。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - 軸ガイドの表示チェックボックス。
  - 線・ラベル・空間形状のガイド。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/rgb-cube/rgb-cube-guides.ts`。
- 文言ID: `cubeShowAxisGuide`。

##### C-11 図のサイズ

- 目的: 3D図の表示寸法を調節する。
- 背景: 広いディスプレイを使う一方で操作頻度は低い。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - サイズスライダーの表示チェックボックス。
  - サイズの現在値、単位px。
  - 320〜900px、刻み10pxのスライダー。
  - 既存の初期値760px。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `cubeShowSizeSlider`、`cubeSizeLabel`。

##### C-12 描画の補足情報

- 目的: 点の数と表示内容の前提を確認する。
- 背景: 診断に必要だが色の位置より優先度は低い。
- 重要度: P3。
- 開示区分: 表示設定内へ集約する設計案。
- 内容:
  - RGB各成分の段階数。既存表示は256で、実際の格子の各軸16点とは別の情報。
  - 表示モード。
  - 写真の点の数。
  - 画像の解像度とは別の値。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`。
- 文言ID: `cubeResolutionOverlay`、`cubeOverlayStatus`。

## S-00 スライス

- 目的: 色空間の断面で色の配置を詳しく見る。
- 背景: 3Dと断面とスライダーを何度も見比べる。
- 重要度: P1。
- 開示区分: 主領域・3Dの近傍。
- 内容:
  - 断面図。
  - 固定軸。
  - 固定値。
  - 選択色の高さへの入口。
  - 表示設定。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `panelSlice`。

### S-01 断面図

- 目的: 平面内で色の違いと配置を確認する。
- 背景: 現像で色を動かす方向を考えるための主情報。
- 重要度: P1。
- 開示区分: 常時・主領域。
- 内容:
  - 断面の色の面。
  - 写真全体のサンプル点。
  - 選択範囲のサンプル点。
  - カーソルの目印。
  - 選択色の位置の目印は後続描画設計の提案。
  - 背景・点・カーソルの描画層を一つの図として扱う。
  - スマホでは正方形に近い図を3Dの下へ配置。
  - 方向別色プレビューは含めない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `sliceCanvasAriaLabel`。

### S-02 スライスの短い説明

- 目的: 断面図の意味を伝える。
- 背景: スライスという既存名を残して内容を説明する。
- 重要度: P2。
- 開示区分: 常時・一文。
- 内容:
  - 一つの軸を固定した色の断面という説明。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `panelSliceRequirements`。

### S-03 固定軸

- 目的: どの座標を一定にした断面か識別する。
- 背景: 値の意味と平面の向きの前提になる。
- 重要度: P1。
- 開示区分: 常時・断面図の近傍。
- 内容:
  - 軸のセレクト。
  - RGB: R/G/B。
  - HSL: H（色相）/S（彩度）/L（明るさ）。
  - Lab: L\*（明度）/a\*（緑↔赤）/b\*（青↔黄）。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `sliceAxisLabel`、`sliceAxisR`、`sliceAxisG`、`sliceAxisB`、`sliceAxisH`、`sliceAxisS`、`sliceAxisL`、`sliceAxisLabL`、`sliceAxisLabA`、`sliceAxisLabB`。

### S-04 固定値とスライダー

- 目的: 現在の断面位置と近くの色を確認する。
- 背景: 目と手を断面から遠くへ移さないことが大切。
- 重要度: P1。
- 開示区分: 常時・断面図の直近。
- 内容:
  - スライダーと現在の数値。
  - RGB: 0〜255。
  - HSL H: 0〜360°、S/L: 0〜100%。
  - Lab L\*: 0〜100、a\*/b\*: -128〜127。
  - 固定軸と現在値のバッジ。
  - 既存の範囲・刻みを継承。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 文言ID: `sliceValueLabel`、`sliceFixedAxisLabel`。

### S-05 断面の縦横の軸

- 目的: 平面内の色の方向を読み取る。
- 背景: メンタルモデルが曖昧な場合にも向きの手掛かりが必要。
- 重要度: P1。
- 開示区分: 常時・図に隣接。
- 内容:
  - 横軸名と左→右。
  - 縦軸名と下→上。
  - 軸に必要な単位。
  - 左右上下の数値目盛の追加は未確定。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `sliceAxisXLabel`、`sliceAxisYLabel`。

### S-06 選択色の高さへ移動

- 目的: 現在の選択色を参照するための入口を明確にする。
- 背景: 利用者が既存のボタンの継続を指定した。
- 重要度: P1。
- 開示区分: 常時・スライダーの近傍。
- 内容:
  - 既存ボタンと同じ表示名。
  - 高さは固定軸の値を意味する。
  - 選択色の複数保存や比較操作は含めない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `sliceMoveToSelectedColor`。

### S-07 スライスの表示設定入口

- 目的: 重ねる点の種類を必要なときに確認する。
- 背景: 頻繁に見る断面を低頻度の設定で埋めない。
- 重要度: P3。
- 開示区分: 入口のみ・詳細は開示。
- 内容:
  - 表示設定の要約ラベル。
  - 開閉マーカー。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `workbenchDisplayOptionsDisclosure`。

#### S-08 スライスの表示設定

- 目的: 写真の点と選択範囲の点を区別する。
- 背景: 断面にある色の面と写真由来の点は異なる情報。
- 重要度: P3。
- 開示区分: 設定を開いた範囲。
- 内容:
  - 写真の点。
  - 選択範囲の点。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。

##### S-09 写真の点を表示

- 目的: 写真全体のサンプルの位置を重ねる。
- 背景: すべての色の面と写真に含まれる色を区別する。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - チェックボックス。
  - 白色のサンプル点は既存描画の参考、固定デザイン色ではない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `workbenchShowWhiteMappingSlice`。

##### S-10 選択範囲の点を表示

- 目的: 写真内の対象のサンプルの位置を重ねる。
- 背景: 一部の領域を全体の分布から識別する。
- 重要度: P3。
- 開示区分: 表示設定内。
- 内容:
  - チェックボックス。
  - 選択範囲由来の点群。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/slice/slice-canvas.tsx`。
- 文言ID: `workbenchShowSelectedMappingSlice`。

## I-00 色の数値

- 目的: 色コードの参照・コピー・貼り付けを補助する。
- 背景: 利用者は細かな数値をあまり見ないが必要な機能。
- 重要度: P3。
- 開示区分: 補助領域。
- 内容:
  - 一時的なカーソル色。
  - 現在の選択色の数値。
  - 色の貼り付け。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `panelInspector`。

### I-01 色の数値を開く入口

- 目的: 必要なときに数値へ到達できるようにする。
- 背景: 主領域で詳細を常時展開しない。
- 重要度: P3。
- 開示区分: 入口と短い説明のみ。
- 内容:
  - 要約ラベルと開閉マーカー。
  - 色コードを確認・コピーするという説明。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `workbenchInspectorDisclosure`、`panelInspectorRequirements`。

#### I-02 カーソル位置の色

- 目的: 一時的な参照色を確定色と区別する。
- 背景: ホバーが選択色だと誤解されないようにする。
- 重要度: P3。
- 開示区分: 色の数値を開いた範囲。
- 内容:
  - 参照色の見出し。
  - 色の数値。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `inspectorPreview`、`inspectorHoverLabel`。

##### I-03 カーソル位置の値と色見本

- 目的: カーソル付近の色を具体的に示す。
- 背景: 図の位置だけでは色コードを読み取れない。
- 重要度: P3。
- 開示区分: カーソル色の詳細内。
- 内容:
  - 色見本。
  - HEX、rgb()、hsl()の表示値。
  - 対象がない場合の --。
  - コピー操作は既存にはない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 補助文言ID: `proposal.colorMissing`。

#### I-04 選択色の数値

- 目的: 現在の一色の数値を確認する。
- 背景: 別の色を保持する比較枠は設けない。
- 重要度: P3。
- 開示区分: 色の数値を開いた範囲。
- 内容:
  - 選択色ラベル。
  - 色見本。
  - 形式ごとの値とコピー。
  - 貼り付け。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `inspectorSelectedLabel`。

##### I-05 HEXの値とコピー

- 目的: 選択色をHEX形式で参照する。
- 背景: 外部ツールで色を扱う際に利用する。
- 重要度: P3。
- 開示区分: 選択色の詳細内。
- 内容:
  - 形式ラベル。
  - 値。
  - 値がない場合の --。
  - 形式を含むコピーの読み上げ名・title。
  - Copyアイコンはボタンの装飾。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 補助文言ID: `proposal.copyColorFormat`、`proposal.colorMissing`。
- 文言ID: `copyFormatHex`、`copyButton`。

##### I-06 rgb()の値とコピー

- 目的: 選択色をrgb()形式で参照する。
- 背景: 外部ツールで色を扱う際に利用する。
- 重要度: P3。
- 開示区分: 選択色の詳細内。
- 内容:
  - 形式ラベル。
  - 値。
  - 値がない場合の --。
  - 形式を含むコピーの読み上げ名・title。
  - Copyアイコンはボタンの装飾。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 補助文言ID: `proposal.copyColorFormat`、`proposal.colorMissing`。
- 文言ID: `copyFormatRgb`、`copyButton`。

##### I-07 hsl()の値とコピー

- 目的: 選択色をhsl()形式で参照する。
- 背景: 外部ツールで色を扱う際に利用する。
- 重要度: P3。
- 開示区分: 選択色の詳細内。
- 内容:
  - 形式ラベル。
  - 値。
  - 値がない場合の --。
  - 形式を含むコピーの読み上げ名・title。
  - Copyアイコンはボタンの装飾。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 補助文言ID: `proposal.copyColorFormat`、`proposal.colorMissing`。
- 文言ID: `copyFormatHsl`、`copyButton`。

##### I-08 色を貼り付ける

- 目的: 色コードを参照対象にする入口を示す。
- 背景: 画像の貼り付けとは対象が異なるため名前を分ける。
- 重要度: P3。
- 開示区分: 選択色の詳細内。
- 内容:
  - セクションラベル。
  - 色を貼り付けるボタン。
  - ClipboardPasteアイコン。
  - 対応形式の案内: HEX / rgb() / hsl()。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `inspectorPasteSection`、`copyPasteButton`、`inspectorPasteHint`。

## A-00 補助分析

- 目的: 写真全体の傾向と数値を必要なときに確認する。
- 背景: 主に個別の色を調べるが全体評価や外部AI相談にも使う。
- 重要度: P3。
- 開示区分: 主作業の下位・要求時。
- 内容:
  - 分析表。
  - 写真分析。
  - 既存のコピーと書式の入口。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。

### A-01 分析表の入口

- 目的: 全体の指標を探せるようにする。
- 背景: 低頻度を理由に既存の情報を消さない。
- 重要度: P3。
- 開示区分: 入口と短い説明のみ。
- 内容:
  - 分析表の見出し。
  - この表に含まれるものの説明。
  - 詳細の開示入口は配置設計の提案。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 補助文言ID: `proposal.metricsOpen`。
- 文言ID: `panelMetrics`、`panelMetricsRequirements`。

#### A-02 分析表の構造

- 目的: 各数値の意味を比較できるようにする。
- 背景: 専門用語だけの表では初見の理解が難しい。
- 重要度: P3。
- 開示区分: 分析表を開いた範囲。
- 内容:
  - 列: グループ／指標／値／説明。
  - 行は11指標。
  - 説明アイコンとツールチップ。
  - 数値は小数2桁、欠測値はN/A。
  - 単位は該当する値に含める、独立した単位列・キー列は現在の画面にない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 補助文言ID: `proposal.metricMissing`。
- 文言ID: `workbenchTableGroup`、`workbenchTableMetric`、`workbenchTableValue`、`workbenchTableDescription`、`workbenchMetricHelpLabel`。

##### A-M01 平均明度（L\*）

- 目的: 写真全体の平均明度（L\*）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: 明度。
  - 指標ラベル。
  - 値: 全サンプルのL\*平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupLightness`。
- 文言ID: `workbenchMetricLabelLMean`、`workbenchMetricDescriptionLMean`、`workbenchMetricTooltipLMean`。

##### A-M02 明度のばらつき（L\*）

- 目的: 写真全体の明度のばらつき（L\*）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: 明度。
  - 指標ラベル。
  - 値: L\*の標準偏差。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupLightness`。
- 文言ID: `workbenchMetricLabelLStddev`、`workbenchMetricDescriptionLStddev`、`workbenchMetricTooltipLStddev`。

##### A-M03 明度の95パーセンタイル（L\*）

- 目的: 写真全体の明度の95パーセンタイル（L\*）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: 明度。
  - 指標ラベル。
  - 値: L\*の95パーセンタイル。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupLightness`。
- 文言ID: `workbenchMetricLabelLP95`、`workbenchMetricDescriptionLP95`、`workbenchMetricTooltipLP95`。

##### A-M04 緑・赤の偏り（a\*平均）

- 目的: 写真全体の緑・赤の偏り（a\*平均）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: 色被り。
  - 指標ラベル。
  - 値: a\*の平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupColorBias`。
- 文言ID: `workbenchMetricLabelAMean`、`workbenchMetricDescriptionAMean`、`workbenchMetricTooltipAMean`。

##### A-M05 青・黄の偏り（b\*平均）

- 目的: 写真全体の青・黄の偏り（b\*平均）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: 色被り。
  - 指標ラベル。
  - 値: b\*の平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupColorBias`。
- 文言ID: `workbenchMetricLabelBMean`、`workbenchMetricDescriptionBMean`、`workbenchMetricTooltipBMean`。

##### A-M06 平均クロマ（C\*）

- 目的: 写真全体の平均クロマ（C\*）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: クロマ（既存の実装名: 彩度）。
  - 指標ラベル。
  - 値: sqrt(a\*²+b\*²)の平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupChroma`。
- 文言ID: `workbenchMetricLabelCMean`、`workbenchMetricDescriptionCMean`、`workbenchMetricTooltipCMean`。

##### A-M07 クロマの95パーセンタイル（C\*）

- 目的: 写真全体のクロマの95パーセンタイル（C\*）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: クロマ（既存の実装名: 彩度）。
  - 指標ラベル。
  - 値: C\*の95パーセンタイル。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupChroma`。
- 文言ID: `workbenchMetricLabelCP95`、`workbenchMetricDescriptionCP95`、`workbenchMetricTooltipCP95`。

##### A-M08 無彩色からの距離（平均）

- 目的: 写真全体の無彩色からの距離（平均）を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: 中立。
  - 指標ラベル。
  - 値: 現実装ではC\*平均と同じ値。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupNeutral`。
- 文言ID: `workbenchMetricLabelNeutralDistanceMean`、`workbenchMetricDescriptionNeutralDistanceMean`、`workbenchMetricTooltipNeutralDistanceMean`。

##### A-M09 ハイライトの緑・赤の偏り

- 目的: 写真全体のハイライトの緑・赤の偏りを確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: ハイライト（既存の実装名: 白）。
  - 指標ラベル。
  - 値: L\*>80のサンプルのa\*平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupHighlight`。
- 文言ID: `workbenchMetricLabelHighlightAMean`、`workbenchMetricDescriptionHighlightAMean`、`workbenchMetricTooltipHighlightAMean`。

##### A-M10 ハイライトの青・黄の偏り

- 目的: 写真全体のハイライトの青・黄の偏りを確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: ハイライト（既存の実装名: 白）。
  - 指標ラベル。
  - 値: L\*>80のサンプルのb\*平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupHighlight`。
- 文言ID: `workbenchMetricLabelHighlightBMean`、`workbenchMetricDescriptionHighlightBMean`、`workbenchMetricTooltipHighlightBMean`。

##### A-M11 ハイライトの無彩色からの距離

- 目的: 写真全体のハイライトの無彩色からの距離を確認する。
- 背景: 全体評価を個別の色位置の観察から補完する。
- 重要度: P3。
- 開示区分: 分析表内。
- 内容:
  - グループ: ハイライト（既存の実装名: 白）。
  - 指標ラベル。
  - 値: L\*>80のサンプルのC\*平均。
  - 短い説明。
  - 説明アイコンの読み上げ名と補足ツールチップ。
  - 算出対象は全サンプル、選択範囲だけの指標として扱わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 補助文言ID: `proposal.metricGroupHighlight`。
- 文言ID: `workbenchMetricLabelHighlightNeutralDistanceMean`、`workbenchMetricDescriptionHighlightNeutralDistanceMean`、`workbenchMetricTooltipHighlightNeutralDistanceMean`。

#### A-03 分析表のコピー操作

- 目的: 既存の数値の持ち出し入口を維持する。
- 背景: 外部AIなどへの相談で使われる。
- 重要度: P3。
- 開示区分: 分析表を開いた範囲。
- 内容:
  - 書式とコピー操作。
  - コピー対象・内容の再設計はスコープ外。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。

##### A-04 コピーの書式

- 目的: 既存の出力形式を選べるようにする。
- 背景: 既に開発されている機能を継続する。
- 重要度: P3。
- 開示区分: 分析表の操作内。
- 内容:
  - セレクトのラベル。
  - Markdown／CSV／TSVの選択肢。
  - 既存の初期形式Markdown。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 補助文言ID: `workbenchTableKey`、`workbenchTableUnit`、`graphAxisBin`、`graphAxisStart`、`graphAxisEnd`、`graphAxisRatio`。
- 文言ID: `workbenchCopyFormatWorkbenchLabel`、`workbenchExportMarkdown`、`workbenchExportCsv`、`workbenchExportTsv`。

##### A-05 分析表をコピーする

- 目的: 表の持ち出し操作を見つけられるようにする。
- 背景: 書式と実行の入口は別の情報。
- 重要度: P3。
- 開示区分: 分析表の操作内。
- 内容:
  - 表をコピーするボタン。
  - 内容の変更は行わない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-metrics-panel.tsx`。
- 補助文言ID: `workbenchTableKey`、`workbenchTableUnit`、`graphAxisBin`、`graphAxisStart`、`graphAxisEnd`、`graphAxisRatio`。
- 文言ID: `workbenchTableCopy`。

### A-06 写真分析の入口

- 目的: 分布と面積比に到達できるようにする。
- 背景: 全体像を確認する補助用途に必要。
- 重要度: P3。
- 開示区分: 入口と短い説明のみ。
- 内容:
  - 写真分析の見出し。
  - 分布と比率を確認できるという説明。
  - 詳細の開示入口は配置設計の提案。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 補助文言ID: `proposal.analysisOpen`。
- 文言ID: `panelPhotoAnalysis`、`panelPhotoAnalysisRequirements`。

#### A-07 全体の色の傾向

- 目的: 既存の要約情報を短く読めるようにする。
- 背景: 利用者が全体のバランスを確認するときに補助する。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - 色相バランス。
  - 彩度傾向。
  - 現実装のルールによる要約、現像提案やAIの評価ではない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `photoInsightTitle`。

##### A-08 色相バランス

- 目的: 色相分布の偏りの要約を示す。
- 背景: 全体の色の広がりを読む入口になる。
- 重要度: P3。
- 開示区分: 全体の色の傾向内。
- 内容:
  - 動的ラベル。
  - 分類: 多様／やや偏り／偏りが強い。
  - 分類閾値の再設計は含めない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 文言ID: `photoInsightHue`、`photoInsightHueBalanced`、`photoInsightHueModerate`、`photoInsightHueNarrow`。

##### A-09 彩度傾向

- 目的: 彩度分布の要約を示す。
- 背景: 低彩度と高彩度の比重を確認する補助。
- 重要度: P3。
- 開示区分: 全体の色の傾向内。
- 内容:
  - 動的ラベル。
  - 分類: 高彩度寄り／中間／低彩度寄り。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/features/workbench/workbench-shared.ts`。
- 文言ID: `photoInsightSaturation`、`photoInsightSatHigh`、`photoInsightSatMid`、`photoInsightSatLow`。

#### A-10 色面積比

- 目的: 代表的な色の割合を確認する。
- 背景: 位置の観察から写真全体の割合へ補足する。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - 見出し。
  - 繰り返し表示される色の行。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `photoColorAreaRatio`。

##### A-11 色面積比の各行

- 目的: 色と比率を一組で識別する。
- 背景: 色見本のみでは値の意味を読み取れない。
- 重要度: P3。
- 開示区分: 色面積比内。
- 内容:
  - 色見本。
  - 量子化された代表色のラベル。
  - 割合: 小数1桁の%。
  - 上位5色と必要な場合のその他。
  - その他の色見本は分類の代表で写真の一色とは限らない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`、`web/src/domain/photo-analysis/shared/photo-analysis-constants.ts`。
- 文言ID: `photoOthers`。

#### A-12 明度ヒストグラム

- 目的: 写真全体の明度ヒストグラムを確認する。
- 背景: 全体評価やデータ相談の補助に必要。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - 見出し。
  - 棒グラフと軸。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `workbenchHistogramCardTitle`。

##### A-12-G 棒グラフと軸

- 目的: 分布のどこにサンプルが多いか読む。
- 背景: 棒の高さと対象の軸を同時に示す必要がある。
- 重要度: P3。
- 開示区分: 明度ヒストグラム内。
- 内容:
  - 横軸: CIELAB明度L\* 0〜100。
  - 縦軸: サンプル数。
  - 各棒: 区間の開始／終了／件数。
  - 各棒のtitleは区間と件数。
  - 背景と枠はグラフの構成要素、独立した情報ではない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 補助文言ID: `proposal.histogramBar`。
- 文言ID: `graphAxisLuminance`、`graphAxisCount`。

#### A-14 色相ヒストグラム

- 目的: 写真全体の色相ヒストグラムを確認する。
- 背景: 全体評価やデータ相談の補助に必要。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - 見出し。
  - 棒グラフと軸。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `photoHueHistogram`。

##### A-14-G 棒グラフと軸

- 目的: 分布のどこにサンプルが多いか読む。
- 背景: 棒の高さと対象の軸を同時に示す必要がある。
- 重要度: P3。
- 開示区分: 色相ヒストグラム内。
- 内容:
  - 横軸: 色相H 0〜360°。
  - 縦軸: サンプル数。
  - 各棒: 区間の開始／終了／件数。
  - 各棒のtitleは区間と件数。
  - 背景と枠はグラフの構成要素、独立した情報ではない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 補助文言ID: `proposal.histogramBar`。
- 文言ID: `graphAxisHue`、`graphAxisCount`。

#### A-16 彩度ヒストグラム

- 目的: 写真全体の彩度ヒストグラムを確認する。
- 背景: 全体評価やデータ相談の補助に必要。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - 見出し。
  - 棒グラフと軸。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `photoSaturationHistogram`。

##### A-16-G 棒グラフと軸

- 目的: 分布のどこにサンプルが多いか読む。
- 背景: 棒の高さと対象の軸を同時に示す必要がある。
- 重要度: P3。
- 開示区分: 彩度ヒストグラム内。
- 内容:
  - 横軸: HSL彩度S 0〜100%。
  - 縦軸: サンプル数。
  - 各棒: 区間の開始／終了／件数。
  - 各棒のtitleは区間と件数。
  - 背景と枠はグラフの構成要素、独立した情報ではない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-histogram-chart.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 補助文言ID: `proposal.histogramBar`。
- 文言ID: `graphAxisSaturation`、`graphAxisCount`。

#### A-18 Lab a\*-b\*散布図

- 目的: 写真の色の分布を二次元で補足する。
- 背景: Labを既定にしなくても既存の専門的な分析は残す。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - 見出し。
  - 散布図。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `photoLabScatter`。

##### A-19 散布図の点と軸

- 目的: 緑・赤と青・黄の偏りを読む。
- 背景: 輝度やHSLの彩度の図と区別する必要がある。
- 重要度: P3。
- 開示区分: 散布図内。
- 内容:
  - 横軸a\*、縦軸b\*。
  - 写真の各サンプルに対応する色付きの点。
  - 既存の範囲: -128〜128の投影。
  - SVGの背景矩形は図の構成要素。
  - 図の読み上げ名は現実装で不足、後続実装の補完対象。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 補助文言ID: `proposal.scatterAria`。
- 文言ID: `graphAxisLabA`、`graphAxisLabB`。

#### A-20 ヒストグラムのコピー

- 目的: 既存の分布データの持ち出し入口を維持する。
- 背景: 外部で全体評価するときに必要。
- 重要度: P3。
- 開示区分: 写真分析を開いた範囲。
- 内容:
  - コピー操作。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。

##### A-21 ヒストグラムをコピーする

- 目的: 分布データのコピー操作を見つけられるようにする。
- 背景: コピー内容・対象の設計は今回の範囲外。
- 重要度: P3。
- 開示区分: 写真分析の操作内。
- 内容:
  - 既存ボタン。
  - 書式の既存選択はA-04、内容は既存仕様を継承。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-analysis-panel.tsx`。
- 補助文言ID: `workbenchTableKey`、`workbenchTableUnit`、`graphAxisBin`、`graphAxisStart`、`graphAxisEnd`、`graphAxisRatio`。
- 文言ID: `workbenchHistogramCopy`。

## F-00 案内と結果の文言

- 目的: 現在の操作に必要な短い情報を示す。
- 背景: 低頻度の情報でも必要な瞬間の重要度は高い。
- 重要度: P1。
- 開示区分: 該当箇所の近傍・文脈に応じて表示。
- 内容:
  - 空欄の案内。
  - 入力の問題。
  - コピー・貼り付け結果。
  - 読み上げ通知。
  - 遷移条件・保持規則・イベントはここでは定義しない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`、`web/src/features/inspector/color-inspector.tsx`。

### F-01 画像がないときの案内

- 目的: 画像入力が必要なことを伝える。
- 背景: 空の図や補助分析から何をするか分かる必要がある。
- 重要度: P1。
- 開示区分: 該当領域内。
- 内容:
  - 写真の空欄に付随する案内。
  - 写真分析の空欄の案内。
  - 共通の空欄文言、領域ごとに不要な繰り返しは配置レビューで調整。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/workbench-analysis-panel.tsx`。
- 文言ID: `photoPreviewEmpty`。

### F-02 画像処理の案内

- 目的: 処理中や初回入力の問題を理解できるようにする。
- 背景: 何も表示されない原因を読むための情報。
- 重要度: P1。
- 開示区分: 画像入力の近傍・設定詳細に隠さない。
- 内容:
  - 分析中の短い文言。
  - 初回の画像読み取り・分析エラーの文言。
  - 画像差し替え失敗の追加表示は今回の定義に含めない。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `photoAnalyzing`、`photoError`。

### F-03 画像貼り付けの案内

- 目的: 画像を取り込めない原因と別の入口を伝える。
- 背景: ブラウザやクリップボードに画像がない場合にも理解できる必要がある。
- 重要度: P1。
- 開示区分: 入力欄の近傍。
- 内容:
  - クリップボードに画像がない案内。
  - 画像を選ぶ入口の案内。
  - 画像貼り付け完了の文言。
  - role=statusによる通知。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `photoPasteNoImage`、`photoPasteChooseRecovery`、`photoPasteApplied`。

### F-04 色のコピー・貼り付けの結果

- 目的: 値を取り出せたか読み取れたかを伝える。
- 背景: 作業結果は対象の色と結びついていなければ理解しにくい。
- 重要度: P1。
- 開示区分: 色の操作の近傍。
- 内容:
  - コピー完了・失敗と対象値。
  - 色の貼り付け完了と値。
  - 対応しない色形式と値。
  - クリップボード読取失敗。
  - 選択色がない案内。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/inspector/color-inspector.tsx`。
- 文言ID: `copyCopied`、`copyFailed`、`copyPasteApplied`、`copyPasteUnsupported`、`copyPasteFailed`、`copyNeedSelection`。

### F-05 選択と分析コピーの短い通知

- 目的: 操作結果を支援技術でも認識できるようにする。
- 背景: 図だけでの強調では読み上げに伝わらない。
- 重要度: P1。
- 開示区分: 関連操作の近傍・読み上げ。
- 内容:
  - 選択範囲の通知。
  - 選択色の通知と値。
  - 分析表・ヒストグラムのコピー完了と形式。
  - aria-live=politeの短いメッセージ。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/features/workbench/color-workbench.tsx`。
- 文言ID: `workbenchSelectionUpdated`、`workbenchSelectedColorUpdated`、`workbenchMetricTableCopied`、`workbenchHistogramCopied`。

### F-06 通知容器

- 目的: 短い結果の文言を共通の様式で識別する。
- 背景: 同じ文言がインライン・トースト・ライブ領域に存在する。
- 重要度: P2。
- 開示区分: 文脈に応じて表示。
- 内容:
  - 既存Sonnerの成功／エラーの短い通知と標準の識別アイコン。
  - 短いメッセージ本文。
  - アイコンは意味の補助、文字を省略しない。
  - 通知経路の重複整理は後続のUI設計で扱う。
- 根拠区分: 既存要素・配置と開示の設計案。
- 参照元: `web/src/components/ui/sonner.tsx`、`web/src/app/layout.tsx`。

## X-00 APIの分析確認画面

- 目的: 既存APIの入力と結果を確認できるようにする。
- 背景: 主作業とは用途が異なるが既存画面の要素を棚卸しから除外しない。
- 重要度: P3。
- 開示区分: 別画面 /analyze。
- 内容:
  - この画面内では入力・結果が主情報。
  - 主作業画面の常時要素には統合しない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。

### X-01 API画面の題名と説明

- 目的: APIを試すための画面であることを伝える。
- 背景: 通常の写真の色探索と混同しないようにする。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - eyebrow Analyze。
  - h1 AI agent image analysis。
  - raw-body APIへの画像入力とJSON結果の説明。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-page.tsx`。
- 補助文言ID: `api.eyebrow`、`api.title`、`api.description`。

### X-02 入力の見出しと対応形式

- 目的: 解析する画像を指定する。
- 背景: 既存APIを手動で試す入口。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Inputの見出し。
  - 対応形式一覧: image/jpeg、image/png、image/webp。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 補助文言ID: `api.input`、`api.supportedTypes`。

### X-02-F API確認用の画像入力

- 目的: APIへ渡す画像を選ぶ。
- 背景: 主画面とは別の画像入力の入口が既存にある。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - ファイル選択入力。
  - accept: image/jpeg,image/png,image/webp。
  - ネイティブ入力のボタン文言はブラウザの言語に依存。
  - 読み上げ用の入力名の追加は後続の補完対象。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 補助文言ID: `api.fileInput`。

### X-02-S API分析の実行ボタン

- 目的: 画像の分析操作を識別する。
- 背景: この確認画面は明示的な実行ボタンがある。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Analyze image。
  - Analyzing...の短い処理表示。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 補助文言ID: `api.submit`、`api.submitting`。

### X-02-I API確認用の写真プレビュー

- 目的: APIへ渡す対象画像を確認する。
- 背景: 異なる画像でAPIを試すため対象の識別が必要。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - 画像本体。
  - 代替テキスト: ファイル名／Uploaded preview。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-input-card.tsx`。
- 補助文言ID: `api.previewAlt`、`api.previewFallback`。

### X-03 結果カードの文脈

- 目的: 結果の概要を識別する。
- 背景: APIの確認では構造化された値の参照が中心。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Response summaryの見出し。
  - No analysis result yet.の案内。
  - エラーコード。
  - エラーメッセージ。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 補助文言ID: `api.resultHeading`、`api.resultEmpty`、`api.error.IMAGE_DECODE_FAILED_DIMENSIONS`、`api.error.PIXEL_COUNT_EXCEEDED`、`api.error.ANALYSIS_TIMEOUT`、`api.error.RATE_CHECK_FAILED`、`api.error.UNSUPPORTED_CONTENT_TYPE`、`api.error.EMPTY_IMAGE`、`api.error.PAYLOAD_TOO_LARGE`、`api.error.IMAGE_DECODE_FAILED_BYTES`、`api.error.INTERNAL_ERROR`、`api.error.RATE_LIMITED`、`api.error.REQUEST_FAILED`。

### X-04 画像の大きさ

- 目的: 入力の縦横を確認する。
- 背景: APIの画像読み取りを確認する基礎情報。
- 重要度: P1。
- 開示区分: 結果カード内。
- 内容:
  - Size。
  - width × height、単位px。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 補助文言ID: `api.size`。

### X-05 画像の色空間

- 目的: APIが扱った色空間を確認する。
- 背景: 主画面の表示色空間RGB/HSL/Labと混同しない。
- 重要度: P1。
- 開示区分: 結果カード内。
- 内容:
  - Color space。
  - input.colorSpace。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 補助文言ID: `api.colorSpace`。

### X-06 明るさの平均

- 目的: APIの全体の要約値を確認する。
- 背景: 主画面のLab指標とは算出方法が異なる。
- 重要度: P1。
- 開示区分: 結果カード内。
- 内容:
  - Brightness: avgBrightness。
  - brightnessは各画素のRGB平均から得る0〜100の値、Lab L\*ではない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 補助文言ID: `api.brightness`。

### X-06-S 彩度の平均

- 目的: APIの写真全体の彩度を確認する。
- 背景: Labのクロマとは異なる全体の要約値。
- 重要度: P1。
- 開示区分: 結果カード内。
- 内容:
  - Saturation: avgSaturation。
  - HSLの彩度の平均を0〜100で表示。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 補助文言ID: `api.saturation`。

### X-07 説明文

- 目的: 画像全体の色の特徴を文章で確認する。
- 背景: 数値だけではAPI結果の読み取りが難しい。
- 重要度: P1。
- 開示区分: 結果カード内。
- 内容:
  - Description。
  - summary.descriptionの動的な本文。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。
- 補助文言ID: `api.summaryDescription`。

### X-08 主要色の各項目

- 目的: 代表色と割合を一緒に読む。
- 背景: 色見本単独では比率を理解できない。
- 重要度: P1。
- 開示区分: 結果カード内。
- 内容:
  - 色見本のSVG。
  - HEX値。
  - ratioを%にした小数1桁の値。
  - 繰り返し項目の同じ構成。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-result-card.tsx`。

### X-09 可視化の説明

- 目的: APIの分析が何を表しているか読む。
- 背景: 図がなくても結果の用途を説明できるようにする。
- 重要度: P2。
- 開示区分: この画面の結果の下位。
- 内容:
  - Visualization explanationsの見出し。
  - 説明項目の見出し・説明・所見。
  - この補助画面は既存の展開表示を継承し、無条件に折りたたまない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`。
- 補助文言ID: `api.explanations`。

### X-10 説明の各項目

- 目的: 同じ型の説明と所見を比較できるようにする。
- 背景: 動的項目も漏れなく定義する。
- 重要度: P2。
- 開示区分: 可視化の説明内。
- 内容:
  - summary: 解析サマリー、主要色と統計値の説明、画像全体の所見。
  - rgb-cube: RGB Cube 分布、RGB内の分布密度の説明、主要量子化色の所見。
  - hue-histogram: Hue Histogram、色相の偏りの説明、有効区間数の所見。
  - idとcolorSpaceとaxesは現在の説明カードに直接表示しない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/agent-api/agent-analyze-explanations.tsx`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 補助文言ID: `api.explanationSummary`、`api.explanationSummaryDescription`、`api.explanationCube`、`api.explanationCubeDescription`、`api.explanationCubeFindings`、`api.explanationCubeEmpty`、`api.explanationHue`、`api.explanationHueDescription`、`api.explanationHueFindings`。

## D-00 APIの説明画面

- 目的: 既存APIの使い方を参照する。
- 背景: 通常の探索とは別の技術情報。
- 重要度: P3。
- 開示区分: 別画面 /docs/agent-api。
- 内容:
  - この画面内では仕様情報が主情報。
  - サーバーの値は参照コミット時点の値。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。

### D-01 APIの題名と説明

- 目的: 公開APIの役割と入力出力を伝える。
- 背景: APIを利用する前提を読む。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Agent API。
  - raw image bytesとstructured JSONの説明。
  - 呼び出し元IPによるVercel Rate Limitingの説明。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 補助文言ID: `docs.title`、`docs.intro`。

### D-02 エンドポイント

- 目的: 利用するURLとメソッドを示す。
- 背景: API利用の中心情報。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Endpoint。
  - POST /api/analyze。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 補助文言ID: `docs.endpoint`、`docs.endpointValue`。

### D-03 リクエストの条件

- 目的: 対応する入力と上限を確認する。
- 背景: APIへ渡せる写真を事前に判断する。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Request。
  - Content-Type: image/jpeg、image/png、image/webp。
  - Maximum body size: 4,000,000 bytes。
  - Maximum pixel count: 12,000,000。
  - 値はサーバーの設定を正本とする。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 補助文言ID: `docs.request`、`docs.types`、`docs.bodySize`、`docs.pixels`。

### D-04 リクエストの例

- 目的: 送信の具体的な形式を確認する。
- 背景: 文章だけでは引数が分かりにくい。
- 重要度: P2。
- 開示区分: リクエスト条件の下に表示。
- 内容:
  - curlの表示例。
  - POSTメソッド。
  - $BASE_URL/api/analyze。
  - Content-Type: image/jpeg。
  - Accept: application/json。
  - 画像バイナリ: @photo.jpg。
  - このMarkdownでは例の構成を箇条書きで定義、コードブロックは使わない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 補助文言ID: `docs.request`。

### D-05 レスポンスの説明

- 目的: 成功時に含まれる項目を把握する。
- 背景: 構造化された返却情報を利用するための前提。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Response。
  - 200 OK。
  - input／summary／analysis／visualization／explanationsの説明。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 補助文言ID: `docs.response`、`docs.responseDescription`。

### D-06 レスポンスの例

- 目的: 表示されるJSONの具体例を確認する。
- 背景: コード例も情報として棚卸しに含める。
- 重要度: P2。
- 開示区分: レスポンス説明の下に表示。
- 内容:
  - input: mimeType、width、height、pixelCount、colorSpace。
  - summary.dominantColors[]: hex、ratio、rgb.r/g/b。
  - summary: avgBrightness、avgSaturation、description。
  - 例に実際にある項目のみを定義し、完全なAPI契約の代用とはしない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 補助文言ID: `docs.response`。

### D-07 エラーコードの説明

- 目的: 入力できない原因や制限を確認する。
- 背景: APIの問題をコードから読み取る必要がある。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Error codes。
  - 400: unsupported content type。
  - 413: payload too large。
  - 422: decode failure or pixel limit exceeded。
  - 429: rate limited。
  - 408: analysis timeout。
  - 既存説明に500の記載はない。追加はAPI仕様変更時の検討対象。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`。
- 補助文言ID: `docs.errors`、`docs.error400`、`docs.error413`、`docs.error422`、`docs.error429`、`docs.error408`。

### D-08 アクセス回数の制限

- 目的: 連続利用の上限を確認する。
- 背景: 公開APIの利用条件である。
- 重要度: P1。
- 開示区分: この画面内では常時。
- 内容:
  - Rate limiting。
  - IPあたり1分10リクエスト。
  - 初回公開時の制限方針の説明。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/docs/agent-api/page.tsx`、`web/src/lib/agent-analyze.ts`。
- 補助文言ID: `docs.rate`、`docs.ratePolicy`。

## R-00 APIのHTML結果

- 目的: 既存APIが返す文章形式の結果を読む。
- 背景: API確認ページ以外にもHTMLの可視出力がある。
- 重要度: P3。
- 開示区分: POST /api/analyzeのtext/html出力。
- 内容:
  - 静的なHTMLの結果。
  - 対話用の新しい操作は追加しない。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/lib/agent-analyze.ts`。

### R-01 結果の題名

- 目的: どの分析結果の文章か識別する。
- 背景: 単独で開かれるHTMLの文脈に必要。
- 重要度: P1。
- 開示区分: HTML結果内では常時。
- 内容:
  - IroMap image analysis result。
  - Analysis summary。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 補助文言ID: `html.title`、`html.summary`。

### R-02 解析概要の項目

- 目的: 入力と全体の特徴を確認する。
- 背景: APIの結果の最低限の文脈を表示する。
- 重要度: P1。
- 開示区分: HTML結果内では常時。
- 内容:
  - Image size: width × height。
  - Color space: input.colorSpace。
  - Dominant colors: HEX値の列。
  - Average brightness: avgBrightness。
  - Average saturation: avgSaturation。
  - Description: summary.description。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/lib/agent-analyze.ts`。
- 補助文言ID: `html.imageSize`、`html.colorSpace`、`html.dominantColors`、`html.avgBrightness`、`html.avgSaturation`、`html.description`。

### R-03 分析の説明と所見

- 目的: 可視化の意味を文章で読む。
- 背景: HTML結果には実際の操作可能な3D図を描いていない。
- 重要度: P2。
- 開示区分: HTML結果内では常時。
- 内容:
  - X-10と同じ3説明項目。
  - 各項目のtitle、description、findings。
  - 見出しと二つの文章。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/lib/agent-analyze.ts`、`web/src/domain/photo-analysis/agent-api-presentation.ts`。
- 補助文言ID: `api.explanationSummary`、`api.explanationSummaryDescription`、`api.explanationCube`、`api.explanationCubeDescription`、`api.explanationCubeFindings`、`api.explanationCubeEmpty`、`api.explanationHue`、`api.explanationHueDescription`、`api.explanationHueFindings`。

## B-00 表示を支える共通要素

- 目的: 内容の識別と読み取りを支える。
- 背景: 操作や情報に付随する要素も棚卸しする。
- 重要度: P2。
- 開示区分: 用途に付随する表示。
- 内容:
  - 読み上げ名。
  - 図の枠。
  - アイコン。
  - ブラウザタブ名。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/layout.tsx`。

### B-01 読み上げとフォーカスの情報

- 目的: 視覚表示に頼らず対象を識別する。
- 背景: キャンバス・アイコン操作・通知の意味が必要。
- 重要度: P1。
- 開示区分: 画面に常時並べない・支援技術向け。
- 内容:
  - 各要素のaria-label／title／sr-only。
  - 通知のrole=statusとaria-live。
  - フォーカス枠は対象の識別に付随。
  - 読み上げ文言はui-copy.mdの同じ要素に集約。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/features/rgb-cube/rgb-cube-canvas.tsx`、`web/src/features/slice/slice-canvas.tsx`、`web/src/features/inspector/color-inspector.tsx`、`web/src/features/workbench/workbench-preview-panel.tsx`、`web/src/components/theme-toggle.tsx`。

### B-02 図と情報の容器

- 目的: 見出しと内容の対応を識別する。
- 背景: 枠の装飾を情報の重要度と混同しない。
- 重要度: P2。
- 開示区分: 内容に付随する表示。
- 内容:
  - PanelHeader: 見出しと一文の説明。
  - GraphFrame: 横軸・縦軸・描画領域。
  - PersistedDisclosure: 要約名・開閉マーカー・詳細容器。
  - ColorSwatch: 色と枠、空欄用の色見本。
  - Tabs: 選択肢のラベルと選択の識別。
  - Checkbox: 項目ラベルとチェックの識別。
  - InfoTooltip: 説明を示すアイコン、読み上げ名、補足文章。
  - 罫線・背景・余白・アイコンの色は後続デザインシステムで定義。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/components/workbench/panel-header.tsx`、`web/src/components/graph/graph-frame.tsx`、`web/src/components/workbench/persisted-disclosure.tsx`、`web/src/components/workbench/color-swatch.tsx`、`web/src/components/workbench/info-tooltip.tsx`。

### B-03 ブラウザタブの名前と説明

- 目的: 画面外でも製品を識別する。
- 背景: タブの切り替えや共有の文脈で必要。
- 重要度: P2。
- 開示区分: ブラウザとメタデータ。
- 内容:
  - title: IroMap | Photo Color Analyzer。
  - description: Understand the color structure of your photos。
  - 現行の共通メタデータを基準。
- 根拠区分: 既存要素・補助画面として継承。
- 参照元: `web/src/app/layout.tsx`。
- 補助文言ID: `metadata.title`、`metadata.description`。
