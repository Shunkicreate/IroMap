import { getAnalyzeLimits } from "@/lib/agent-analyze";
import styles from "@/features/agent-api/agent-analyze-page.module.css";

const requestExample = `curl -X POST \\
  "$BASE_URL/api/analyze" \\
  -H "Content-Type: image/jpeg" \\
  -H "Accept: application/json" \\
  --data-binary "@photo.jpg"`;

const responseExample = `{
  "input": {
    "mimeType": "image/jpeg",
    "width": 3000,
    "height": 4000,
    "pixelCount": 12000000,
    "colorSpace": "sRGB"
  },
  "summary": {
    "dominantColors": [
      { "hex": "#D9C7A1", "ratio": 0.34, "rgb": { "r": 217, "g": 199, "b": 161 } }
    ],
    "avgBrightness": 62.4,
    "avgSaturation": 31.8,
    "description": "低から中彩度の暖色が優勢で、暗部に寒色が残る"
  }
}`;

export default function AgentApiDocsPage() {
  const limits = getAnalyzeLimits();

  return (
    <main className={styles.docsPage}>
      <h1>Agent API</h1>
      <p>
        The API accepts raw image bytes and returns structured JSON. This endpoint is public and
        currently guarded by Vercel Rate Limiting on the caller IP.
      </p>

      <section>
        <h2>Endpoint</h2>
        <p>
          <code>POST /api/analyze</code>
        </p>
      </section>

      <section>
        <h2>Request</h2>
        <ul>
          <li>
            Supported <code>Content-Type</code>: <code>image/jpeg</code>, <code>image/png</code>,{" "}
            <code>image/webp</code>
          </li>
          <li>
            Maximum body size: <code>{limits.maxBodyBytes.toLocaleString()} bytes</code>
          </li>
          <li>
            Maximum pixel count: <code>{limits.maxPixels.toLocaleString()}</code>
          </li>
        </ul>
        <pre className={styles.docsPre}>{requestExample}</pre>
      </section>

      <section>
        <h2>Response</h2>
        <p>
          Successful responses return <code>200 OK</code> with JSON containing <code>input</code>,{" "}
          <code>summary</code>, <code>analysis</code>, <code>visualization</code>, and{" "}
          <code>explanations</code>.
        </p>
        <pre className={styles.docsPre}>{responseExample}</pre>
      </section>

      <section>
        <h2>Error codes</h2>
        <ul>
          <li>
            <code>400</code> unsupported content type
          </li>
          <li>
            <code>413</code> payload too large
          </li>
          <li>
            <code>422</code> decode failure or pixel limit exceeded
          </li>
          <li>
            <code>429</code> rate limited
          </li>
          <li>
            <code>408</code> analysis timeout
          </li>
        </ul>
      </section>

      <section>
        <h2>Rate limiting</h2>
        <p>
          Initial policy: <code>{limits.ipPerMinute} requests / minute / IP</code>. This is
          intentionally conservative for the first public release.
        </p>
      </section>
    </main>
  );
}
