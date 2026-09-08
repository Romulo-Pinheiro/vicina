import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

// Shell inicial do frontend — as páginas reais (Login, Mapa, DetalheProblema,
// PainelGestor) e o roteamento entre elas entram em src/pages/ conforme forem
// implementadas (ver estrutura de pastas em CLAUDE.md). Não criadas ainda
// como arquivos vazios para não deixar stubs no repositório.
export function App() {
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
