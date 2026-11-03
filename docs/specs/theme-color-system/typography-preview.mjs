export function withTypographyPreview(html) {
  const toolbar =
    '<section class="type-toolbar" aria-labelledby="type-review-title"><h2 id="type-review-title">文字の見本 · Noto Sans JP / 本文字間0.04emを採用</h2><p>採用した書体と本文字間で表示します。比較用の切り替えは採用仕様を変更しません。</p><div class="type-settings"><label>書体 <select id="font-choice"><option value="zen">B · Zen Kaku Gothic New</option><option value="noto" selected>A · Noto Sans JP</option><option value="serif">C · 見出しだけNoto Serif JP</option></select></label><label>説明文の字間 <select id="tracking-choice"><option value="0.02em">0.02em</option><option value="0em">0em</option><option value="0.04em" selected>0.04em</option></select></label></div><p id="font-status" role="status">比較用フォントを読み込んでいます。読み込み完了まで代替書体が表示されます。</p></section>';
  const specimen =
    '<section class="panel type-specimen"><h3>文字と数値</h3><p class="type-copy">写真の気になる色を選び、3Dと断面で色の位置を確認します。</p><div class="type-spacing"><p style="letter-spacing:0em"><small>字間 0em</small>選択色の高さへ移動</p><p style="letter-spacing:0.02em"><small>字間 0.02em</small>選択色の高さへ移動</p><p style="letter-spacing:0.04em"><small>字間 0.04em</small>選択色の高さへ移動</p></div><p class="type-numbers"><span>色コードと値</span> <code>#F6EFF0 · RGB 246, 239, 240</code><br><code>−12.50　0.00　100.00　48.2%</code><br><code>0 O　1 I l　HSL　Lab　360°</code></p></section>';
  html = html.replace(
    '<main class="compare">',
    toolbar + '<main class="compare">',
  );
  html = html.replaceAll(
    '<section class="panel"><h3>色の観察面</h3>',
    specimen + '<section class="panel"><h3>色の観察面</h3>',
  );
  const css =
    '<style>:root{--preview-ui-font:"Noto Sans JP";--preview-title-font:"Noto Sans JP";--preview-tracking:0.04em}.type-toolbar{max-width:1336px;margin:0 auto 24px;padding:20px;background:#FAFAFA;color:#282828;border:1px solid #B7B7B7;border-radius:8px}.type-toolbar h2{font-size:18px;margin:0 0 8px}.type-toolbar p{font-size:14px;margin:8px 0}.type-settings{display:flex;gap:16px;flex-wrap:wrap}.type-settings label{display:flex;gap:8px;align-items:center}.type-settings select{font:inherit;max-width:100%;padding:8px;background:#FFF;color:#282828;border:1px solid #747474;border-radius:4px}.sheet{font-family:var(--preview-ui-font),"Yu Gothic",sans-serif}.sheet h2,.sheet h3{font-family:var(--preview-title-font),"Yu Gothic",sans-serif}.sheet p:not(.eyebrow):not(.reference){letter-spacing:var(--preview-tracking)}.sheet code{font-family:"Geist Mono",ui-monospace,monospace;letter-spacing:0;font-variant-numeric:tabular-nums}.type-copy{font-size:16px;line-height:1.75;font-weight:400}.type-spacing p{font-size:16px;line-height:1.75}.type-spacing small{display:inline-block;min-width:110px;font-family:system-ui,sans-serif;font-size:12px;color:var(--text-secondary);letter-spacing:0;margin-right:8px}.type-numbers{line-height:1.8}.type-numbers span{font-size:14px}.type-numbers code{font-size:14px}.sheet h3{font-size:18px;line-height:1.5;font-weight:700;letter-spacing:0.02em}.sheet .sample{font-weight:500;letter-spacing:0}.sheet .roles h3{font-size:14px}.sheet .accent-note{font-weight:400}@media(max-width:1399px){.type-toolbar{margin-left:32px;margin-right:32px}}@media(max-width:850px){.type-toolbar{margin-left:16px;margin-right:16px}.type-settings{display:block}.type-settings label{margin:12px 0;flex-wrap:wrap}.type-settings select{font-size:14px}.type-spacing small{min-width:90px}}</style>';
  // Use only the characters shown in this static review page to keep the font comparison small.
  const visible = html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "");
  const text = [
    ...new Set(
      Array.from(
        visible + "フォントの読み込みが完了しました取得できません代替書体",
      ),
    ),
  ]
    .sort()
    .join("");
  const fontUrl =
    "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap&text=" +
    encodeURIComponent(text);
  const script = [
    "<script>",
    'const choices={zen:["Zen Kaku Gothic New","Zen Kaku Gothic New"],noto:["Noto Sans JP","Noto Sans JP"],serif:["Noto Sans JP","Noto Serif JP"]};',
    'const fontChoice=document.getElementById("font-choice");const trackingChoice=document.getElementById("tracking-choice");const fontStatus=document.getElementById("font-status");',
    'let fontRevision=0;async function chooseFont(){const revision=++fontRevision;const [ui,title]=choices[fontChoice.value];document.documentElement.style.setProperty("--preview-ui-font",JSON.stringify(ui));document.documentElement.style.setProperty("--preview-title-font",JSON.stringify(title));fontStatus.textContent="比較用フォントを読み込んでいます。読み込み完了まで代替書体が表示されます。";try{const requests=[[ui,400],[ui,500],[title,700],["Geist Mono",400]];const results=await Promise.all(requests.map(([name,weight])=>document.fonts.load(weight+" 16px "+JSON.stringify(name),name==="Geist Mono"?"0123456789":"選択色の高さへ移動")));if(revision!==fontRevision)return;if(results.some(faces=>faces.length===0))throw Error("missing font");fontStatus.textContent="フォントの読み込みが完了しました。";}catch(error){if(revision===fontRevision)fontStatus.textContent="フォントを取得できません。代替書体で表示中です。書体の違いは確認できません。";}}',
    'fontChoice.addEventListener("change",chooseFont);trackingChoice.addEventListener("change",()=>document.documentElement.style.setProperty("--preview-tracking",trackingChoice.value));chooseFont();',
    "</script>",
  ].join("\n");
  return html
    .replace(
      "</head>",
      '<link rel="stylesheet" href="' +
        fontUrl.replaceAll("&", "&amp;") +
        '">' +
        css +
        "</head>",
    )
    .replace("</body>", script + "</body>");
}
