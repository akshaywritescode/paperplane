/**
 * Discriminated union for the three body modes the request editor supports.
 */

export type RawContentType =
  | "application/json"
  | "text/plain"
  | "application/xml"
  | "text/html"
  | "application/javascript";

export type FormField = {
  id: string;
  enabled: boolean;
  name: string;
  value: string;
};

export type MultipartField =
  | { id: string; enabled: boolean; name: string; isFile: false; value: string }
  | {
      id: string;
      enabled: boolean;
      name: string;
      isFile: true;
      fileName: string;
      fileType: string;
      /** Base64-encoded file content */
      fileData: string;
    };

export type BodyConfig =
  | { type: "raw"; contentType: RawContentType; content: string }
  | { type: "form"; fields: FormField[] }
  | { type: "multipart"; fields: MultipartField[] }
  | { type: "graphql"; query: string; variables: string };

export const DEFAULT_BODY: BodyConfig = {
  type: "raw",
  contentType: "application/json",
  content: "",
};

/** Returns true when the body has any actual content to send. */
export function hasBodyContent(body: BodyConfig): boolean {
  if (body.type === "raw")      return body.content.trim().length > 0;
  if (body.type === "form")     return body.fields.some((f) => f.enabled && f.name);
  if (body.type === "multipart") return body.fields.some((f) => f.enabled && f.name);
  if (body.type === "graphql")  return body.query.trim().length > 0;
  return false;
}
