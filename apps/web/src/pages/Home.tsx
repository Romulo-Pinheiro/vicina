import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ARDOSIA, LINHA, PAPEL, PAPEL_ALT, SINAL, SINAL_CLARA, SINAL_ESCURA } from '../identityColors';

// Página de apresentação do projeto — vira figura da Seção 4 do artigo (ver
// CLAUDE.md, "Melhorias possíveis" item 2). Conteúdo e tom seguem o
// vocabulário já registrado em docs/Vicina_Identidade_Visual.html (seção
// TOM DE VOZ: direto, sem burocratês) — várias frases abaixo são as que já
// estão especificadas lá como exemplo de copy do próprio app, não texto novo.
export function Home() {
  return (
    <Box>
      <Container maxWidth="md">
        <Hero />
      </Container>

      <Container maxWidth="md">
        <ComoFunciona />
      </Container>

      <Container maxWidth="md">
        <Ideais />
      </Container>

      <CtaFinal />
    </Box>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.75rem',
        letterSpacing: '.14em',
        color: 'text.secondary',
        textTransform: 'uppercase',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

function Hero() {
  return (
    <Box component="section" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
      <Typography
        component="h1"
        sx={{
          fontFamily: "'Instrument Serif', serif",
          fontWeight: 400,
          fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4.25rem' },
          lineHeight: 1.05,
          letterSpacing: '-.01em',
          color: 'text.primary',
        }}
      >
        Sua rua, sua voz.
      </Typography>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: { xs: '1rem', md: '1.125rem' },
          maxWidth: '58ch',
          mx: 'auto',
          mt: 2.5,
        }}
      >
        Registre o problema onde ele está, veja o que outros cidadãos já apontaram e
        acompanhe até resolver. Sem formulário longo, sem protocolo perdido.
      </Typography>
    </Box>
  );
}

function ComoFunciona() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 }, borderTop: `1px solid ${LINHA}` }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
        <Eyebrow>Como funciona</Eyebrow>
        <Typography
          component="h2"
          sx={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            fontSize: { xs: '2rem', md: '2.5rem' },
            color: 'text.primary',
          }}
        >
          Registre. Vote. Acompanhe.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        <StepCard
          number="1"
          title="Registrar"
          description="Marque o local no mapa, escolha a categoria e descreva o problema. Leva menos de um minuto."
          icon={<PinIcon />}
        />
        <StepCard
          number="2"
          title="Votar"
          description="Viu um problema que também te afeta? Vote. Quanto mais votos, mais prioridade ele ganha."
          icon={<ArrowUpIcon />}
        />
        <StepCard
          number="3"
          title="Acompanhar"
          description="Siga o problema até ele ser resolvido. Quem registrou confirma quando acabou de verdade."
          icon={<EyeIcon />}
        />
      </Box>
    </Box>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Box>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          bgcolor: PAPEL_ALT,
          border: `1px solid ${LINHA}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.7rem',
          letterSpacing: '.1em',
          color: 'text.secondary',
          mb: 0.5,
        }}
      >
        PASSO {number}
      </Typography>
      <Typography
        component="h3"
        sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '1.5rem', mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{description}</Typography>
    </Box>
  );
}

function Ideais() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 }, borderTop: `1px solid ${LINHA}` }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
        <Eyebrow>Por que o Vicina existe</Eyebrow>
        <Typography
          component="h2"
          sx={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            fontSize: { xs: '2rem', md: '2.5rem' },
            color: 'text.primary',
          }}
        >
          Transparência antes de tudo.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
        <IdealCard title="Tudo à vista">
          Todo problema registrado fica público no mapa, do primeiro dia até a solução.
          Sem processo escondido, sem número de protocolo que ninguém consegue acompanhar.
        </IdealCard>
        <IdealCard title="Prioridade é da rua">
          Quem vota decide o que pesa mais. A ordem das demandas nasce de quem vive o
          problema, não de uma planilha fechada.
        </IdealCard>
      </Box>
    </Box>
  );
}

function IdealCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: PAPEL_ALT, borderRadius: '16px', p: { xs: 3, md: 4 } }}>
      <Typography
        component="h3"
        sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '1.5rem', mb: 1 }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{children}</Typography>
    </Box>
  );
}

function CtaFinal() {
  return (
    <Box sx={{ bgcolor: ARDOSIA, py: { xs: 8, md: 10 } }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography
          component="h2"
          sx={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            fontSize: { xs: '2rem', md: '2.75rem' },
            color: PAPEL,
            mb: 4,
          }}
        >
          A rua tem prioridade.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={RouterLink}
            to="/mapa"
            disableElevation
            sx={{
              bgcolor: SINAL,
              color: '#fff',
              borderRadius: '10px',
              px: 3,
              py: 1.25,
              fontWeight: 500,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: `0 1px 0 ${SINAL_ESCURA}, 0 6px 16px rgba(255,107,53,.28)`,
              '&:hover': { bgcolor: SINAL_CLARA },
            }}
          >
            Ver mapa
          </Button>
          <Button
            component={RouterLink}
            to="/login?mode=register"
            sx={{
              color: PAPEL,
              border: `1.5px solid ${PAPEL}`,
              borderRadius: '10px',
              px: 3,
              py: 1.25,
              fontWeight: 500,
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': { bgcolor: PAPEL, color: ARDOSIA },
            }}
          >
            Criar conta
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

// Ícones de linha desenhados à mão pro trio de passos — evita puxar
// @mui/icons-material só por três símbolos simples (ver CLAUDE.md,
// "simplicidade sobre generalização"); esse pacote fica reservado pra
// quando os ícones de categoria do pin forem implementados de fato.
function PinIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={SINAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c-4.2-4.6-6.5-8-6.5-11a6.5 6.5 0 1 1 13 0c0 3-2.3 6.4-6.5 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={SINAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8" />
      <path d="M8.5 11.5 12 8l3.5 3.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={SINAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}
