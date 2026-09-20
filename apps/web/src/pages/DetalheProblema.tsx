import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
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
import Divider from '@mui/material/Divider';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { getCategoryIcon } from '../categoryIcons';
import {
  ARDOSIA,
  ARDOSIA_TINTA,
  LINHA,
  PAPEL,
  SINAL_TINTA,
  SINAL_TINTA_TEXTO,
  TEXTO_SECUNDARIO,
  TINTA,
} from '../identityColors';
import { RESOLUTION_NOTE_TEMPLATE } from '../resolutionNoteTemplate';
import { ApiError } from '../services/apiClient';
import {
  createComment,
  deleteComment,
  listComments,
  type Comment,
} from '../services/commentsService';
import {
  getProblem,
  resolveProblem,
  type Problem,
} from '../services/problemsService';
import { addVote, checkVoted, removeVote } from '../services/votesService';

// Mesmas famílias literais usadas em pages/Mapa.tsx/PainelGestor.tsx — sem
// módulo compartilhado de propósito (ver comentário equivalente em
// Mapa.tsx), é assim que o resto do app já referencia essas duas famílias.
const SERIF = "'Instrument Serif', serif";
const MONO = "'IBM Plex Mono', monospace";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// Chip de status com as cores oficiais (Sinalização=aberto, Ardósia=
// resolvido) — mesmo par já usado na tabela do PainelGestor/Transparencia e
// no popup do mapa (ver Mapa.tsx), nunca as cores genéricas warning/success
// do MUI.
function statusChipSx(status: 'ABERTO' | 'RESOLVIDO') {
  return status === 'ABERTO'
    ? { backgroundColor: SINAL_TINTA, color: SINAL_TINTA_TEXTO, fontWeight: 600 }
    : { backgroundColor: ARDOSIA, color: PAPEL, fontWeight: 600 };
}

// Rótulo discreto de seção (Descrição/Comentários/Resolução) — IBM Plex
// Sans, maiúsculo, letter-spacing leve, ver "Peças da interface" na
// identidade visual (mesmo tratamento do eyebrow do doc).
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: TEXTO_SECUNDARIO,
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

export function DetalheProblema() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // null enquanto não sabemos (sem sessão, ou ainda carregando).
  const [voted, setVoted] = useState<boolean | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionRating, setResolutionRating] = useState<number | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    getProblem(id)
      .then(setProblem)
      .catch((error: unknown) => {
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar este problema.',
        );
      });
    listComments(id).then(setComments).catch(() => setComments([]));
  }, [id]);

  useEffect(() => {
    if (!id || !user) {
      setVoted(null);
      return;
    }
    checkVoted(id)
      .then((result) => setVoted(result.voted))
      .catch(() => setVoted(null));
  }, [id, user]);

  async function handleToggleVote(): Promise<void> {
    if (!id) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setVoteError(null);
    setVoteSubmitting(true);
    try {
      if (voted) {
        await removeVote(id);
      } else {
        await addVote(id);
      }
      const [updatedProblem, votedResult] = await Promise.all([
        getProblem(id),
        checkVoted(id),
      ]);
      setProblem(updatedProblem);
      setVoted(votedResult.voted);
    } catch (error) {
      setVoteError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível registrar seu voto agora.',
      );
    } finally {
      setVoteSubmitting(false);
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!id) return;
    setCommentError(null);
    setCommentSubmitting(true);
    try {
      const created = await createComment(id, commentText);
      setComments((current) => [...current, created]);
      setCommentText('');
    } catch (error) {
      setCommentError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível publicar o comentário.',
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string): Promise<void> {
    if (!window.confirm('Excluir este comentário?')) {
      return;
    }
    try {
      await deleteComment(commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch {
      // Erro pontual de exclusão não justifica um estado de tela dedicado —
      // o comentário simplesmente permanece na lista, o usuário pode tentar
      // de novo.
    }
  }

  function closeResolveDialog(): void {
    setResolveDialogOpen(false);
    setResolutionRating(null);
    setResolutionNote('');
    setResolveError(null);
  }

  async function handleResolveSubmit(): Promise<void> {
    if (!id) return;
    setResolveError(null);
    setResolveSubmitting(true);
    try {
      const updated = await resolveProblem(id, {
        // Rating só vai quando quem resolve é o autor original — o backend
        // rejeita (403) se um gestor não-autor mandar um (ver
        // ProblemsService.resolve). isAuthor é calculado mais abaixo no
        // corpo do componente, mas já está disponível aqui: essa função só
        // roda num clique posterior ao render que a define.
        resolutionRating: isAuthor ? (resolutionRating ?? undefined) : undefined,
        resolutionNote: resolutionNote.trim() ? resolutionNote.trim() : undefined,
      });
      setProblem(updated);
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

  if (loadError) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{loadError}</Alert>
          <Button component={RouterLink} to="/mapa" sx={{ mt: 2 }}>
            Voltar ao mapa
          </Button>
        </Box>
      </Container>
    );
  }

  if (!problem) {
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

  const isAuthor = user?.id === problem.author.id;
  // Autor original OU gestor (ver CLAUDE.md, "Confirmação de resolução" —
  // extensão do item 8). O dialog de resolução decide, com base em
  // isAuthor, se mostra o campo de avaliação (só o autor original avalia
  // na hora — ver handleResolveSubmit).
  const isGestor = user?.role === 'GESTOR';
  const canResolve = (isAuthor || isGestor) && problem.status === 'ABERTO';
  const CategoryIcon = getCategoryIcon(problem.category.name);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Button component={RouterLink} to="/mapa" size="small" sx={{ mb: 2 }}>
          ‹ Voltar ao mapa
        </Button>

        <Typography
          component="h1"
          sx={{ fontFamily: SERIF, fontSize: { xs: '2rem', sm: '2.5rem' }, fontWeight: 400, lineHeight: 1.15, mb: 1.5 }}
        >
          {problem.title}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip
            icon={<CategoryIcon fontSize="small" />}
            label={problem.category.name}
            size="small"
            variant="outlined"
            sx={{ borderColor: LINHA, color: TINTA, '& .MuiChip-icon': { color: TINTA } }}
          />
          <Chip
            label={problem.status === 'ABERTO' ? 'Aberto' : 'Resolvido'}
            size="small"
            sx={statusChipSx(problem.status)}
          />
        </Stack>

        <SectionLabel>Descrição</SectionLabel>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {problem.description}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Registrado por <strong>{problem.author.name}</strong> em{' '}
          {formatDate(problem.createdAt)}
        </Typography>

        {problem.status === 'RESOLVIDO' && problem.resolvedAt && (
          <Box sx={{ mt: 3 }}>
            <SectionLabel>Resolução</SectionLabel>
            {/* Agrupa tudo que hoje ficava solto (data, mensagem de quem
                resolveu, estrelas, retorno do autor) num único bloco com
                leve tingimento em Ardósia — mesmo tratamento já usado nos
                tiles "resolvidos" do PainelGestor/Transparencia (ARDOSIA_TINTA
                de fundo, ARDOSIA no texto). */}
            <Box sx={{ backgroundColor: ARDOSIA_TINTA, borderRadius: '14px', p: 2.25 }}>
              <Typography variant="body2" sx={{ color: ARDOSIA, fontWeight: 600 }}>
                Resolvido em {formatDate(problem.resolvedAt)}
              </Typography>
              {/* Mensagem de quem resolveu (autor ou gestor) — ver
                  CLAUDE.md, "mensagem opcional... ao resolver". */}
              {problem.resolutionNote && (
                <Typography variant="body2" sx={{ mt: 1, color: TINTA }}>
                  {problem.resolutionNote}
                </Typography>
              )}
              {problem.resolutionRating && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
                  <Typography variant="body2" sx={{ color: ARDOSIA }}>
                    Avaliação do autor:
                  </Typography>
                  <Rating value={problem.resolutionRating} readOnly size="small" />
                </Stack>
              )}
              {/* Comentário opcional do autor ao avaliar (estilo Uber/iFood,
                  ver Mapa.tsx) — pra qualquer visitante. Diferente da
                  resolutionNote acima: aqui é o retorno de quem avaliou
                  depois, não a mensagem de quem resolveu. */}
              {problem.resolutionFeedback && (
                <Typography variant="body2" sx={{ mt: 1, color: ARDOSIA, fontStyle: 'italic' }}>
                  "{problem.resolutionFeedback}"
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {voteError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVoteError(null)}>
            {voteError}
          </Alert>
        )}
        {resolveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setResolveError(null)}>
            {resolveError}
          </Alert>
        )}

        {/* minHeight 44px — padrão de acessibilidade de área de toque mínima
            pra ação primária em mobile; o Button "medium" default do MUI
            fica em ~36px, curto demais pro dedo. */}
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }}>
          {/* Destaque em Sinalização (contained) quando o usuário JÁ votou —
              o voto em si é o resultado a reforçar visualmente, não o
              convite pra votar; sem voto ainda, o botão fica outlined. */}
          <Button
            variant={voted ? 'contained' : 'outlined'}
            onClick={() => void handleToggleVote()}
            disabled={voteSubmitting}
            sx={{ minHeight: 44 }}
          >
            {voteSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : voted ? (
              `Remover voto (${problem._count.votes})`
            ) : (
              `Votar (${problem._count.votes})`
            )}
          </Button>

          {canResolve && (
            <Button
              variant="outlined"
              color="success"
              onClick={() => setResolveDialogOpen(true)}
              sx={{ minHeight: 44 }}
            >
              Marcar como resolvido
            </Button>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <SectionLabel>Comentários ({comments.length})</SectionLabel>

        <Stack spacing={2} sx={{ mb: 3 }}>
          {comments.map((comment) => (
            <Box key={comment.id}>
              <Typography sx={{ fontFamily: MONO, fontSize: '0.75rem', color: TEXTO_SECUNDARIO }}>
                {comment.user.name} · {formatDate(comment.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {comment.text}
              </Typography>
              {user?.id === comment.user.id && (
                <Button
                  size="small"
                  color="error"
                  onClick={() => void handleDeleteComment(comment.id)}
                  sx={{ mt: 0.5, px: 0 }}
                >
                  Excluir
                </Button>
              )}
            </Box>
          ))}
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhum comentário ainda.
            </Typography>
          )}
        </Stack>

        {user ? (
          <Box component="form" onSubmit={handleCommentSubmit}>
            {commentError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {commentError}
              </Alert>
            )}
            <TextField
              label="Escreva um comentário"
              fullWidth
              required
              multiline
              minRows={2}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={commentSubmitting}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 1, minHeight: 44 }}
              disabled={commentSubmitting}
            >
              {commentSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Comentar'
              )}
            </Button>
          </Box>
        ) : (
          <Alert severity="info">
            <Button component={RouterLink} to="/login" size="small">
              Entre
            </Button>{' '}
            para comentar.
          </Alert>
        )}
      </Box>

      <Dialog open={resolveDialogOpen} onClose={closeResolveDialog} fullWidth maxWidth="xs">
        <DialogTitle>Marcar como resolvido</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isAuthor
              ? 'Avaliação opcional da solução (1 a 5 estrelas) e uma mensagem opcional sobre a resolução.'
              : 'Mensagem opcional sobre a resolução, visível pra quem acompanha o problema.'}
          </DialogContentText>
          {resolveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resolveError}
            </Alert>
          )}
          {/* Avaliação (estrelas) só quando quem resolve é o autor original
              — gestor não avalia na hora (ver CLAUDE.md, "Confirmação de
              resolução"). O backend rejeitaria um rating vindo de gestor
              não-autor mesmo que a UI deixasse passar. */}
          {isAuthor && (
            <Rating
              value={resolutionRating}
              onChange={(_event, newValue) => setResolutionRating(newValue)}
              sx={{ mb: 2 }}
            />
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
          {/* Modelo no padrão de resposta de gestão pública — só faz sentido
              pra voz institucional do gestor, não pro autor confirmando a
              própria resolução com as próprias palavras. Sem nada
              pré-preenchido (ex.: secretaria pela categoria): a app não tem
              dado confiável sobre qual órgão resolveu de fato. */}
          {!isAuthor && (
            <Button
              size="small"
              onClick={() => setResolutionNote(RESOLUTION_NOTE_TEMPLATE)}
              disabled={resolveSubmitting}
              sx={{ mt: 0.5 }}
            >
              Usar modelo
            </Button>
          )}
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
            {resolveSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
