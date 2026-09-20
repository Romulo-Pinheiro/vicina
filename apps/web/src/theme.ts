import { createTheme } from '@mui/material/styles';

// Paleta oficial da identidade visual do Vicina — ver
// docs/Vicina_Identidade_Visual.html. Sinalização é a única cor de ação
// primária do app (um botão em destaque por tela); Papel é o fundo padrão
// de todas as telas (nunca branco puro); Tinta é o texto de corpo (nunca
// preto puro). Ardósia (barra de navegação) vive só no AppShell, que é a
// única superfície escura do app — não faz sentido como token global aqui.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6B35', // Sinalização
      light: '#FF8F63',
      dark: '#C44F22',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAF8', // Papel
      paper: '#FFFDFB',
    },
    text: {
      primary: '#20221F', // Tinta
      secondary: '#5B6169',
    },
  },
  typography: {
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    // O hover default do MUI pra um botão "contained" escurece usando
    // palette.primary.dark (aqui, #C44F22) — mas a identidade visual manda
    // o oposto pro botão primário (.btn-p:hover no doc): clareia pra
    // Sinalização clara. Sem este override central, cada botão "contained"
    // precisaria repetir '&:hover':{bgcolor:SINAL_CLARA} na mão (só
    // Home.tsx/AppShell.tsx faziam isso até agora — o resto do app, como o
    // "Ver detalhes" do popup do mapa ou o "Confirmar" dos dialogs, ficava
    // com o escurecimento default, destoando do laranja da marca).
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#FF8F63', // Sinalização clara
          },
        },
      },
    },
  },
});
