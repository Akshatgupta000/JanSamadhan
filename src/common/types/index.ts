export * from './express.d';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

