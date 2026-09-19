import { useState, type MouseEvent, type ReactNode } from 'react';
import { Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
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
  LINHA,
  NAV_INATIVO,
  PAPEL,
  SINAL,
  SINAL_CLARA,
  SINAL_ESCURA,
  TINTA,
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
  // Abaixo do breakpoint "sm" os itens de navegação não cabem numa linha só
  // ao lado da wordmark + menu de usuário (mediram ~100px de AppBar, duas
  // linhas, no teste em ~375px) — viram um Drawer atrás de um hambúrguer.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function handleOpenMenu(event: MouseEvent<HTMLElement>): void {
    setAnchorEl(event.currentTarget);
  }

  function handleCloseMenu(): void {
    setAnchorEl(null);
  }

  async function handleLogout(): Promise<void> {
    handleCloseMenu();
    setMobileNavOpen(false);
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
        <Toolbar sx={{ gap: { xs: 1.5, sm: 3 }, py: 1 }}>
          <IconButton
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menu de navegação"
            sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: PAPEL, mr: -0.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Wordmark />

          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{ flex: 1, display: { xs: 'none', sm: 'flex' } }}
          >
            <NavItem to="/mapa">Mapa</NavItem>
            {/* Pública de propósito — sem checagem de user aqui, ao contrário
                do link de painel-gestor logo abaixo (ver decisão "Dashboard
                público (transparência)" no CLAUDE.md). */}
            <NavItem to="/transparencia">Transparência</NavItem>
            {user?.role === 'GESTOR' && <NavItem to="/painel-gestor">Painel do gestor</NavItem>}
          </Stack>

          {/* Empurra o menu de usuário/"Entrar" pra direita quando o Stack
              acima está escondido (xs) e não sobra nenhum flex:1 no meio. */}
          <Box sx={{ flex: { xs: 1, sm: 0 } }} />

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

      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        // Só existe abaixo de "sm" — acima disso os links já aparecem
        // direto na AppBar (Stack escondido em xs logo acima).
        sx={{ display: { xs: 'block', sm: 'none' } }}
        slotProps={{ paper: { sx: { width: 240, bgcolor: PAPEL } } }}
      >
        <List sx={{ pt: 2 }} onClick={() => setMobileNavOpen(false)}>
          <MobileNavLink to="/mapa">Mapa</MobileNavLink>
          <MobileNavLink to="/transparencia">Transparência</MobileNavLink>
          {user?.role === 'GESTOR' && (
            <MobileNavLink to="/painel-gestor">Painel do gestor</MobileNavLink>
          )}
        </List>
        {user && (
          <>
            <Divider sx={{ borderColor: LINHA }} />
            <List>
              <ListItemButton onClick={() => void handleLogout()}>
                <Typography sx={{ fontFamily: "'IBM Plex Sans', sans-serif", color: TINTA }}>
                  Sair
                </Typography>
              </ListItemButton>
            </List>
          </>
        )}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}

// Item de navegação do Drawer mobile — precisa de cores próprias porque o
// Drawer abre sobre Papel (fundo claro), diferente da AppBar sobre Ardósia
// (fundo escuro) de onde o NavItem original foi pensado.
function MobileNavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      sx={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '1rem',
        fontWeight: 500,
        color: TINTA,
        py: 1.5,
        '&.active': { color: SINAL },
      }}
    >
      {children}
    </ListItemButton>
  );
}
