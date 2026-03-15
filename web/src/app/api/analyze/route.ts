import { NextResponse } from "next/server";
import {
  analyzeImageBytes,
  checkAnalyzeRateLimit,
  createErrorResponse,
  getAnalyzeLimits,
  renderHtmlFromAnalyzeResponse,
  validateAnalyzeRequest,
} from "@/lib/agent-analyze";

export const runtime = "nodejs";

const jsonResponse = (body: unknown, status = 200): NextResponse => {
  return NextResponse.json(body, { status });
};

export async function POST(request: Request): Promise<NextResponse> {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type");
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : undefined;
  const validationError = validateAnalyzeRequest(contentType, contentLength);

  if (validationError) {
    const status = validationError.error.code === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return jsonResponse(validationError, status);
  }

  const isRateLimited = await checkAnalyzeRateLimit(request);
  if (isRateLimited) {
    return jsonResponse(
      createErrorResponse(
        "RATE_LIMITED",
        "Too many requests from this IP address.",
        { limit: getAnalyzeLimits().ipPerMinute, window: "1m" },
        true
      ),
      429
    );
  }

  const body = new Uint8Array(await request.arrayBuffer());
  const bodyValidationError = validateAnalyzeRequest(contentType, body.byteLength);
  if (bodyValidationError) {
    const status = bodyValidationError.error.code === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    return jsonResponse(bodyValidationError, status);
  }

  const result = await analyzeImageBytes({
    bytes: body,
    mimeType: contentType ?? "application/octet-stream",
  });

  if ("error" in result) {
    switch (result.error.code) {
      case "UNSUPPORTED_CONTENT_TYPE":
        return jsonResponse(result, 400);
      case "PAYLOAD_TOO_LARGE":
        return jsonResponse(result, 413);
      case "PIXEL_COUNT_EXCEEDED":
      case "IMAGE_DECODE_FAILED":
        return jsonResponse(result, 422);
      case "RATE_LIMITED":
        return jsonResponse(result, 429);
      case "ANALYSIS_TIMEOUT":
        return jsonResponse(result, 408);
      case "INTERNAL_ERROR":
      default:
        return jsonResponse(result, 500);
    }
  }

  if (accept.includes("text/html")) {
    const htmlHeaders = new Headers();
    htmlHeaders.append("content-type", "text/html; charset=utf-8");

    return new NextResponse(renderHtmlFromAnalyzeResponse(result), {
      status: 200,
      headers: htmlHeaders,
    });
  }

  return jsonResponse(result);
}
