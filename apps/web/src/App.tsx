import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { DetalheProblema } from './pages/DetalheProblema';
import { Login } from './pages/Login';
import { Mapa } from './pages/Mapa';
import { PainelGestor } from './pages/PainelGestor';

// Shell de rotas do app.
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/mapa" element={<Mapa />} />
      <Route path="/problemas/:id" element={<DetalheProblema />} />
      <Route path="/painel-gestor" element={<PainelGestor />} />
    </Routes>
  );
}

function Home() {
  const { user, loading, logout } = useAuth();

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Vicina
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Plataforma digital colaborativa para participação cidadã.
        </Typography>

        <Box sx={{ mt: 4 }}>
          {loading ? (
            <CircularProgress size={24} />
          ) : user ? (
            <Stack spacing={2} alignItems="center">
              <Typography>
                Olá, <strong>{user.name}</strong> (
                {user.role === 'GESTOR' ? 'gestor' : 'cidadão'})
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button component={RouterLink} to="/mapa" variant="contained">
                  Ver mapa
                </Button>
                {user.role === 'GESTOR' && (
                  <Button component={RouterLink} to="/painel-gestor" variant="outlined">
                    Painel do gestor
                  </Button>
                )}
                <Button variant="outlined" onClick={() => void logout()}>
                  Sair
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2} alignItems="center">
              <Button component={RouterLink} to="/mapa" variant="outlined">
                Ver mapa
              </Button>
              <Button component={RouterLink} to="/login" variant="contained">
                Entrar ou criar conta
              </Button>
            </Stack>
          )}
        </Box>
      </Box>
    </Container>
  );
}
