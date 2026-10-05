export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export class PaginatedResult<T> {
  constructor(
    readonly data: T[],
    readonly meta: PaginationMeta,
  ) {}
}
