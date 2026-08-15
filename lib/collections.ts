import type { HttpMethod, ParamRow, HeaderRow } from "@/app/dashboard/components/RequestEditor";
import type { BodyConfig } from "@/app/dashboard/components/RequestEditor/body";
import type { AuthConfig } from "@/app/dashboard/components/RequestEditor/auth";

export type Collection = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
};

export type SavedRequest = {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  params: ParamRow[];
  headers: HeaderRow[];
  body: BodyConfig;
  auth: AuthConfig;
  createdAt: number;
  updatedAt: number;
};
