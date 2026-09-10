import { apiGet } from './apiClient';

export interface Category {
  id: string;
  name: string;
}

export function listCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/categories');
}
