import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../services/apiClient';
import { listProblems, type Problem } from '../services/problemsService';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// Painel do gestor — decisão de escopo (ver CLAUDE.md, "Fora de escopo" e
// "Decisões já tomadas"): o público de teste do protótipo são cidadãos, não
// gestores públicos. Esta página existe só pra sustentar a descrição da
// arquitetura na Seção 4 do artigo (mostrar que o papel GESTOR tem um lugar
// na aplicação), sem validação empírica prevista e sem profundidade de
// produto — por isso é só leitura (nenhuma ação de gestão, ex.: triagem,
// exclusão, categorização manual, foi implementada aqui). Reaproveita o
// GET /problems público já existente; não há endpoint dedicado a gestor no
// backend porque nenhuma consulta ou ação exclusiva dele foi necessária.
export function PainelGestor() {
  const { user, loading: authLoading } = useAuth();

  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isGestor = user?.role === 'GESTOR';

  useEffect(() => {
    if (!isGestor) {
      return;
    }
    listProblems()
      .then(setProblems)
      .catch((error: unknown) => {
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os problemas.',
        );
      });
  }, [isGestor]);

  const stats = useMemo(() => {
    if (!problems) {
      return null;
    }
    const abertos = problems.filter((problem) => problem.status === 'ABERTO').length;
    const resolvidos = problems.length - abertos;
    const totalVotos = problems.reduce((sum, problem) => sum + problem._count.votes, 0);
    return { total: problems.length, abertos, resolvidos, totalVotos };
  }, [problems]);

  if (authLoading) {
    return (
      <Box
        sx={{
          height: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isGestor) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning">
            Esta página é restrita a contas de gestor. Sua conta é do tipo{' '}
            <strong>cidadão</strong>.
          </Alert>
          <Button component={RouterLink} to="/mapa" sx={{ mt: 2 }}>
            Voltar ao mapa
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Painel do gestor
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Visão geral dos problemas reportados pelos cidadãos, somente leitura.
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {!problems ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap' }}>
              <StatCard label="Total de problemas" value={stats!.total} />
              <StatCard label="Em aberto" value={stats!.abertos} />
              <StatCard label="Resolvidos" value={stats!.resolvidos} />
              <StatCard label="Votos acumulados" value={stats!.totalVotos} />
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Votos</TableCell>
                    <TableCell align="right">Comentários</TableCell>
                    <TableCell>Autor</TableCell>
                    <TableCell>Criado em</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {problems.map((problem) => (
                    <TableRow key={problem.id} hover>
                      <TableCell>
                        <RouterLink to={`/problemas/${problem.id}`}>
                          {problem.title}
                        </RouterLink>
                      </TableCell>
                      <TableCell>{problem.category.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={problem.status === 'ABERTO' ? 'Aberto' : 'Resolvido'}
                          size="small"
                          color={problem.status === 'ABERTO' ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="right">{problem._count.votes}</TableCell>
                      <TableCell align="right">{problem._count.comments}</TableCell>
                      <TableCell>{problem.author.name}</TableCell>
                      <TableCell>{formatDate(problem.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {problems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Nenhum problema registrado ainda.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Container>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined" sx={{ minWidth: 160 }}>
      <CardContent>
        <Typography variant="h5">{value}</Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
