import { useState, type FormEvent, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../services/apiClient';

type Mode = 'login' | 'register';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleModeChange(_event: SyntheticEvent, newMode: Mode): void {
    setMode(newMode);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      // Provisório: sem página Mapa ainda, volta pra home (que já reflete o
      // usuário logado). Vira redirect pro Mapa quando essa página existir.
      navigate('/');
    } catch (err) {
      // Erros de validação do backend (class-validator) chegam como uma
      // única string com as mensagens já concatenadas — ver apiClient.ts.
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom textAlign="center">
            Vicina
          </Typography>

          <Tabs
            value={mode}
            onChange={handleModeChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Entrar" value="login" />
            <Tab label="Criar conta" value="register" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <TextField
                label="Nome"
                fullWidth
                required
                margin="normal"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={submitting}
              />
            )}
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Senha"
              type="password"
              fullWidth
              required
              margin="normal"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              helperText={mode === 'register' ? 'Mínimo de 8 caracteres' : undefined}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={submitting}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === 'login' ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
