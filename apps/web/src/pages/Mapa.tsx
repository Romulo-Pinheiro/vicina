import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import FormControl from '@mui/material/FormControl';
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
import { ApiError } from '../services/apiClient';
import { listCategories, type Category } from '../services/categoriesService';
import { createProblem, listProblems, type Problem } from '../services/problemsService';

// Centro de Feira de Santana, BA — cidade-piloto definida para a validação
// empírica (ver CLAUDE.md). Usado só quando ainda não há nenhum problema
// cadastrado (sem pontos pra calcular bounds via FitBounds).
const FALLBACK_CENTER: [number, number] = [-12.2597, -38.9647];
const FALLBACK_ZOOM = 13;

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
          height: '100vh',
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
    <Box sx={{ position: 'relative', height: '100vh', width: '100%' }}>
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
        <FitBounds problems={problems} />
        <MapClickHandler active={placing} onMapClick={handleMapClick} />

        {problems.map((problem) => (
          <Marker key={problem.id} position={[problem.latitude, problem.longitude]}>
            <Popup>
              <Stack spacing={0.5} sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2">{problem.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {problem.description}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Chip label={problem.category.name} size="small" />
                  <Chip
                    label={problem.status === 'ABERTO' ? 'Aberto' : 'Resolvido'}
                    size="small"
                    color={problem.status === 'ABERTO' ? 'warning' : 'success'}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {problem._count.votes} voto(s) · {problem._count.comments} comentário(s)
                </Typography>
              </Stack>
            </Popup>
          </Marker>
        ))}

        {pendingLocation && (
          <Marker position={pendingLocation}>
            <Popup>Local do novo problema</Popup>
          </Marker>
        )}
      </MapContainer>

      {placing && (
        <Alert
          severity="info"
          sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
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

      <Dialog open={pendingLocation !== null} onClose={closeDialog} fullWidth maxWidth="xs">
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
