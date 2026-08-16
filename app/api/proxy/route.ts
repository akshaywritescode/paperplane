import { type NextRequest, NextResponse } from "next/server";

const METHODS_WITH_BODY = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Parse a Set-Cookie header value into structured cookie object
 */
function parseCookie(cookieString: string) {
  try {
    const parts = cookieString.split(";").map((p) => p.trim());
    const [nameValue] = parts;
    const [name, ...valueParts] = nameValue.split("=");
    const value = valueParts.join("="); // Handle values with '=' in them

    const cookie: {
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: string;
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: string;
    } = { name: name.trim(), value: value.trim() };

    // Parse attributes
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const [key, ...valParts] = part.split("=");
      const keyLower = key.toLowerCase().trim();
      const val = valParts.join("=").trim();

      if (keyLower === "domain") cookie.domain = val;
      else if (keyLower === "path") cookie.path = val;
      else if (keyLower === "expires") cookie.expires = val;
      else if (keyLower === "max-age") cookie.maxAge = parseInt(val, 10);
      else if (keyLower === "httponly") cookie.httpOnly = true;
      else if (keyLower === "secure") cookie.secure = true;
      else if (keyLower === "samesite") cookie.sameSite = val;
    }

    return cookie;
  } catch {
    return null;
  }
}

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

    // Forward response headers and extract cookies
    const responseHeaders: Record<string, string> = {};
    const cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: string;
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: string;
    }> = [];

    res.headers.forEach((v, k) => {
      const keyLower = k.toLowerCase();
      if (keyLower === "set-cookie") {
        // Parse set-cookie header
        const parsed = parseCookie(v);
        if (parsed) cookies.push(parsed);
      } else {
        responseHeaders[k] = v;
      }
    });

    return NextResponse.json({
      statusCode: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      cookies,
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
