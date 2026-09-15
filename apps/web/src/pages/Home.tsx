import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ARDOSIA,
  ARDOSIA_PROFUNDA,
  LINHA,
  PAPEL,
  SINAL,
  SINAL_CLARA,
  SINAL_ESCURA,
} from '../identityColors';

// Página de apresentação do projeto — vira figura da Seção 4 do artigo (ver
// CLAUDE.md, "Melhorias possíveis" item 2). Conteúdo e tom seguem o
// vocabulário já registrado em docs/Vicina_Identidade_Visual.html (seção
// TOM DE VOZ: direto, sem burocratês) — várias frases abaixo são as que já
// estão especificadas lá como exemplo de copy do próprio app, não texto novo.
//
// Layout deliberadamente assimétrico (texto de um lado, figura do outro;
// seções em grid 2 colunas em vez de blocos centralizados empilhados) —
// tudo centralizado e em cards idênticos é o que faz uma landing page
// parecer gerada por template. A ilustração do hero recompõe o mesmo
// mockup de mapa + pin + cartão de voto já desenhado na identidade visual
// (seção "MARCA EM USO"), só que como card widescreen em vez de tela de
// celular.
export function Home() {
  return (
    <Box>
      <Container maxWidth="lg">
        <Hero />
      </Container>

      <Container maxWidth="lg">
        <ComoFunciona />
      </Container>

      <Container maxWidth="lg">
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
    <Box
      component="section"
      sx={{
        pt: { xs: 6, md: 10 },
        pb: { xs: 6, md: 8 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
        gap: { xs: 5, md: 7 },
        alignItems: 'center',
      }}
    >
      <Box>
        <Eyebrow>Participação cidadã</Eyebrow>
        <Typography
          component="h1"
          sx={{
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4rem' },
            lineHeight: 1.05,
            letterSpacing: '-.01em',
            color: 'text.primary',
          }}
        >
          Sua rua, sua voz.
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.125rem' }, maxWidth: '50ch', mt: 2.5 }}>
          Registre o problema onde ele está, veja o que outros cidadãos já apontaram e
          acompanhe até resolver. Sem formulário longo, sem protocolo perdido.
        </Typography>
      </Box>

      <HeroIlustracao />
    </Box>
  );
}

// Recompõe, como card widescreen, o mesmo mockup de produto já desenhado na
// identidade visual (mapa com pins + cartão de voto) — em vez de um ícone
// genérico, é a própria interface do app que ilustra a proposta.
function HeroIlustracao() {
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        border: `1px solid ${LINHA}`,
        boxShadow: '0 24px 48px rgba(23,29,29,.14)',
        aspectRatio: '4 / 3.2',
        // Malha do mapa — valor exato de docs/Vicina_Identidade_Visual.html
        // (seção "Vocabulário de fundos"), usada lá pro estado vazio/loading.
        backgroundImage:
          'linear-gradient(0deg, transparent 21px, rgba(35,43,43,.07) 22px), linear-gradient(90deg, transparent 21px, rgba(35,43,43,.07) 22px)',
        backgroundSize: '22px 22px',
        backgroundColor: '#EAEAE4',
      }}
    >
      <Box sx={{ position: 'absolute', top: '14%', left: '12%' }}>
        <PinMarker variant="aberto" size={24} />
      </Box>
      <Box sx={{ position: 'absolute', top: '10%', left: '70%' }}>
        <PinMarker variant="resolvido" size={22} />
      </Box>
      <Box sx={{ position: 'absolute', top: '28%', left: '44%' }}>
        <PinMarker variant="selecionado" size={46} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: '#fff',
          borderRadius: '18px 18px 0 0',
          boxShadow: '0 -6px 22px rgba(32,34,31,.1)',
          p: 2.5,
        }}
      >
        <Box sx={{ width: 34, height: 4, borderRadius: '2px', bgcolor: LINHA, mx: 'auto', mb: 1.5 }} />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 52,
              borderRadius: '12px',
              border: `1.5px solid ${LINHA}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', lineHeight: 1 }}>
              27
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>votos</Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', lineHeight: 1.2 }} noWrap>
              Poste apagado na Getúlio Vargas
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Box
                component="span"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  bgcolor: '#FFE4D6',
                  color: '#A63D14',
                  px: 1.1,
                  py: 0.3,
                  borderRadius: '999px',
                }}
              >
                Aberto
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>há 4 dias</Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

function ComoFunciona() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, borderTop: `1px solid ${LINHA}` }}>
      <Box sx={{ maxWidth: '60ch', mb: { xs: 5, md: 6 } }}>
        <Eyebrow>Como funciona</Eyebrow>
        <Typography
          component="h2"
          sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: { xs: '2rem', md: '2.5rem' }, color: 'text.primary' }}
        >
          Registre. Vote. Acompanhe.
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'block' },
            position: 'absolute',
            top: 28,
            left: 'calc(100% / 6)',
            right: 'calc(100% / 6)',
            height: '1px',
            bgcolor: LINHA,
          }}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 5, sm: 3, md: 4 } }}>
          <StepCard
            number="01"
            title="Registrar"
            description="Marque o local no mapa, escolha a categoria e descreva o problema. Leva menos de um minuto."
            icon={<PinIcon />}
          />
          <StepCard
            number="02"
            title="Votar"
            description="Viu um problema que também te afeta? Vote. Quanto mais votos, mais prioridade ele ganha."
            icon={<ArrowUpIcon />}
          />
          <StepCard
            number="03"
            title="Acompanhar"
            description="Siga o problema até ele ser resolvido. Quem registrou confirma quando acabou de verdade."
            icon={<EyeIcon />}
          />
        </Box>
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
    <Box sx={{ position: 'relative' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: PAPEL,
            border: `1.5px solid ${LINHA}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.75rem', lineHeight: 1, color: LINHA }}>
          {number}
        </Typography>
      </Stack>
      <Typography component="h3" sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '1.4rem', mb: 0.75 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{description}</Typography>
    </Box>
  );
}

function Ideais() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 9 }, borderTop: `1px solid ${LINHA}` }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.85fr 1.15fr' }, gap: { xs: 4, md: 7 } }}>
        <Box>
          <Eyebrow>Por que o Vicina existe</Eyebrow>
          <Typography
            component="h2"
            sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: { xs: '2rem', md: '2.5rem' }, color: 'text.primary' }}
          >
            Transparência antes de tudo.
          </Typography>
        </Box>

        <Stack spacing={0} divider={<Box sx={{ height: '1px', bgcolor: LINHA }} />}>
          <IdealItem number="01" title="Tudo à vista">
            Todo problema registrado fica público no mapa, do primeiro dia até a solução.
            Sem processo escondido, sem número de protocolo que ninguém consegue acompanhar.
          </IdealItem>
          <IdealItem number="02" title="Prioridade é da rua">
            Quem vota decide o que pesa mais. A ordem das demandas nasce de quem vive o
            problema, não de uma planilha fechada.
          </IdealItem>
        </Stack>
      </Box>
    </Box>
  );
}

function IdealItem({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2.5, py: 3 }}>
      <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'text.secondary', pt: 0.5 }}>
        {number}
      </Typography>
      <Box>
        <Typography component="h3" sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '1.4rem', mb: 0.75 }}>
          {title}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>{children}</Typography>
      </Box>
    </Box>
  );
}

function CtaFinal() {
  return (
    <Box sx={{ bgcolor: ARDOSIA, py: { xs: 8, md: 10 } }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', mb: 3 }}>
          <svg width="40" height="48" viewBox="0 0 200 200" aria-hidden="true">
            <path
              d="M46 40 L74 40 L100 130 L126 40 L154 40 L114 172 L86 172 Z"
              fill={ARDOSIA_PROFUNDA}
              transform="translate(8,5)"
            />
            <path d="M46 40 L74 40 L100 130 L126 40 L154 40 L114 172 L82 172 Z" fill={SINAL} />
            <path d="M46 40 L74 40 L100 130 L86 172 Z" fill={SINAL_CLARA} opacity={0.45} />
          </svg>
        </Box>
        <Typography
          component="h2"
          sx={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: { xs: '2rem', md: '2.75rem' }, color: PAPEL, mb: 4 }}
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

// Pin do mapa — path exato de docs/Vicina_Identidade_Visual.html (seção
// "SÍMBOLOS" / "Pin com V"). "selecionado" é a variante com o entalhe do V
// visível, usada como marcador em foco da ilustração do hero.
function PinMarker({ variant, size = 32 }: { variant: 'aberto' | 'resolvido' | 'selecionado'; size?: number }) {
  const shadow = variant === 'resolvido' ? ARDOSIA_PROFUNDA : SINAL_ESCURA;
  const main = variant === 'resolvido' ? ARDOSIA : SINAL;
  return (
    <svg width={size} height={size * 1.22} viewBox="0 0 200 200" aria-hidden="true">
      <path
        d="M100 178 C68 138 42 112 42 84 A58 58 0 0 1 158 84 C158 112 132 138 100 178 Z"
        fill={shadow}
        transform="translate(7,4)"
      />
      <path d="M100 178 C68 138 42 112 42 84 A58 58 0 0 1 158 84 C158 112 132 138 100 178 Z" fill={main} />
      {variant === 'selecionado' && (
        <path d="M74 56 L100 118 L126 56 L146 56 L100 152 L54 56 Z" fill={PAPEL} />
      )}
    </svg>
  );
}

// Ícones de linha desenhados à mão pro trio de passos — evita puxar
// @mui/icons-material só por três símbolos (ver CLAUDE.md, "simplicidade
// sobre generalização"); esse pacote fica reservado pra quando os ícones de
// categoria do pin forem implementados de fato.
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
