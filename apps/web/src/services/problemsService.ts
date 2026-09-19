import { apiGet, apiPatch, apiPost } from './apiClient';

export type ProblemStatus = 'ABERTO' | 'RESOLVIDO';

// Espelha o PROBLEM_SELECT de apps/api/src/problems/problems.service.ts.
export interface Problem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: ProblemStatus;
  isAnonymous: boolean;
  resolvedAt: string | null;
  resolutionRating: number | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  // Quando isAnonymous é true, o backend já substitui name por "Cidadão
  // anônimo" antes de responder (ver maskAnonymousAuthor em
  // problems.service.ts) — nunca chega o nome real aqui. id continua sendo
  // o do autor de verdade (não é dado identificável sozinho, e a UI precisa
  // dele pra saber se o usuário logado é o autor e pode resolver).
  author: { id: string; name: string };
  _count: { votes: number; comments: number };
}

export interface CreateProblemInput {
  title: string;
  description: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  isAnonymous?: boolean;
}

// Público — não exige sessão (ver GET /problems no backend).
export function listProblems(): Promise<Problem[]> {
  return apiGet<Problem[]>('/problems');
}

// Exige sessão — o cookie httpOnly já vai automático via apiClient
// (credentials: 'include'); se não houver sessão válida, a API responde 401.
export function createProblem(data: CreateProblemInput): Promise<Problem> {
  return apiPost<Problem>('/problems', data);
}

// Público — usado pela página DetalheProblema.
export function getProblem(id: string): Promise<Problem> {
  return apiGet<Problem>(`/problems/${id}`);
}

export interface ResolveProblemInput {
  resolutionRating?: number;
}

// Exige sessão e, no backend, ser o autor original (403 caso contrário).
export function resolveProblem(
  id: string,
  data: ResolveProblemInput,
): Promise<Problem> {
  return apiPatch<Problem>(`/problems/${id}/resolve`, data);
}
