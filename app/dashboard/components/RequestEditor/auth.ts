/**
 * Discriminated union representing the four auth modes supported by the
 * request editor. "none" means no auth header is injected.
 */
export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "apikey"; key: string; value: string; in: "header" | "query" };

/**
 * Returns the HTTP headers that encode the given auth config.
 * Returns an empty object when no auth header should be sent.
 */
export function buildAuthHeader(auth: AuthConfig): Record<string, string> {
  if (auth.type === "bearer" && auth.token) {
    return { Authorization: `Bearer ${auth.token}` };
  }
  if (auth.type === "basic" && auth.username) {
    const cred = btoa(`${auth.username}:${auth.password}`);
    return { Authorization: `Basic ${cred}` };
  }
  if (
    auth.type === "apikey" &&
    auth.in === "header" &&
    auth.key &&
    auth.value
  ) {
    return { [auth.key]: auth.value };
  }
  return {};
}

/**
 * Returns the query-param pair to append when the API Key mode is set to
 * "query". Returns null for all other auth types.
 */
export function buildAuthQueryParam(
  auth: AuthConfig,
): { key: string; value: string } | null {
  if (
    auth.type === "apikey" &&
    auth.in === "query" &&
    auth.key &&
    auth.value
  ) {
    return { key: auth.key, value: auth.value };
  }
  return null;
}
