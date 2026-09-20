import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Rating from '@mui/material/Rating';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LatLngBounds, type LatLng, type Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../leaflet-icon-fix';
import { useAuth } from '../auth/AuthContext';
import { getCategoryIcon } from '../categoryIcons';
import { GeocoderControl } from '../components/GeocoderControl';
import { ARDOSIA, ARDOSIA_PROFUNDA, PAPEL, SINAL, SINAL_ESCURA } from '../identityColors';
import { FALLBACK_CENTER, FALLBACK_ZOOM, OSM_ATTRIBUTION, OSM_TILE_URL } from '../mapConfig';
import { getPinIcon } from '../mapPinIcon';
import { ApiError } from '../services/apiClient';
import { listCategories, type Category } from '../services/categoriesService';
import {
  avaliarProblem,
  createProblem,
  listPendingEvaluation,
  listProblems,
  type Problem,
} from '../services/problemsService';

// FALLBACK_CENTER (Feira de Santana, BA — cidade-piloto, ver CLAUDE.md) é
// usado só quando ainda não há nenhum problema cadastrado (sem pontos pra
// calcular bounds via FitBounds).

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function Mapa() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ref pro Map do Leaflet (não pro <div>): react-leaflet v5 encaminha o ref
  // do MapContainer pra instância do mapa (ver node_modules/react-leaflet/
  // lib/MapContainer.js) — é assim que handleConfirmPlacing lê o centro
  // exato da viewport sem precisar de um componente filho com useMap() só
  // pra isso.
  const mapRef = useRef<LeafletMap | null>(null);

  // Modo "colocando um problema" (padrão "soltar pin" do Google Maps, ver
  // CLAUDE.md): ativado pelo Fab, o pin fica fixo no centro da viewport (via
  // CSS, ver PlacementPinOverlay) e é o mapa que se move por baixo dele —
  // não é mais um clique direto no mapa que define a posição.
  const [placing, setPlacing] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<LatLng | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Avaliação assíncrona estilo Uber/iFood (ver CLAUDE.md) — gatilho passivo
  // ao abrir o Mapa autenticado, sem push/e-mail (fora de escopo). null =
  // nada pendente (ou ainda não checou); guarda só o primeiro item — se
  // houver mais de um problema pendente de avaliação, não encadeia, o
  // próximo login pergunta de novo (ver GET /problems/pendentes-avaliacao).
  const [pendingEvaluation, setPendingEvaluation] = useState<Problem | null>(null);
  const [evaluationRating, setEvaluationRating] = useState<number | null>(null);
  // Comentário opcional, estilo Uber/iFood (nota + relato livre) — vai pra
  // Problem.resolutionFeedback, separado da resolutionNote de quem resolveu.
  const [evaluationFeedback, setEvaluationFeedback] = useState('');
  const [evaluationSubmitting, setEvaluationSubmitting] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listProblems(), listCategories()])
      .then(([problemsResult, categoriesResult]) => {
        setProblems(problemsResult);
        setCategories(categoriesResult);
      })
      .catch((error: unknown) => {
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar o mapa. Tente recarregar a página.',
        );
      });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    listPendingEvaluation()
      .then((pending) => setPendingEvaluation(pending[0] ?? null))
      .catch(() => {
        // Silencioso de propósito: isso é um lembrete oportunista, não uma
        // função crítica da tela — um erro aqui não deve travar o mapa nem
        // exigir um Alert dedicado.
      });
  }, [user]);

  function handleAddClick(): void {
    if (!user) {
      navigate('/login');
      return;
    }
    setPlacing(true);
  }

  function handleCancelPlacing(): void {
    setPlacing(false);
  }

  function handleConfirmPlacing(): void {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    // getCenter() lê o centro atual da viewport no momento do clique — é
    // exatamente o ponto que o PlacementPinOverlay aponta visualmente,
    // porque o overlay fica fixo no centro geométrico do mesmo container do
    // MapContainer (ver sx do Box de overlay mais abaixo).
    setPendingLocation(map.getCenter());
    setPlacing(false);
  }

  function dismissEvaluation(): void {
    // "Agora não" — fecha sem salvar nada, sem marcar dispensa. Reaparece no
    // próximo login (trade-off aceito de escopo de protótipo, ver
    // CLAUDE.md: não implementar dispensa permanente).
    setPendingEvaluation(null);
    setEvaluationRating(null);
    setEvaluationFeedback('');
    setEvaluationError(null);
  }

  async function handleEvaluationSubmit(): Promise<void> {
    if (!pendingEvaluation || evaluationRating === null) {
      return;
    }
    setEvaluationError(null);
    setEvaluationSubmitting(true);
    try {
      await avaliarProblem(pendingEvaluation.id, {
        resolutionRating: evaluationRating,
        resolutionFeedback: evaluationFeedback.trim() ? evaluationFeedback.trim() : undefined,
      });
      dismissEvaluation();
    } catch (error) {
      setEvaluationError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível registrar sua avaliação agora.',
      );
    } finally {
      setEvaluationSubmitting(false);
    }
  }

  function closeDialog(): void {
    setPendingLocation(null);
    setTitle('');
    setDescription('');
    setCategoryId('');
    setIsAnonymous(false);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!pendingLocation) {
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const created = await createProblem({
        title,
        description,
        categoryId,
        latitude: pendingLocation.lat,
        longitude: pendingLocation.lng,
        isAnonymous,
      });
      setProblems((current) => (current ? [...current, created] : [created]));
      setSuccessMessage('Problema registrado com sucesso.');
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível registrar o problema. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{loadError}</Alert>
      </Box>
    );
  }

  const PendingEvaluationCategoryIcon = pendingEvaluation
    ? getCategoryIcon(pendingEvaluation.category.name)
    : null;

  if (!problems) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    // 100% (não 100vh): a AppShell já reserva a altura da barra de
    // navegação via flexbox — este Box só precisa preencher o restante
    // (o <main> dela), não a viewport inteira. Ver components/AppShell.tsx.
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={FALLBACK_CENTER}
        zoom={FALLBACK_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <GeocoderControl />
        <FitBounds problems={problems} />

        {problems.map((problem) => {
          const CategoryIcon = getCategoryIcon(problem.category.name);
          return (
            <Marker
              key={problem.id}
              position={[problem.latitude, problem.longitude]}
              icon={getPinIcon(problem.status, problem.category.name)}
            >
              <Popup>
                <Stack spacing={0.5} sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2">{problem.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {problem.description}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      icon={<CategoryIcon fontSize="small" />}
                      label={problem.category.name}
                      size="small"
                    />
                    <Chip
                      label={problem.status === 'ABERTO' ? 'Aberto' : 'Resolvido'}
                      size="small"
                      color={problem.status === 'ABERTO' ? 'warning' : 'success'}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {problem._count.votes} voto(s) · {problem._count.comments} comentário(s)
                  </Typography>
                  <Button
                    component={RouterLink}
                    to={`/problemas/${problem.id}`}
                    size="small"
                    sx={{ alignSelf: 'flex-start', px: 0 }}
                  >
                    Ver detalhes
                  </Button>
                </Stack>
              </Popup>
            </Marker>
          );
        })}

        {pendingLocation && (
          <Marker position={pendingLocation}>
            <Popup>Local do novo problema</Popup>
          </Marker>
        )}
      </MapContainer>

      {placing && <PlacementPinOverlay />}

      {placing && (
        // Barra fixa (não um Alert): substitui por completo o aviso antigo
        // de "clique no mapa" — aqui não é instrução de uma ação única, é o
        // controle da etapa (confirmar/cancelar), por isso fica ancorada
        // embaixo, igual ao padrão de "soltar pin" do Google Maps/Uber.
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            bgcolor: ARDOSIA,
            borderTop: `1px solid ${ARDOSIA_PROFUNDA}`,
            px: 2,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: PAPEL, textAlign: 'center' }}>
            Mova o mapa até a ponta do pin apontar pro local do problema
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button onClick={handleCancelPlacing} sx={{ color: PAPEL }}>
              Cancelar
            </Button>
            <Button variant="contained" color="primary" onClick={handleConfirmPlacing}>
              Confirmar localização
            </Button>
          </Stack>
        </Box>
      )}

      {!placing && (
        <Fab
          color="primary"
          onClick={handleAddClick}
          sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 1000, fontSize: 24 }}
          aria-label="Registrar novo problema"
        >
          +
        </Fab>
      )}

      <Dialog
        open={pendingLocation !== null}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        // Ancorado no topo (não centralizado) abaixo de "sm": o dialog
        // centralizado por padrão do MUI, combinado com o teclado virtual
        // do celular cobrindo a metade de baixo da tela, empurra os campos
        // de baixo (Categoria, checkbox de anônimo, Registrar) pra fora da
        // área visível. Perto do topo, o teclado só cobre o que já rolou
        // pra fora por conta própria, e o usuário ainda rola o dialog.
        sx={{
          '& .MuiDialog-container': {
            alignItems: { xs: 'flex-start', sm: 'center' },
          },
        }}
        slotProps={{ paper: { sx: { mt: { xs: 4, sm: 0 } } } }}
      >
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle>Registrar problema</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Descreva o problema observado neste local.
            </DialogContentText>

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              label="Título"
              fullWidth
              required
              margin="dense"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Descrição"
              fullWidth
              required
              multiline
              minRows={3}
              margin="dense"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={submitting}
            />
            <FormControl fullWidth required margin="dense" disabled={submitting}>
              <InputLabel id="categoria-label">Categoria</InputLabel>
              <Select
                labelId="categoria-label"
                label="Categoria"
                value={categoryId}
                onChange={(event: SelectChangeEvent) => setCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              sx={{ mt: 1, alignItems: 'flex-start' }}
              disabled={submitting}
              control={
                <Checkbox
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  sx={{ pt: 0 }}
                />
              }
              label={
                <Stack sx={{ mt: '9px' }}>
                  <Typography variant="body2">Publicar como anônimo</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seu nome não aparecerá para outras pessoas — a escolha não pode ser mudada depois.
                  </Typography>
                </Stack>
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Registrar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={successMessage !== null}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />

      {/* Avaliação assíncrona (ver useEffect acima) — sem onClose ligado a
          nada: só fecha pelos botões explícitos ("Agora não" ou avaliar),
          não clicando fora nem com Esc, pra não passar batido sem querer.
          Mais contexto que uma versão anterior só com o título (categoria,
          quando foi resolvido, e a mensagem de quem resolveu, se houver) —
          o usuário pode não lembrar de cabeça qual problema é esse só pelo
          título, e o texto de quem resolveu ajuda a avaliar de fato. */}
      <Dialog open={pendingEvaluation !== null} maxWidth="xs" fullWidth>
        <DialogTitle>Como foi a resolução?</DialogTitle>
        <DialogContent>
          {pendingEvaluation && (
            <>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  icon={
                    PendingEvaluationCategoryIcon ? (
                      <PendingEvaluationCategoryIcon fontSize="small" />
                    ) : undefined
                  }
                  label={pendingEvaluation.category.name}
                  size="small"
                />
                {pendingEvaluation.resolvedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Resolvido em {formatDate(pendingEvaluation.resolvedAt)}
                  </Typography>
                )}
              </Stack>
              <DialogContentText sx={{ fontWeight: 500, color: 'text.primary' }}>
                {pendingEvaluation.title}
              </DialogContentText>
              {pendingEvaluation.resolutionNote && (
                <Alert severity="success" variant="outlined" sx={{ mt: 1.5 }}>
                  {pendingEvaluation.resolutionNote}
                </Alert>
              )}
            </>
          )}

          {evaluationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {evaluationError}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mt: 2.5, mb: 0.5 }}>
            Quantas estrelas você dá pra essa resolução?
          </Typography>
          <Rating
            value={evaluationRating}
            onChange={(_event, newValue) => setEvaluationRating(newValue)}
            size="large"
          />

          <TextField
            label="Quer contar mais? (opcional)"
            placeholder="O que funcionou, o que poderia ter sido melhor..."
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            value={evaluationFeedback}
            onChange={(event) => setEvaluationFeedback(event.target.value)}
            disabled={evaluationSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={dismissEvaluation} disabled={evaluationSubmitting}>
            Agora não
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleEvaluationSubmit()}
            disabled={evaluationSubmitting || evaluationRating === null}
          >
            {evaluationSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Avaliar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Path do "Pin com V" (com o entalhe — ao contrário do marcador de
// problema em mapPinIcon.tsx, que omite o entalhe pra não virar ruído
// repetido dezenas de vezes no mapa) — ver
// docs/Vicina_Identidade_Visual.html, seção "SÍMBOLOS". Nesse momento ainda
// não há categoria escolhida, então o símbolo genérico da marca (não um
// ícone de categoria) é o que faz sentido.
const PLACEMENT_PIN_PATH =
  'M100 178 C68 138 42 112 42 84 A58 58 0 0 1 158 84 C158 112 132 138 100 178 Z';
const PLACEMENT_PIN_NOTCH_PATH = 'M74 56 L100 118 L126 56 L146 56 L100 152 L54 56 Z';

// viewBox recortado exatamente no bounding box do desenho (pin + sombra) —
// não "0 0 200 200" como em mapPinIcon.tsx. Aqui a proporção largura×altura
// do <svg> renderizado tem que bater exatamente com a do viewBox (sem o
// letterboxing do preserveAspectRatio "meet" padrão), porque o translate
// logo abaixo usa a fração exata da ponta do pin dentro da própria caixa
// pra centralizar o alvo. x: corpo 42–158, sombra desloca +7 → 42–165.
// y: topo do círculo 84-58=26, ponta 178, sombra desloca +4 → 26–182.
const PLACEMENT_PIN_VIEWBOX = '42 26 123 156';
// Fração da ponta do pin (100,178) dentro desse viewBox — translate() em %
// é relativo ao próprio tamanho do elemento, então isso alinha a ponta
// exatamente no centro do container independente do tamanho em px
// escolhido abaixo.
const PLACEMENT_PIN_TIP_X_PCT = ((100 - 42) / 123) * 100; // ≈ 47.15%
const PLACEMENT_PIN_TIP_Y_PCT = ((178 - 26) / 156) * 100; // ≈ 97.44%
const PLACEMENT_PIN_WIDTH = 44;
const PLACEMENT_PIN_HEIGHT = PLACEMENT_PIN_WIDTH * (156 / 123);

// Pin fixo no centro da viewport — elemento CSS sobreposto ao mapa (não um
// Marker do Leaflet, que se moveria com o pan): é o mapa que se move por
// baixo dele durante o "modo de posicionamento" (ver CLAUDE.md, decisão
// "Repensar o fluxo de adicionar problema no mapa"). Cor Sinalização, a
// mesma de status "aberto": ainda não há categoria definida nesse momento.
function PlacementPinOverlay() {
  return (
    <Box
      aria-hidden="true"
      data-testid="placement-pin"
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        zIndex: 1000,
        pointerEvents: 'none',
        transform: `translate(-${PLACEMENT_PIN_TIP_X_PCT}%, -${PLACEMENT_PIN_TIP_Y_PCT}%)`,
      }}
    >
      <svg width={PLACEMENT_PIN_WIDTH} height={PLACEMENT_PIN_HEIGHT} viewBox={PLACEMENT_PIN_VIEWBOX}>
        <path d={PLACEMENT_PIN_PATH} fill={SINAL_ESCURA} transform="translate(7,4)" />
        <path d={PLACEMENT_PIN_PATH} fill={SINAL} />
        <path d={PLACEMENT_PIN_NOTCH_PATH} fill={PAPEL} />
      </svg>
    </Box>
  );
}

// Enquadra o mapa nos problemas existentes assim que a lista carrega — sem
// isso, o mapa sempre abriria no FALLBACK_CENTER mesmo com dados reais em
// outro lugar do mundo.
function FitBounds({ problems }: { problems: Problem[] }) {
  const map = useMap();

  useEffect(() => {
    if (problems.length === 0) {
      return;
    }
    const bounds = new LatLngBounds(
      problems.map((problem): [number, number] => [problem.latitude, problem.longitude]),
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [problems, map]);

  return null;
}
