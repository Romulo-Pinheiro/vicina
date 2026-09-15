import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { getCategoryIcon } from './categoryIcons';
import { ARDOSIA, ARDOSIA_PROFUNDA, PAPEL, SINAL, SINAL_ESCURA } from './identityColors';
import type { ProblemStatus } from './services/problemsService';

// Path exato do "Pin com V" — docs/Vicina_Identidade_Visual.html (seção
// "SÍMBOLOS"). Sem o entalhe do V aqui: no tamanho de marcador de mapa, o
// entalhe vira ruído (mesma lógica do "só aparece quando há espaço" já
// descrita na identidade visual) — a cor por status já carrega o
// significado principal, e o ícone de categoria ocupa o espaço que sobra.
const PIN_PATH =
  'M100 178 C68 138 42 112 42 84 A58 58 0 0 1 158 84 C158 112 132 138 100 178 Z';

const SIZE = 34;
const HEIGHT = SIZE * 1.22;

// Cache module-level: só 2 status × 6 categorias (12 combinações fixas),
// não vale a pena recalcular/re-renderizar o mesmo ícone a cada marcador
// em cada re-render do mapa.
const cache = new Map<string, L.DivIcon>();

// renderToStaticMarkup não roda efeitos do React — e é via um desses
// mecanismos (useInsertionEffect) que o Emotion (motor de CSS-in-JS do MUI)
// insere a regra .MuiSvgIcon-root (que define fill: currentColor) no
// <head>. Sem essa regra, o <svg> do ícone fica com o fill padrão do SVG
// (preto), invisível sobre um pin escuro. Por isso extraímos só o
// conteúdo interno (os <path>/<circle> do glifo) e embrulhamos num <svg>
// próprio com fill explícito — ainda é o desenho de @mui/icons-material,
// só sem depender da classe CSS do MUI que nunca seria inserida aqui.
function renderCategoryIconSvg(categoryName: string, size: number): string {
  const CategoryIcon = getCategoryIcon(categoryName);
  const raw = renderToStaticMarkup(<CategoryIcon />);
  const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${PAPEL}" style="display:block">${inner}</svg>`;
}

// Ícone do marcador do mapa: cor = status (Sinalização/aberto, Ardósia/
// resolvido — ver CLAUDE.md, "Codificação visual do pin"), ícone de
// categoria sobreposto em branco no miolo do pin (ver
// apps/api/src/prisma/seed.ts pra taxonomia). Usa @mui/icons-material via
// renderToStaticMarkup porque o Leaflet precisa de uma string HTML pronta
// pro L.divIcon, não de uma árvore React montada.
export function getPinIcon(status: ProblemStatus, categoryName: string): L.DivIcon {
  const key = `${status}:${categoryName}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const shadow = status === 'RESOLVIDO' ? ARDOSIA_PROFUNDA : SINAL_ESCURA;
  const main = status === 'RESOLVIDO' ? ARDOSIA : SINAL;
  const iconMarkup = renderCategoryIconSvg(categoryName, SIZE * 0.42);

  const html = `
    <div style="position:relative;width:${SIZE}px;height:${HEIGHT}px;">
      <svg width="${SIZE}" height="${HEIGHT}" viewBox="0 0 200 200">
        <path d="${PIN_PATH}" fill="${shadow}" transform="translate(7,4)" />
        <path d="${PIN_PATH}" fill="${main}" />
      </svg>
      <div style="position:absolute;top:34%;left:50%;transform:translate(-50%,-50%);line-height:0;">
        ${iconMarkup}
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: '', // limpa a classe default do Leaflet (senão vem com fundo/borda branca quadrada)
    iconSize: [SIZE, HEIGHT],
    iconAnchor: [SIZE / 2, HEIGHT], // ponta do pin encosta exatamente na coordenada
    popupAnchor: [0, -HEIGHT],
  });
  cache.set(key, icon);
  return icon;
}
