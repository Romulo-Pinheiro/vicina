import { useEffect, useState, type ChangeEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  ARDOSIA,
  ARDOSIA_TINTA,
  LINHA,
  PAPEL_ALT,
  SINAL,
  SINAL_TINTA,
  SINAL_TINTA_TEXTO,
  TEXTO_SECUNDARIO,
  TINTA,
} from '../identityColors';
import { ApiError } from '../services/apiClient';
import { listProblems, type Problem } from '../services/problemsService';
import { getPublicStats, type PublicStats } from '../services/transparenciaService';

const SERIF = "'Instrument Serif', serif";
const MONO = "'IBM Plex Mono', monospace";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// Dashboard público de transparência (ver CLAUDE.md, decisão "Dashboard
// público (transparência)") — reforça a crítica de Pinho (2008) à falta de
// transparência real em portais de governo eletrônico, já citada na
// fundamentação teórica do artigo. Sem login, sem dado individual: só os
// agregados de GET /transparencia/estatisticas (ver
// services/transparenciaService.ts e apps/api/.../transparencia/).
//
// Escopo de uma cidade só (Feira de Santana) — sem seletor de município,
// sem entidade Município: registrado como trabalho futuro no CLAUDE.md,
// não expandir aqui.
//
// Visual reaproveita boa parte do PainelGestor (mesma paleta/tipografia,
// mesmo padrão de tile de métrica) — é a mesma informação em versão
// pública, faz sentido ter a mesma cara.
export function Transparencia() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Paginação client-side, mesmo padrão do PainelGestor (ver
  // pages/PainelGestor.tsx) — GET /problems já traz tudo de uma vez, sem
  // endpoint próprio de paginação.
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // GET /problems (listagem pública de Problem) já existe e já é sem
    // guard — a tabela aqui só reorganiza a mesma informação que qualquer
    // visitante já vê no mapa, em formato tabular. Não duplica a query nem
    // precisa de endpoint próprio sob /transparencia (ver decisão no
    // commit desta mudança).
    Promise.all([getPublicStats(), listProblems()])
      .then(([statsResult, problemsResult]) => {
        setStats(statsResult);
        setProblems(problemsResult);
      })
      .catch((error: unknown) => {
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os dados de transparência.',
        );
      });
  }, []);

  const categoriasOrdenadas = stats
    ? [...stats.porCategoria].sort((a, b) => b.total - a.total)
    : [];

  const pagedProblems = problems
    ? problems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : [];

  function handleChangeRowsPerPage(event: ChangeEvent<HTMLInputElement>): void {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography
          component="h1"
          sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2.25rem', color: TINTA }}
        >
          Transparência
        </Typography>
        <Typography variant="body2" sx={{ color: TEXTO_SECUNDARIO, mb: 3, maxWidth: '62ch' }}>
          Dados agregados e a listagem pública de problemas reportados em Feira de Santana.
          Sem necessidade de login — a transparência vale pra qualquer visitante.
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {(!stats || !problems) && !loadError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats && problems ? (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="stretch" sx={{ mb: 5 }}>
              <Box
                sx={{
                  flex: { md: '3 1 0' },
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${LINHA}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: '12px',
                  }}
                >
                  <StatTile
                    value={stats.total}
                    label="Total de problemas registrados"
                    background={PAPEL_ALT}
                    valueColor={TINTA}
                    labelColor={TEXTO_SECUNDARIO}
                  />
                  <StatTile
                    value={`${stats.percentualResolvidos}%`}
                    label="Resolvidos"
                    caption={`${stats.resolvidos} resolvidos · ${stats.abertos} em aberto`}
                    background={ARDOSIA_TINTA}
                    valueColor={ARDOSIA}
                    labelColor={ARDOSIA}
                  />
                  <StatTile
                    value={
                      stats.tempoMedioResolucaoDias === null
                        ? '—'
                        : stats.tempoMedioResolucaoDias.toLocaleString('pt-BR')
                    }
                    label={
                      stats.tempoMedioResolucaoDias === null
                        ? 'Sem problema resolvido ainda'
                        : 'Dias até resolver, em média'
                    }
                    background={PAPEL_ALT}
                    valueColor={TINTA}
                    labelColor={TEXTO_SECUNDARIO}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  flex: { md: '2 1 0' },
                  backgroundColor: PAPEL_ALT,
                  border: `1px solid ${LINHA}`,
                  borderRadius: '16px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <Eyebrow sx={{ mb: 1 }}>Por categoria</Eyebrow>
                {categoriasOrdenadas.length > 0 ? (
                  <BarChart
                    layout="horizontal"
                    series={[{ data: categoriasOrdenadas.map((c) => c.total), color: SINAL }]}
                    yAxis={[
                      {
                        scaleType: 'band',
                        data: categoriasOrdenadas.map((c) => c.categoria),
                        // `width` (não `margin.left`!) é quem decide o
                        // espaço disponível pro rótulo do eixo — margin.left
                        // sozinho só empurra a área de plotagem, sem avisar
                        // o eixo, que segue cortando o texto com reticências
                        // pra caber no width default (bem menor, ~40-60px)
                        // (ver ChartsYAxis/ChartsSingleYAxisTicks.mjs).
                        width: 140,
                        tickLabelStyle: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11 },
                      },
                    ]}
                    height={Math.max(180, categoriasOrdenadas.length * 40)}
                    margin={{ right: 16, top: 8, bottom: 24 }}
                    hideLegend
                  />
                ) : (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                    <Typography variant="body2" sx={{ color: TEXTO_SECUNDARIO, textAlign: 'center' }}>
                      Nenhum problema registrado ainda.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>

            <Eyebrow sx={{ mb: 1.5 }}>Todos os problemas</Eyebrow>
            {/* O overflow:hidden pros cantos arredondados vai no Box de
                fora — na TableContainer ele cortava o próprio scroll
                horizontal que ela deveria fornecer, espremendo as colunas
                (chip de status cortado no meio) em vez de rolar. Table com
                minWidth garante que, quando não coube, sobra o quê rolar. */}
            <Box sx={{ border: `1px solid ${LINHA}`, borderRadius: '14px', overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 620 }}>
                  <TableHead>
                    <TableRow>
                      <HeadCell>Título</HeadCell>
                      <HeadCell>Categoria</HeadCell>
                      <HeadCell>Status</HeadCell>
                      <HeadCell align="right">Votos</HeadCell>
                      <HeadCell>Criado em</HeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedProblems.map((problem) => (
                      <TableRow key={problem.id} hover>
                        <TableCell>
                          <Link component={RouterLink} to={`/problemas/${problem.id}`} sx={{ color: SINAL }} underline="hover">
                            {problem.title}
                          </Link>
                        </TableCell>
                        <TableCell>{problem.category.name}</TableCell>
                        <TableCell>
                          {problem.status === 'ABERTO' ? (
                            <Chip
                              label="Aberto"
                              size="small"
                              sx={{ backgroundColor: SINAL_TINTA, color: SINAL_TINTA_TEXTO, fontWeight: 600 }}
                            />
                          ) : (
                            <Chip
                              label="Resolvido"
                              size="small"
                              sx={{ backgroundColor: ARDOSIA, color: PAPEL_ALT, fontWeight: 600 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONO }}>
                          {problem._count.votes}
                        </TableCell>
                        <TableCell sx={{ fontFamily: MONO, fontSize: '0.8125rem' }}>
                          {formatDate(problem.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {problems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" sx={{ color: TEXTO_SECUNDARIO }}>
                            Nenhum problema registrado ainda.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={problems.length}
                page={page}
                onPageChange={(_event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                sx={{ borderTop: `1px solid ${LINHA}`, fontFamily: MONO }}
              />
            </Box>
          </>
        ) : null}
      </Box>
    </Container>
  );
}

function HeadCell({ children, align }: { children: string; align?: 'right' | 'left' }) {
  return (
    <TableCell
      align={align}
      sx={{
        fontFamily: MONO,
        fontSize: '0.6875rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: TEXTO_SECUNDARIO,
        fontWeight: 500,
      }}
    >
      {children}
    </TableCell>
  );
}

function Eyebrow({ children, sx }: { children: string; sx?: object }) {
  return (
    <Typography
      sx={{
        fontFamily: MONO,
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: TEXTO_SECUNDARIO,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

function StatTile({
  value,
  label,
  caption,
  background,
  valueColor,
  labelColor,
}: {
  value: number | string;
  label: string;
  caption?: string;
  background: string;
  valueColor: string;
  labelColor: string;
}) {
  return (
    <Box sx={{ backgroundColor: background, borderRadius: '11px', padding: '13px' }}>
      <Typography sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2rem', lineHeight: 1, color: valueColor }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: labelColor, mt: 0.5 }}>{label}</Typography>
      {caption && (
        <Typography sx={{ fontFamily: MONO, fontSize: '0.6875rem', color: labelColor, mt: 0.5, opacity: 0.85 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}
