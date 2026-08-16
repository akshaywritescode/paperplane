export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "ANY";

export type MockEndpoint = {
  id: string;
  userId: string;
  /** Path segment after /mock/{userId}/, e.g. "todos" or "users/profile" */
  path: string;
  method: HttpMethod;
  /** HTTP status code to return, default 200 */
  statusCode: number;
  /** Raw JSON string that will be sent as the response body */
  responseBody: string;
  /** Optional human-readable label */
  description: string;
  createdAt: number;
  updatedAt: number;
};
