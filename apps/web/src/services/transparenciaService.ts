import { apiGet } from './apiClient';

// Espelha PublicStats de apps/api/src/problems/problems.service.ts
// (GET /transparencia/estatisticas, público, sem guard).
export interface PublicStats {
  total: number;
  abertos: number;
  resolvidos: number;
  percentualResolvidos: number;
  tempoMedioResolucaoDias: number | null;
  porCategoria: { categoria: string; total: number }[];
}

// Público — sem sessão, ver decisão "Dashboard público (transparência)"
// no CLAUDE.md.
export function getPublicStats(): Promise<PublicStats> {
  return apiGet<PublicStats>('/transparencia/estatisticas');
}
