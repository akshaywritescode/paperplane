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
      redirect: "manual", // Track redirects manually
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

    // Track redirect chain manually
    const MAX_REDIRECTS = 20;
    const redirectChain: Array<{
      statusCode: number;
      statusText: string;
      location: string;
      headers: Record<string, string>;
    }> = [];

    let currentUrl = url;
    let redirectCount = 0;
    let finalResponse: Response | null = null;

    // Follow redirects manually
    while (redirectCount < MAX_REDIRECTS) {
      const res = await fetch(currentUrl, {
        ...fetchOptions,
        // Only include body on first request (redirects typically don't include body)
        body: redirectCount === 0 ? fetchOptions.body : undefined,
      });

      // Check if this is a redirect response
      const isRedirect = res.status >= 300 && res.status < 400;
      const location = res.headers.get("location");

      if (isRedirect && location) {
        // Capture redirect hop
        const redirectHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          if (k.toLowerCase() !== "set-cookie") {
            redirectHeaders[k] = v;
          }
        });

        redirectChain.push({
          statusCode: res.status,
          statusText: res.statusText,
          location,
          headers: redirectHeaders,
        });

        // Resolve relative URLs
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;

        // For 303 See Other, always use GET for the next request
        if (res.status === 303) {
          fetchOptions.method = "GET";
          delete fetchOptions.body;
        }
        // For 301/302, most browsers change POST to GET (though spec says otherwise)
        // For 307/308, preserve method and body
      } else {
        // Not a redirect, this is the final response
        finalResponse = res;
        break;
      }
    }

    // If we hit max redirects without a final response, use the last redirect response
    if (!finalResponse) {
      finalResponse = await fetch(currentUrl, fetchOptions);
    }

    const time = Date.now() - start;
    const responseBody = await finalResponse.text();

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

    finalResponse.headers.forEach((v, k) => {
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
      statusCode: finalResponse.status,
      statusText: finalResponse.statusText,
      headers: responseHeaders,
      cookies,
      body: responseBody,
      time,
      size: new Blob([responseBody]).size,
      redirects: redirectChain.length > 0 ? redirectChain : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 },
    );
  }
}
