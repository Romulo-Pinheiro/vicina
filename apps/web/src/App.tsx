import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Route, Routes } from 'react-router-dom';

// Shell de rotas do app. Só a home provisória por enquanto — Login, Mapa,
// DetalheProblema e PainelGestor entram como rotas próprias em src/pages/
// conforme forem implementados (ver estrutura de pastas em CLAUDE.md); não
// criadas ainda como arquivos vazios para não deixar stubs no repositório.
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

function Home() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Vicina
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Plataforma digital colaborativa para participação cidadã.
        </Typography>
      </Box>
    </Container>
  );
}
