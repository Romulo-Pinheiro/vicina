import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../auth/AuthContext';
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
import { RESOLUTION_NOTE_TEMPLATE } from '../resolutionNoteTemplate';
import { ApiError } from '../services/apiClient';
import { listProblems, resolveProblem, type Problem } from '../services/problemsService';

const SERIF = "'Instrument Serif', serif";
const MONO = "'IBM Plex Mono', monospace";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// Painel do gestor — decisão de escopo (ver CLAUDE.md, "Fora de escopo" e
// "Decisões já tomadas"): o público de teste do protótipo são cidadãos, não
// gestores públicos. Esta página existe pra sustentar a descrição da
// arquitetura na Seção 4 do artigo (mostrar que o papel GESTOR tem um lugar
// na aplicação), sem validação empírica prevista e sem profundidade de
// produto — por isso a única ação de gestão implementada é marcar problema
// aberto como resolvido (extensão do item 8, ver CLAUDE.md "Confirmação de
// resolução"); triagem, exclusão, categorização manual continuam fora de
// escopo. Reaproveita o GET /problems público já existente pra listar; a
// ação de resolver usa o mesmo PATCH /problems/:id/resolve do fluxo do
// autor (ver ProblemsService.resolve, que aceita autor OU gestor).
//
// Polimento visual (ver CLAUDE.md, "Melhorias possíveis" item 5): mesma
// paleta/tipografia do resto do app, seguindo de perto o mockup "PAINEL DO
// GESTOR" da seção MARCA EM USO de docs/Vicina_Identidade_Visual.html
// (tiles de métrica com fundo tintado por status, números em Instrument
// Serif, dados em IBM Plex Mono). Sem mudança de dado, endpoint ou lógica.
export function PainelGestor() {
  const { user, loading: authLoading } = useAuth();

  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Paginação só client-side (ver CLAUDE.md, item 5 de "Melhorias
  // possíveis": sem endpoint dedicado, GET /problems já traz tudo de uma
  // vez) — evita a tabela virar uma lista infinita se o teste com cidadãos
  // gerar bastante registro.
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Extensão do item 8 de "Melhorias possíveis" (ver CLAUDE.md, "Confirmação
  // de resolução"): gestor também pode marcar como resolvido, sem pedir
  // resolutionRating (isso continua exclusivo de quando o autor original
  // resolve, na tela de detalhe) — só a mensagem opcional.
  const [resolvingProblem, setResolvingProblem] = useState<Problem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const isGestor = user?.role === 'GESTOR';

  useEffect(() => {
    if (!isGestor) {
      return;
    }
    listProblems()
      .then(setProblems)
      .catch((error: unknown) => {
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os problemas.',
        );
      });
  }, [isGestor]);

  const stats = useMemo(() => {
    if (!problems) {
      return null;
    }
    const abertos = problems.filter((problem) => problem.status === 'ABERTO').length;
    const resolvidos = problems.length - abertos;
    const totalVotos = problems.reduce((sum, problem) => sum + problem._count.votes, 0);
    return { total: problems.length, abertos, resolvidos, totalVotos };
  }, [problems]);

  const pagedProblems = useMemo(() => {
    if (!problems) {
      return [];
    }
    const start = page * rowsPerPage;
    return problems.slice(start, start + rowsPerPage);
  }, [problems, page, rowsPerPage]);

  function handleChangeRowsPerPage(event: ChangeEvent<HTMLInputElement>): void {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  function closeResolveDialog(): void {
    setResolvingProblem(null);
    setResolutionNote('');
    setResolveError(null);
  }

  async function handleResolveSubmit(): Promise<void> {
    if (!resolvingProblem) return;
    setResolveError(null);
    setResolveSubmitting(true);
    try {
      // Sem resolutionRating de propósito: gestor nunca avalia na hora (ver
      // CLAUDE.md) — o backend rejeitaria mesmo se mandássemos.
      const updated = await resolveProblem(resolvingProblem.id, {
        resolutionNote: resolutionNote.trim() ? resolutionNote.trim() : undefined,
      });
      setProblems((current) =>
        current ? current.map((p) => (p.id === updated.id ? updated : p)) : current,
      );
      closeResolveDialog();
    } catch (error) {
      setResolveError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível marcar como resolvido.',
      );
    } finally {
      setResolveSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <Box
        sx={{
          height: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isGestor) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning">
            Esta página é restrita a contas de gestor. Sua conta é do tipo{' '}
            <strong>cidadão</strong>.
          </Alert>
          <Button component={RouterLink} to="/mapa" sx={{ mt: 2 }}>
            Voltar ao mapa
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography
          component="h1"
          sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2.25rem', color: TINTA }}
        >
          Painel do gestor
        </Typography>
        <Typography variant="body2" sx={{ color: TEXTO_SECUNDARIO, mb: 3 }}>
          Visão geral dos problemas reportados pelos cidadãos, somente leitura.
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {!problems ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ mb: 5 }} alignItems="stretch">
              <Box
                sx={{
                  flex: { md: '2 1 0' },
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${LINHA}`,
                  borderRadius: '16px',
                  padding: '22px',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: '12px',
                  }}
                >
                  <StatTile value={stats!.total} label="Total de problemas" background={PAPEL_ALT} valueColor={TINTA} labelColor={TEXTO_SECUNDARIO} />
                  <StatTile value={stats!.abertos} label="Em aberto" background={SINAL_TINTA} valueColor={SINAL_TINTA_TEXTO} labelColor={SINAL_TINTA_TEXTO} />
                  <StatTile value={stats!.resolvidos} label="Resolvidos" background={ARDOSIA_TINTA} valueColor={ARDOSIA} labelColor={ARDOSIA} />
                  <StatTile value={stats!.totalVotos} label="Votos acumulados" background={PAPEL_ALT} valueColor={TINTA} labelColor={TEXTO_SECUNDARIO} />
                </Box>
              </Box>

              <Box
                sx={{
                  flex: { md: '1 1 0' },
                  backgroundColor: PAPEL_ALT,
                  border: `1px solid ${LINHA}`,
                  borderRadius: '16px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <Eyebrow sx={{ mb: 1 }}>Status</Eyebrow>
                {stats!.total > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: [
                          { id: 'aberto', value: stats!.abertos, label: 'Aberto', color: SINAL },
                          { id: 'resolvido', value: stats!.resolvidos, label: 'Resolvido', color: ARDOSIA },
                        ],
                        innerRadius: 42,
                        paddingAngle: 2,
                        cornerRadius: 3,
                      },
                    ]}
                    height={180}
                    margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
            {/* overflow:hidden pros cantos arredondados vai no Box de fora —
                na TableContainer ele desligava o próprio overflow-x:auto
                dela, que é o que faz a tabela rolar em vez de espremer as
                colunas (mesmo bug corrigido antes em Transparencia.tsx).
                Table com minWidth garante que sobra o quê rolar quando não
                cabe. */}
            <Box sx={{ border: `1px solid ${LINHA}`, borderRadius: '14px', overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 830 }}>
                  <TableHead>
                    <TableRow>
                      <HeadCell>Título</HeadCell>
                      <HeadCell>Categoria</HeadCell>
                      <HeadCell>Status</HeadCell>
                      <HeadCell align="right">Votos</HeadCell>
                      <HeadCell align="right">Comentários</HeadCell>
                      <HeadCell>Autor</HeadCell>
                      <HeadCell>Criado em</HeadCell>
                      <HeadCell>Ações</HeadCell>
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
                        <TableCell align="right" sx={{ fontFamily: MONO }}>
                          {problem._count.comments}
                        </TableCell>
                        <TableCell>{problem.author.name}</TableCell>
                        <TableCell sx={{ fontFamily: MONO, fontSize: '0.8125rem' }}>
                          {formatDate(problem.createdAt)}
                        </TableCell>
                        <TableCell>
                          {problem.status === 'ABERTO' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => setResolvingProblem(problem)}
                            >
                              Resolver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {problems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
        )}
      </Box>

      <Dialog open={resolvingProblem !== null} onClose={closeResolveDialog} fullWidth maxWidth="xs">
        <DialogTitle>Marcar como resolvido</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {resolvingProblem?.title}
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            Mensagem opcional sobre a resolução, visível pra quem acompanha o
            problema. Sem avaliação por estrelas aqui — essa parte continua
            exclusiva do autor original, na tela de detalhe do problema.
          </DialogContentText>
          {resolveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resolveError}
            </Alert>
          )}
          <TextField
            label="Mensagem sobre a resolução (opcional)"
            fullWidth
            multiline
            minRows={2}
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            disabled={resolveSubmitting}
          />
          {/* Modelo no padrão de resposta de gestão pública (quem resolveu,
              causa, solução) — sem nada pré-preenchido (ex.: secretaria por
              categoria): a app não tem dado confiável sobre qual órgão
              resolveu de fato, então sugerir um nome seria inventar
              informação. Só um ponto de partida editável, nunca obrigatório. */}
          <Button
            size="small"
            onClick={() => setResolutionNote(RESOLUTION_NOTE_TEMPLATE)}
            disabled={resolveSubmitting}
            sx={{ mt: 0.5 }}
          >
            Usar modelo
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResolveDialog} disabled={resolveSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleResolveSubmit()}
            disabled={resolveSubmitting}
          >
            {resolveSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Rótulo pequeno em versalete/mono — mesmo padrão do doc de identidade pra
// título de seção discreto (ex.: "PAINEL DO GESTOR" no mockup da seção
// MARCA EM USO), reaproveitado aqui como separador de blocos da página.
function Eyebrow({ children, sx }: { children: ReactNode; sx?: object }) {
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

function HeadCell({ children, align }: { children: ReactNode; align?: 'right' | 'left' }) {
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

function StatTile({
  value,
  label,
  background,
  valueColor,
  labelColor,
}: {
  value: number;
  label: string;
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
    </Box>
  );
}
