import { apiGet, apiPost } from './apiClient';

export type ProblemStatus = 'ABERTO' | 'RESOLVIDO';

// Espelha o PROBLEM_SELECT de apps/api/src/problems/problems.service.ts.
export interface Problem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: ProblemStatus;
  resolvedAt: string | null;
  resolutionRating: number | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  author: { id: string; name: string };
  _count: { votes: number; comments: number };
}

export interface CreateProblemInput {
  title: string;
  description: string;
  categoryId: string;
  latitude: number;
  longitude: number;
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
