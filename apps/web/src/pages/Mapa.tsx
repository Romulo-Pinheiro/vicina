import { useEffect, useState, type FormEvent } from 'react';
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
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LatLngBounds, type LatLng } from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../leaflet-icon-fix';
import { useAuth } from '../auth/AuthContext';
import { getCategoryIcon } from '../categoryIcons';
import { GeocoderControl } from '../components/GeocoderControl';
import { FALLBACK_CENTER, FALLBACK_ZOOM, OSM_ATTRIBUTION, OSM_TILE_URL } from '../mapConfig';
import { getPinIcon } from '../mapPinIcon';
import { ApiError } from '../services/apiClient';
import { listCategories, type Category } from '../services/categoriesService';
import { createProblem, listProblems, type Problem } from '../services/problemsService';

// FALLBACK_CENTER (Feira de Santana, BA — cidade-piloto, ver CLAUDE.md) é
// usado só quando ainda não há nenhum problema cadastrado (sem pontos pra
// calcular bounds via FitBounds).

export function Mapa() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modo "colocando um problema": ativado pelo Fab, desativado ao
  // cancelar/concluir o cadastro. Enquanto ativo, o próximo clique no mapa
  // vira a localização do novo problema (ver MapClickHandler abaixo).
  const [placing, setPlacing] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<LatLng | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  function handleAddClick(): void {
    if (!user) {
      navigate('/login');
      return;
    }
    setPlacing(true);
  }

  function handleMapClick(latlng: LatLng): void {
    setPendingLocation(latlng);
    setPlacing(false);
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
        center={FALLBACK_CENTER}
        zoom={FALLBACK_ZOOM}
        style={{
          height: '100%',
          width: '100%',
          cursor: placing ? 'crosshair' : undefined,
        }}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <GeocoderControl />
        <FitBounds problems={problems} />
        <MapClickHandler active={placing} onMapClick={handleMapClick} />

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

      {placing && (
        <Alert
          severity="info"
          sx={{
            position: 'absolute',
            // 68px: limpa a barra de busca do geocoder (44px de altura +
            // ~10px de margem padrão do Leaflet pros seus controles, ver
            // GeocoderControl.tsx) — com 16px os dois se sobrepunham,
            // confirmado em captura de tela em ~375px e ~768px de largura.
            top: 68,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            maxWidth: 'calc(100% - 32px)',
          }}
        >
          Clique no mapa pra marcar onde é o problema
        </Alert>
      )}

      <Fab
        color="primary"
        onClick={handleAddClick}
        sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 1000, fontSize: 24 }}
        aria-label="Registrar novo problema"
      >
        +
      </Fab>

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
    </Box>
  );
}

// Componente auxiliar: useMapEvents só funciona dentro de <MapContainer>,
// então o listener de clique precisa viver num filho dele, não no Mapa
// diretamente.
function MapClickHandler({
  active,
  onMapClick,
}: {
  active: boolean;
  onMapClick: (latlng: LatLng) => void;
}) {
  useMapEvents({
    click(event) {
      if (active) {
        onMapClick(event.latlng);
      }
    },
  });
  return null;
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
