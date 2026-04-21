import type { VisibilityResponse } from "../types.js";

export type VisibilityRecord = {
  keyword: string;
  store: string;
  result: VisibilityResponse;
  createdAt: Date;
};

export interface QueryStore {
  get(keyword: string, store: string): Promise<VisibilityRecord | null>;
  put(record: VisibilityRecord): Promise<void>;
}
