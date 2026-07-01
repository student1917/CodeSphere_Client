export interface DataResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug?: string;
}

export interface TagResponse {
  id: number;
  name: string;
  slug?: string;
}

export interface LanguageResponse {
  id: number;
  name: string;
  code?: string;
}

