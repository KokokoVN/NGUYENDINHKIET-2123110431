import { api, type Id } from './common';

export type CrudService<TCreate = unknown, TUpdate = unknown, TItem = unknown, TList = TItem> = {
  list(params?: Record<string, unknown>): Promise<{ data: TList }>;
  getById(id: Id): Promise<{ data: TItem }>;
  create(payload: TCreate): Promise<{ data: unknown }>;
  update(id: Id, payload: TUpdate): Promise<{ data: unknown }>;
  remove(id: Id): Promise<{ data: unknown }>;
};

export function createCrudService<TCreate = unknown, TUpdate = unknown, TItem = unknown, TList = TItem>(basePath: string): CrudService<TCreate, TUpdate, TItem, TList> {
  return {
    list(params) {
      return api.get<TList>(basePath, { params });
    },
    getById(id) {
      return api.get<TItem>(`${basePath}/${id}`);
    },
    create(payload) {
      return api.post(basePath, payload);
    },
    update(id, payload) {
      return api.put(`${basePath}/${id}`, payload);
    },
    remove(id) {
      return api.delete(`${basePath}/${id}`);
    },
  };
}
