// Cliente HTTP fino sobre fetch — evita a dependência extra do axios pra algo
// que o fetch nativo já resolve bem (menos peso de bundle, mesmo critério de
// custo zero do resto do projeto).
//
// Autenticação via cookie httpOnly (ver apps/api AuthController), não mais
// localStorage: o token nunca fica acessível a este código (só o navegador
// lida com ele), então não há nada pra ler/anexar aqui — só credentials:
// 'include' pra o fetch enviar/aceitar o cookie em toda chamada.

// Vazio em dev: o proxy do vite.config.ts encaminha /api/* pra API local.
// Só é preenchido apontando pra uma API remota (ex.: Render em produção).
const API_URL = import.meta.env.VITE_API_URL ?? '';

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

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
    // Necessário mesmo em dev (front e back same-origin via proxy do Vite) e
    // essencial em produção caso front/back não sejam same-origin do ponto
    // de vista do navegador — sem isso o cookie httpOnly do JWT nunca é
    // enviado nem aceito.
    credentials: 'include',
  });

  // 204 (ex.: DELETE /votes/:problemId, POST /auth/logout) não tem corpo.
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

export function apiPost<T = void>(path: string, data?: unknown): Promise<T> {
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
