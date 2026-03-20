export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? url.protocol.replace(":", "");
  const baseUrl = `${protocol}://${host}`;
  const body = `# IroMap

IroMap provides image color analysis for humans and agents.

- Analyze endpoint: ${baseUrl}/api/analyze
- Human docs: ${baseUrl}/docs/agent-api
- OpenAPI: ${baseUrl}/openapi.json

Input:
- POST raw image bytes
- Content-Type: image/jpeg | image/png | image/webp

Output:
- application/json with input, summary, analysis, visualization, explanations
`;

  const responseHeaders = new Headers();
  responseHeaders.append("content-type", "text/plain; charset=utf-8");

  return new Response(body, {
    headers: responseHeaders,
  });
}
