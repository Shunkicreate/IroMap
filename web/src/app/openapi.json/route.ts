import { getAnalyzeLimits } from "@/lib/agent-analyze";

export const dynamic = "force-static";

export function GET(): Response {
  const limits = getAnalyzeLimits();
  const imageContent = {
    schema: { type: "string", format: "binary" },
  };
  const jsonContent = {
    schema: {
      type: "object",
      required: ["input", "summary", "analysis", "visualization", "explanations"],
    },
  };
  const responses: Record<string, { description: string; content?: Record<string, unknown> }> = {};
  const successContent: Record<string, unknown> = {};
  successContent["application/json"] = jsonContent;
  responses["200"] = {
    description: "Successful analysis",
    content: successContent,
  };
  responses["400"] = { description: "Unsupported content type" };
  responses["413"] = { description: `Payload larger than ${limits.maxBodyBytes} bytes` };
  responses["422"] = { description: `Decode failure or pixel count larger than ${limits.maxPixels}` };
  responses["429"] = { description: `Rate limited at ${limits.ipPerMinute} req/min/IP` };

  const requestContent: Record<string, unknown> = {};
  requestContent["image/jpeg"] = imageContent;
  requestContent["image/png"] = imageContent;
  requestContent["image/webp"] = imageContent;

  const postOperation = {
    summary: "Analyze an image",
    operationId: "analyzeImage",
    requestBody: {
      required: true,
      content: requestContent,
    },
    responses,
  };

  const paths: Record<string, unknown> = {};
  paths["/api/analyze"] = { post: postOperation };

  return Response.json({
    openapi: "3.1.0",
    info: {
      title: "IroMap Agent API",
      version: "0.1.0",
      description: "Raw image analysis endpoint for AI agents.",
    },
    paths,
  });
}
