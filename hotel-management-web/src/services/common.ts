import { api } from '../api/client';

export type Id = string | number;

export type ApiList<T> = T[] | { items?: T[]; data?: T[] };
export type ApiSingle<T> = T | { data?: T };

export const unwrapList = <T>(payload: ApiList<T>): T[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

export const unwrapSingle = <T>(payload: ApiSingle<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
};

export const withQuery = <TParams extends Record<string, unknown>>(params?: TParams) => ({
  params,
});

export { api };
