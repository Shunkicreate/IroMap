import { ColorWorkbench } from "@/features/workbench/color-workbench";

export default function Home() {
  return (
    <main className="landingPage">
      <section className="landingHero">
        <p className="landingEyebrow">Photo Color Analyzer</p>
        <h1>IroMap</h1>
        <p className="landingLead">写真の色構造を、1ページで可視化・診断する。</p>
        <a href="#workbench-preview" className="landingCta">
          ワークベンチを試す
        </a>
      </section>

      <section id="workbench-preview" className="landingSection">
        <header className="landingSectionHeader">
          <h2>Workbench Preview</h2>
          <p>RGBキューブ、スライス、分析パネルを同一画面で操作できます。</p>
        </header>
        <ColorWorkbench />
      </section>

      <section className="landingSection">
        <header className="landingSectionHeader">
          <h2>Feature Cards</h2>
        </header>
        <div className="featureCards">
          <article className="featureCard">
            <h3>3D Color Space</h3>
            <p>RGB / HSL / Lab を切り替えながら色分布を立体的に探索。</p>
          </article>
          <article className="featureCard">
            <h3>Slice + Inspector</h3>
            <p>断面表示と数値インスペクタで、色の位置と値を同時確認。</p>
          </article>
          <article className="featureCard">
            <h3>Photo Analysis</h3>
            <p>Lab散布図・ヒストグラム・面積比で写真全体の傾向を要約。</p>
          </article>
        </div>
      </section>

      <section className="landingSection">
        <header className="landingSectionHeader">
          <h2>Docs</h2>
          <p>仕様・設計・開発ルールは docs に集約しています。</p>
        </header>
        <a
          href="https://github.com/Shunkicreate/IroMap/tree/main/docs"
          target="_blank"
          rel="noreferrer"
          className="landingDocsLink"
        >
          ドキュメントを見る
        </a>
      </section>
    </main>
  );
}
