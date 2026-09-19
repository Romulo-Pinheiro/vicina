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
  // Mensagem opcional de quem resolveu (autor ou gestor) — ver CLAUDE.md,
  // "Avaliação assíncrona... e mensagem do gestor ao resolver".
  resolutionNote: string | null;
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
  // Só aceito pelo backend quando quem resolve é o autor original — rejeita
  // (403) se vier de um gestor não-autor.
  resolutionRating?: number;
  // Aceito de qualquer um dos dois (autor ou gestor), sempre opcional.
  resolutionNote?: string;
}

// Exige sessão; no backend, autor original OU gestor (403 caso contrário) —
// ver ProblemsService.resolve.
export function resolveProblem(
  id: string,
  data: ResolveProblemInput,
): Promise<Problem> {
  return apiPatch<Problem>(`/problems/${id}/resolve`, data);
}

export interface AvaliarProblemInput {
  resolutionRating: number;
}

// Avaliação assíncrona (ver CLAUDE.md) — só o autor original, só depois de
// resolvido, só uma vez. Usado pelo modal que o Mapa abre ao detectar
// pendência via listPendingEvaluation().
export function avaliarProblem(
  id: string,
  data: AvaliarProblemInput,
): Promise<Problem> {
  return apiPatch<Problem>(`/problems/${id}/avaliar`, data);
}

// Autenticado — problemas resolvidos do próprio usuário logado ainda sem
// resolutionRating. Chamado ao montar o Mapa (ver pages/Mapa.tsx).
export function listPendingEvaluation(): Promise<Problem[]> {
  return apiGet<Problem[]>('/problems/pendentes-avaliacao');
}
