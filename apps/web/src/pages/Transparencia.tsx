import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { ARDOSIA, ARDOSIA_TINTA, LINHA, PAPEL_ALT, SINAL, TEXTO_SECUNDARIO, TINTA } from '../identityColors';
import { ApiError } from '../services/apiClient';
import { getPublicStats, type PublicStats } from '../services/transparenciaService';

const SERIF = "'Instrument Serif', serif";
const MONO = "'IBM Plex Mono', monospace";

// Dashboard público de transparência (ver CLAUDE.md, decisão "Dashboard
// público (transparência)") — reforça a crítica de Pinho (2008) à falta de
// transparência real em portais de governo eletrônico, já citada na
// fundamentação teórica do artigo. Sem login, sem dado individual: só os
// agregados de GET /transparencia/estatisticas (ver
// services/transparenciaService.ts e apps/api/.../transparencia/).
//
// Escopo de uma cidade só (Feira de Santana) — sem seletor de município,
// sem entidade Município: registrado como trabalho futuro no CLAUDE.md,
// não expandir aqui.
//
// Visual reaproveita boa parte do PainelGestor (mesma paleta/tipografia,
// mesmo padrão de tile de métrica) — é a mesma informação em versão
// pública, faz sentido ter a mesma cara.
export function Transparencia() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch((error: unknown) => {
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'Não foi possível carregar os dados de transparência.',
        );
      });
  }, []);

  const categoriasOrdenadas = stats
    ? [...stats.porCategoria].sort((a, b) => b.total - a.total)
    : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography
          component="h1"
          sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2.25rem', color: TINTA }}
        >
          Transparência
        </Typography>
        <Typography variant="body2" sx={{ color: TEXTO_SECUNDARIO, mb: 3, maxWidth: '62ch' }}>
          Dados agregados e públicos sobre os problemas urbanos reportados em Feira de Santana.
          Sem necessidade de login — a transparência vale pra qualquer visitante.
        </Typography>

        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {!stats && !loadError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="stretch">
            <Box
              sx={{
                flex: { md: '3 1 0' },
                backgroundColor: '#FFFFFF',
                border: `1px solid ${LINHA}`,
                borderRadius: '16px',
                padding: '22px',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: '12px',
                }}
              >
                <StatTile
                  value={stats.total}
                  label="Total de problemas registrados"
                  background={PAPEL_ALT}
                  valueColor={TINTA}
                  labelColor={TEXTO_SECUNDARIO}
                />
                <StatTile
                  value={`${stats.percentualResolvidos}%`}
                  label="Resolvidos"
                  caption={`${stats.resolvidos} resolvidos · ${stats.abertos} em aberto`}
                  background={ARDOSIA_TINTA}
                  valueColor={ARDOSIA}
                  labelColor={ARDOSIA}
                />
                <StatTile
                  value={
                    stats.tempoMedioResolucaoDias === null
                      ? '—'
                      : stats.tempoMedioResolucaoDias.toLocaleString('pt-BR')
                  }
                  label={
                    stats.tempoMedioResolucaoDias === null
                      ? 'Sem problema resolvido ainda'
                      : 'Dias até resolver, em média'
                  }
                  background={PAPEL_ALT}
                  valueColor={TINTA}
                  labelColor={TEXTO_SECUNDARIO}
                />
              </Box>
            </Box>

            <Box
              sx={{
                flex: { md: '2 1 0' },
                backgroundColor: PAPEL_ALT,
                border: `1px solid ${LINHA}`,
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
              }}
            >
              <Eyebrow sx={{ mb: 1 }}>Por categoria</Eyebrow>
              {categoriasOrdenadas.length > 0 ? (
                <BarChart
                  layout="horizontal"
                  series={[{ data: categoriasOrdenadas.map((c) => c.total), color: SINAL }]}
                  yAxis={[{ scaleType: 'band', data: categoriasOrdenadas.map((c) => c.categoria) }]}
                  height={Math.max(180, categoriasOrdenadas.length * 40)}
                  margin={{ left: 150, right: 16, top: 8, bottom: 24 }}
                  hideLegend
                />
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                  <Typography variant="body2" sx={{ color: TEXTO_SECUNDARIO, textAlign: 'center' }}>
                    Nenhum problema registrado ainda.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        ) : null}
      </Box>
    </Container>
  );
}

function Eyebrow({ children, sx }: { children: string; sx?: object }) {
  return (
    <Typography
      sx={{
        fontFamily: MONO,
        fontSize: '0.6875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: TEXTO_SECUNDARIO,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

function StatTile({
  value,
  label,
  caption,
  background,
  valueColor,
  labelColor,
}: {
  value: number | string;
  label: string;
  caption?: string;
  background: string;
  valueColor: string;
  labelColor: string;
}) {
  return (
    <Box sx={{ backgroundColor: background, borderRadius: '11px', padding: '13px' }}>
      <Typography sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2rem', lineHeight: 1, color: valueColor }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: labelColor, mt: 0.5 }}>{label}</Typography>
      {caption && (
        <Typography sx={{ fontFamily: MONO, fontSize: '0.6875rem', color: labelColor, mt: 0.5, opacity: 0.85 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}
