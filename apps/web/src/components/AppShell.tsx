import { useState, type MouseEvent, type ReactNode } from 'react';
import { Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { useAuth } from '../auth/AuthContext';
import {
  ARDOSIA,
  ARDOSIA_PROFUNDA,
  NAV_INATIVO,
  PAPEL,
  SINAL,
  SINAL_CLARA,
  SINAL_ESCURA,
} from '../identityColors';

// react-router acrescenta a classe "active" sozinho quando a rota do link
// bate com a URL atual (mesmo passando um className string fixo) — por
// isso dá pra estilizar o estado ativo com o seletor "&.active" abaixo, sem
// precisar de lógica de isActive manual.
const NavItem = styled(NavLink)({
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: '0.95rem',
  fontWeight: 500,
  textDecoration: 'none',
  color: NAV_INATIVO,
  padding: '6px 2px',
  transition: 'color .16s',
  '&:hover, &.active': {
    color: PAPEL,
  },
});

function Wordmark() {
  return (
    <Box
      component={RouterLink}
      to="/"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
    >
      {/* V sólido sobre Ardósia — path exato da identidade visual (variante
          "sobre ardósia": sombra e lavagem clara ficam sutis sobre o fundo
          escuro em vez da sombra mais contrastada usada sobre Papel). */}
      <svg width="18" height="22" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <path
          d="M46 40 L74 40 L100 130 L126 40 L154 40 L114 172 L86 172 Z"
          fill={ARDOSIA_PROFUNDA}
          transform="translate(8,5)"
        />
        <path d="M46 40 L74 40 L100 130 L126 40 L154 40 L114 172 L82 172 Z" fill={SINAL} />
        <path d="M46 40 L74 40 L100 130 L86 172 Z" fill={SINAL_CLARA} opacity={0.45} />
      </svg>
      <Typography sx={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', color: PAPEL, lineHeight: 1 }}>
        Vicina
      </Typography>
    </Box>
  );
}

// Navegação persistente, compartilhada por todas as rotas (ver App.tsx).
// Substitui os botões de navegação/logout que antes viviam soltos e
// duplicados em cada página (Home, Mapa, PainelGestor, DetalheProblema).
export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  function handleOpenMenu(event: MouseEvent<HTMLElement>): void {
    setAnchorEl(event.currentTarget);
  }

  function handleCloseMenu(): void {
    setAnchorEl(null);
  }

  async function handleLogout(): Promise<void> {
    handleCloseMenu();
    await logout();
    navigate('/');
  }

  return (
    // Layout em coluna com altura de viewport fixa: a AppBar ocupa sua
    // altura natural e o <main> herda o restante via flex:1. Isso evita
    // calcular a altura da AppBar na mão (56px mobile vs 64px desktop, ou
    // duas linhas se o Toolbar quebrar num telão estreito) — o Mapa, que
    // antes assumia 100vh pra si sozinho, agora só precisa preencher 100%
    // deste <main> (ver Mapa.tsx).
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: ARDOSIA, borderBottom: `1px solid ${ARDOSIA_PROFUNDA}` }}
      >
        <Toolbar sx={{ gap: 3, flexWrap: 'wrap', rowGap: 1, py: 1 }}>
          <Wordmark />

          <Stack direction="row" spacing={3} alignItems="center" sx={{ flex: 1 }}>
            <NavItem to="/mapa">Mapa</NavItem>
            {user?.role === 'GESTOR' && <NavItem to="/painel-gestor">Painel do gestor</NavItem>}
          </Stack>

          {loading ? (
            <CircularProgress size={20} sx={{ color: NAV_INATIVO }} />
          ) : user ? (
            <>
              <Button
                onClick={handleOpenMenu}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl)}
                sx={{
                  textTransform: 'none',
                  color: PAPEL,
                  gap: 1,
                  '&:hover': { bgcolor: 'rgba(250,250,248,.08)' },
                }}
              >
                <Avatar sx={{ width: 28, height: 28, bgcolor: SINAL, fontSize: '0.85rem' }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {user.name}
                </Box>
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                <MenuItem onClick={() => void handleLogout()}>Sair</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              disableElevation
              sx={{
                bgcolor: SINAL,
                color: '#fff',
                borderRadius: '10px',
                px: 2.5,
                fontWeight: 500,
                textTransform: 'none',
                boxShadow: `0 1px 0 ${SINAL_ESCURA}, 0 6px 16px rgba(255,107,53,.28)`,
                '&:hover': { bgcolor: SINAL_CLARA },
              }}
            >
              Entrar
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
