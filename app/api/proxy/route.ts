import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers: reqHeaders, body } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Block private/internal addresses
    const host = parsedUrl.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local")
    ) {
      return NextResponse.json(
        { error: "Requests to private/internal addresses are not allowed" },
        { status: 403 },
      );
    }

    const start = Date.now();

    const fetchOptions: RequestInit = {
      method: method ?? "GET",
      headers: reqHeaders ?? {},
      redirect: "follow",
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      fetchOptions.body = body;
    }

    const res = await fetch(url, fetchOptions);
    const time = Date.now() - start;

    const responseBody = await res.text();

    // Forward response headers
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    return NextResponse.json({
      statusCode: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: responseBody,
      time,
      size: new Blob([responseBody]).size,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 },
    );
  }
}
