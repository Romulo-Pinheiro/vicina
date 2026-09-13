import { apiDelete, apiGet, apiPost } from './apiClient';

// Todas exigem sessão (ver VotesController no backend — módulo inteiro
// atrás de JwtAuthGuard).

export function checkVoted(problemId: string): Promise<{ voted: boolean }> {
  return apiGet<{ voted: boolean }>(`/votes/${problemId}`);
}

export function addVote(problemId: string): Promise<void> {
  return apiPost('/votes', { problemId });
}

export function removeVote(problemId: string): Promise<void> {
  return apiDelete(`/votes/${problemId}`);
}
