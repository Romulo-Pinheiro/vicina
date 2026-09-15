import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DetalheProblema } from './pages/DetalheProblema';
import { Login } from './pages/Login';
import { Mapa } from './pages/Mapa';
import { PainelGestor } from './pages/PainelGestor';

// Shell de rotas do app. A navegação (wordmark, links, entrar/sair) é
// responsabilidade da AppShell, compartilhada por todas as rotas — ver
// components/AppShell.tsx.
export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/problemas/:id" element={<DetalheProblema />} />
        <Route path="/painel-gestor" element={<PainelGestor />} />
      </Routes>
    </AppShell>
  );
}

function Home() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Vicina
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Plataforma digital colaborativa para participação cidadã: registre problemas
          urbanos, vote e acompanhe a priorização das demandas da sua cidade.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button component={RouterLink} to="/mapa" variant="contained" size="large">
            Ver mapa
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
