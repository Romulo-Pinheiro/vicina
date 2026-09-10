import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';

// Shell de rotas do app. Mapa, DetalheProblema e PainelGestor entram como
// rotas próprias em src/pages/ conforme forem implementados (ver estrutura
// de pastas em CLAUDE.md); não criadas ainda como arquivos vazios para não
// deixar stubs no repositório.
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
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
              <Button variant="outlined" onClick={() => void logout()}>
                Sair
              </Button>
            </Stack>
          ) : (
            <Button component={RouterLink} to="/login" variant="contained">
              Entrar ou criar conta
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
