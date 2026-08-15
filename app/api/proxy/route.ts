import { type NextRequest, NextResponse } from "next/server";

const METHODS_WITH_BODY = ["POST", "PUT", "PATCH", "DELETE"];

export async function POST(request: NextRequest) {
  try {
    const {
      url,
      method,
      headers: reqHeaders = {},
      // Structured body fields
      bodyType,   // "raw" | "form" | "multipart" | undefined (legacy)
      rawBody,
      rawContentType,
      formFields,
      multipartFields,
      // Legacy plain string body (backwards compat)
      body: legacyBody,
    } = await request.json();

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
      headers: reqHeaders,
      redirect: "follow",
    };

    if (METHODS_WITH_BODY.includes(method)) {
      if (bodyType === "form" && Array.isArray(formFields)) {
        // x-www-form-urlencoded
        const params = new URLSearchParams();
        for (const f of formFields) {
          if (f.enabled && f.name) params.append(f.name, f.value ?? "");
        }
        fetchOptions.body = params.toString();
        if (!reqHeaders["content-type"] && !reqHeaders["Content-Type"]) {
          (fetchOptions.headers as Record<string, string>)["content-type"] =
            "application/x-www-form-urlencoded";
        }
      } else if (bodyType === "multipart" && Array.isArray(multipartFields)) {
        // multipart/form-data — let fetch set the boundary automatically
        const fd = new FormData();
        for (const f of multipartFields) {
          if (!f.enabled || !f.name) continue;
          if (f.isFile && f.fileData && f.fileName) {
            const bytes = Buffer.from(f.fileData, "base64");
            const blob = new Blob([bytes], {
              type: f.fileType || "application/octet-stream",
            });
            fd.append(f.name, blob, f.fileName);
          } else if (!f.isFile) {
            fd.append(f.name, f.value ?? "");
          }
        }
        fetchOptions.body = fd;
        // Remove any manually-set content-type so fetch can add the boundary
        delete (fetchOptions.headers as Record<string, string>)["content-type"];
        delete (fetchOptions.headers as Record<string, string>)["Content-Type"];
      } else if (bodyType === "raw" && rawBody) {
        fetchOptions.body = rawBody;
        if (rawContentType && !reqHeaders["content-type"] && !reqHeaders["Content-Type"]) {
          (fetchOptions.headers as Record<string, string>)["content-type"] = rawContentType;
        }
      } else if (legacyBody) {
        // Backwards compatibility with old plain-string body
        fetchOptions.body = legacyBody;
      }
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
