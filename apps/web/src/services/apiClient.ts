// Cliente HTTP fino sobre fetch — evita a dependência extra do axios pra algo
// que o fetch nativo já resolve bem (menos peso de bundle, mesmo critério de
// custo zero do resto do projeto). Ponto único que sabe montar a URL da API
// e anexar o JWT em toda chamada autenticada.

// Vazio em dev: o proxy do vite.config.ts encaminha /api/* pra API local.
// Só é preenchido apontando pra uma API remota (ex.: Render em produção).
const API_URL = import.meta.env.VITE_API_URL ?? '';

const TOKEN_STORAGE_KEY = 'vicina:token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Formato de erro que o ValidationPipe/exceptions do Nest devolvem — ver
// apps/api/src/main.ts e os services de auth/problems/votes/comments.
interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

const NO_CONTENT_STATUS = 204;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  // 204 (ex.: DELETE /votes/:problemId, DELETE /comments/:id) não tem corpo.
  if (response.status === NO_CONTENT_STATUS) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : (errorBody?.message ?? 'Erro inesperado na API');
    throw new ApiError(response.status, message);
  }

  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

export function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}
