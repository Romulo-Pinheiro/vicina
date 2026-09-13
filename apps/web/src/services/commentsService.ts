import { apiDelete, apiGet, apiPost } from './apiClient';

// Espelha o COMMENT_SELECT de apps/api/src/comments/comments.service.ts.
export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string };
}

// Público — ver a discussão não exige login (mesmo critério de Problem).
export function listComments(problemId: string): Promise<Comment[]> {
  return apiGet<Comment[]>(`/comments?problemId=${problemId}`);
}

// Exige sessão.
export function createComment(problemId: string, text: string): Promise<Comment> {
  return apiPost<Comment>('/comments', { problemId, text });
}

// Exige sessão e, no backend, ser o autor do comentário (403 caso contrário).
export function deleteComment(id: string): Promise<void> {
  return apiDelete(`/comments/${id}`);
}
