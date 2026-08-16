import type { HttpMethod, ParamRow, HeaderRow } from "@/app/dashboard/components/RequestEditor";
import type { BodyConfig, RawContentType, FormField, MultipartField } from "@/app/dashboard/components/RequestEditor/body";
import type { AuthConfig } from "@/app/dashboard/components/RequestEditor/auth";

export type ParsedCurl = {
  method: HttpMethod;
  url: string;
  params: ParamRow[];
  headers: HeaderRow[];
  body: BodyConfig;
  auth: AuthConfig;
};

// ─── Token-level shell splitter ───────────────────────────────────────────────
// Handles single/double quoted strings, backslash continuations, and \ escapes.

function splitShell(raw: string): string[] {
  // Normalise line-continuation: \ followed by newline → single space
  const src = raw.replace(/\\\n/g, " ").replace(/\\\r\n/g, " ").trim();

  const tokens: string[] = [];
  let i = 0;
  let cur = "";

  while (i < src.length) {
    const ch = src[i];

    if (ch === "'" ) {
      // Single-quoted: no escape processing
      i++;
      while (i < src.length && src[i] !== "'") cur += src[i++];
      i++; // closing '
    } else if (ch === '"') {
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === "\\" && i + 1 < src.length) { i++; cur += src[i++]; }
        else cur += src[i++];
      }
      i++; // closing "
    } else if (ch === " " || ch === "\t") {
      if (cur.length) { tokens.push(cur); cur = ""; }
      i++;
    } else {
      cur += ch; i++;
    }
  }
  if (cur.length) tokens.push(cur);
  return tokens;
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

function extractParams(urlStr: string): { base: string; params: ParamRow[] } {
  try {
    const u = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    const params: ParamRow[] = [];
    u.searchParams.forEach((value, name) => {
      params.push({ id: crypto.randomUUID(), enabled: true, name, value });
    });
    u.search = "";
    return { base: u.toString(), params };
  } catch {
    const qi = urlStr.indexOf("?");
    if (qi === -1) return { base: urlStr, params: [] };
    const qs = urlStr.slice(qi + 1);
    const base = urlStr.slice(0, qi);
    const params: ParamRow[] = qs.split("&").map((pair) => {
      const [name, ...rest] = pair.split("=");
      return { id: crypto.randomUUID(), enabled: true, name: decodeURIComponent(name), value: decodeURIComponent(rest.join("=")) };
    });
    return { base, params };
  }
}

// ─── Content-type sniffing ────────────────────────────────────────────────────

function inferContentType(ct: string): RawContentType {
  const l = ct.toLowerCase();
  if (l.includes("json"))       return "application/json";
  if (l.includes("xml"))        return "application/xml";
  if (l.includes("html"))       return "text/html";
  if (l.includes("javascript")) return "application/javascript";
  return "text/plain";
}

// ─── Auth detection from headers ─────────────────────────────────────────────

function extractAuth(
  rawHeaders: Record<string, string>,
): { auth: AuthConfig; filteredHeaders: Record<string, string> } {
  const h = { ...rawHeaders };
  const authVal = h["authorization"] ?? h["Authorization"];

  if (authVal) {
    delete h["authorization"];
    delete h["Authorization"];

    if (authVal.toLowerCase().startsWith("bearer ")) {
      return { auth: { type: "bearer", token: authVal.slice(7).trim() }, filteredHeaders: h };
    }
    if (authVal.toLowerCase().startsWith("basic ")) {
      try {
        const decoded = atob(authVal.slice(6).trim());
        const colon   = decoded.indexOf(":");
        const username = decoded.slice(0, colon);
        const password = decoded.slice(colon + 1);
        return { auth: { type: "basic", username, password }, filteredHeaders: h };
      } catch {
        // If atob fails just leave it as a header
        h["Authorization"] = authVal;
      }
    }
  }

  return { auth: { type: "none" }, filteredHeaders: h };
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseCurl(raw: string): ParsedCurl {
  // Strip leading "$ " or "curl " prompt artefacts from copy-paste
  const cleaned = raw.trim().replace(/^\$\s+/, "");
  const tokens  = splitShell(cleaned);

  if (tokens[0]?.toLowerCase() !== "curl") {
    throw new Error("Input does not start with 'curl'");
  }

  let url          = "";
  let method       = "";
  const rawHeaders: Record<string, string> = {};
  let rawBody      = "";
  let bodyIsForm   = false;   // -d with --data-urlencode or -F
  let bodyIsMulti  = false;   // -F multipart

  const formPairs: string[] = [];

  let i = 1;
  while (i < tokens.length) {
    const t = tokens[i];

    // ── URL (bare arg, or -url / --url) ──────────────────────────────────
    if (t === "--url") {
      url = tokens[++i] ?? "";
    } else if (!t.startsWith("-")) {
      if (!url) url = t;

    // ── Method ────────────────────────────────────────────────────────────
    } else if (t === "-X" || t === "--request") {
      method = (tokens[++i] ?? "GET").toUpperCase();

    // ── Headers ───────────────────────────────────────────────────────────
    } else if (t === "-H" || t === "--header") {
      const hdr = tokens[++i] ?? "";
      const colon = hdr.indexOf(":");
      if (colon !== -1) {
        const name = hdr.slice(0, colon).trim();
        const val  = hdr.slice(colon + 1).trim();
        rawHeaders[name] = val;
      }

    // ── Raw body (-d / --data / --data-raw / --data-binary) ──────────────
    } else if (
      t === "-d" || t === "--data" || t === "--data-raw" ||
      t === "--data-binary" || t === "--data-ascii"
    ) {
      const val = tokens[++i] ?? "";
      // -d @filename → skip (can't read files)
      if (!val.startsWith("@")) rawBody += (rawBody ? "&" : "") + val;
      bodyIsForm = t === "--data" || t === "-d";

    // ── URL-encoded form fields ────────────────────────────────────────────
    } else if (t === "--data-urlencode") {
      const val = tokens[++i] ?? "";
      formPairs.push(val.startsWith("@") ? "" : val);
      bodyIsForm = true;

    // ── Multipart (-F) ────────────────────────────────────────────────────
    } else if (t === "-F" || t === "--form") {
      formPairs.push(tokens[++i] ?? "");
      bodyIsMulti = true;

    // ── User / basic auth (-u) ────────────────────────────────────────────
    } else if (t === "-u" || t === "--user") {
      const val = tokens[++i] ?? "";
      const colon = val.indexOf(":");
      if (colon !== -1) {
        rawHeaders["Authorization"] =
          "Basic " + btoa(`${val.slice(0, colon)}:${val.slice(colon + 1)}`);
      }

    // ── Bearer (-H Authorization: Bearer handled above; also --oauth2-bearer) ─
    } else if (t === "--oauth2-bearer") {
      rawHeaders["Authorization"] = `Bearer ${tokens[++i] ?? ""}`;

    // ── Ignore known flags with no value ─────────────────────────────────
    } else if (
      t === "-G" || t === "--get" || t === "--compressed" ||
      t === "-k" || t === "--insecure" || t === "-s" || t === "--silent" ||
      t === "-v" || t === "--verbose" || t === "-i" || t === "--include" ||
      t === "-L" || t === "--location" || t === "-f" || t === "--fail"
    ) {
      if (t === "-G" || t === "--get") method = method || "GET";

    // ── Flags that take a value we don't need ─────────────────────────────
    } else if (
      t === "--max-time" || t === "-m" || t === "--connect-timeout" ||
      t === "--retry" || t === "-A" || t === "--user-agent" ||
      t === "--proxy" || t === "-x" || t === "-o" || t === "--output" ||
      t === "--cacert" || t === "--cert" || t === "--key"
    ) {
      i++; // skip the value
    }

    i++;
  }

  // ── Resolve method ────────────────────────────────────────────────────────
  const hasBody = rawBody || bodyIsMulti || formPairs.length > 0;
  const resolvedMethod = (
    method ||
    (hasBody ? "POST" : "GET")
  ).toUpperCase() as HttpMethod;

  // ── URL + query params ────────────────────────────────────────────────────
  if (!url) throw new Error("No URL found in cURL command");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const { base: cleanUrl, params } = extractParams(url);

  // ── Build HeaderRow array (preserve case) ────────────────────────────────
  // Extract auth first
  const { auth, filteredHeaders } = extractAuth(rawHeaders);

  const headers: HeaderRow[] = Object.entries(filteredHeaders)
    .filter(([name]) => name.toLowerCase() !== "content-type") // handled via body
    .map(([name, value]) => ({
      id: crypto.randomUUID(),
      enabled: true,
      name,
      value,
    }));

  // ── Body ──────────────────────────────────────────────────────────────────
  const ctHeader =
    rawHeaders["content-type"] ??
    rawHeaders["Content-Type"] ??
    rawHeaders["CONTENT-TYPE"] ??
    "";

  let body: BodyConfig;

  if (bodyIsMulti && formPairs.length > 0) {
    // multipart/form-data
    const fields = formPairs
      .filter(Boolean)
      .map((pair): MultipartField => {
        const eq = pair.indexOf("=");
        const name  = eq !== -1 ? pair.slice(0, eq)  : pair;
        const value = eq !== -1 ? pair.slice(eq + 1) : "";
        return { id: crypto.randomUUID(), enabled: true, name, isFile: false, value };
      });
    body = { type: "multipart", fields };
  } else if (
    bodyIsForm &&
    !ctHeader.toLowerCase().includes("json") &&
    rawBody &&
    rawBody.includes("=")
  ) {
    // x-www-form-urlencoded
    try {
      const usp = new URLSearchParams(rawBody);
      const fields: FormField[] = [];
      usp.forEach((value, name) => {
        fields.push({ id: crypto.randomUUID(), enabled: true, name, value });
      });
      body = { type: "form", fields };
    } catch {
      body = { type: "raw", contentType: "text/plain", content: rawBody };
    }
  } else if (rawBody) {
    const contentType = inferContentType(ctHeader || "application/json");
    // Auto-pretty-print JSON
    let content = rawBody;
    if (contentType === "application/json") {
      try { content = JSON.stringify(JSON.parse(rawBody), null, 2); } catch { /* keep raw */ }
    }
    body = { type: "raw", contentType, content };
  } else {
    body = { type: "raw", contentType: "application/json", content: "" };
  }

  return { method: resolvedMethod, url: cleanUrl, params, headers, body, auth };
}
