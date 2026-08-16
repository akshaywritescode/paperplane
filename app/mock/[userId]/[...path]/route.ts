import { type NextRequest, NextResponse } from "next/server";
import { findMockEndpointAction } from "@/app/dashboard/mock-server/actions";

type Params = { userId: string; path: string[] };

async function handler(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { userId, path } = await params;
  const pathStr = path.join("/");
  const method = request.method;

  const endpoint = await findMockEndpointAction(userId, pathStr, method);

  if (!endpoint) {
    return NextResponse.json(
      { error: "Mock endpoint not found", path: `/${pathStr}` },
      {
        status: 404,
        headers: corsHeaders(),
      },
    );
  }

  // Try to parse as JSON so we return proper application/json content-type
  let body: unknown;
  let isJson = false;
  try {
    body = JSON.parse(endpoint.responseBody);
    isJson = true;
  } catch {
    body = endpoint.responseBody;
  }

  if (isJson) {
    return NextResponse.json(body, {
      status: endpoint.statusCode,
      headers: corsHeaders(),
    });
  }

  return new NextResponse(endpoint.responseBody, {
    status: endpoint.statusCode,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

/** Allow all origins so the mock URL is usable from any frontend. */
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Powered-By": "Paperplane Mock Server",
  };
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;

// Handle CORS pre-flight
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
