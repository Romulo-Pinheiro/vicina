import { createTheme } from '@mui/material/styles';

// Paleta minimalista e neutra — adequada a um protótipo acadêmico, sem
// investimento em identidade visual própria (fora do escopo do TCC).
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // verde — associação comum a espaço público/cidade
    },
    background: {
      default: '#F5F5F5',
    },
  },
  shape: {
    borderRadius: 8,
  },
});
