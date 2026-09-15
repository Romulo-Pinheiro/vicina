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

// Centro geométrico exato do miolo circular do pin, derivado do próprio
// path: o comando de arco "A58 58 0 0 1 158 84" liga (42,84) a (158,84) com
// raio 58 — como as duas pontas têm o mesmo y e a distância entre elas
// (116) é exatamente 2×raio, é um semicírculo com centro no meio do
// segmento: (100, 84), raio 58.
const HEAD_CX = 100;
const HEAD_CY = 84;
const ICON_VB_SIZE = 80; // tamanho do ícone em unidades do viewBox 0-200 do pin

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
// conteúdo interno (os <path>/<circle> do glifo) — ainda é o desenho de
// @mui/icons-material, só sem depender da classe CSS do MUI que nunca
// seria inserida aqui.
function extractIconInner(categoryName: string): string {
  const CategoryIcon = getCategoryIcon(categoryName);
  const raw = renderToStaticMarkup(<CategoryIcon />);
  return /<svg[^>]*>([\s\S]*)<\/svg>/.exec(raw)?.[1] ?? '';
}

// Ícone do marcador do mapa: cor = status (Sinalização/aberto, Ardósia/
// resolvido — ver CLAUDE.md, "Codificação visual do pin"), ícone de
// categoria sobreposto em branco no miolo do pin (ver
// apps/api/src/prisma/seed.ts pra taxonomia).
//
// O ícone vive num <svg> ANINHADO dentro do mesmo viewBox 0-200 do pin (em
// vez de um <div> posicionado por cima com top/left em %) — sem isso, como
// width×height do pin (34×41.48) não é quadrado igual ao viewBox (200×200),
// o SVG aplica "meet" (preserva proporção): o desenho do pin acaba
// renderizado como um quadrado menor, centralizado, com sobra em cima e
// embaixo — um posicionamento em % por fora não sabe disso e erra o
// centro. Aninhando o ícone no mesmo viewBox, os dois escalam juntos e o
// alinhamento fica exato, geometricamente, não por tentativa e erro.
export function getPinIcon(status: ProblemStatus, categoryName: string): L.DivIcon {
  const key = `${status}:${categoryName}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const shadow = status === 'RESOLVIDO' ? ARDOSIA_PROFUNDA : SINAL_ESCURA;
  const main = status === 'RESOLVIDO' ? ARDOSIA : SINAL;
  const iconInner = extractIconInner(categoryName);
  const half = ICON_VB_SIZE / 2;

  const html = `
    <svg width="${SIZE}" height="${HEIGHT}" viewBox="0 0 200 200">
      <path d="${PIN_PATH}" fill="${shadow}" transform="translate(7,4)" />
      <path d="${PIN_PATH}" fill="${main}" />
      <svg
        x="${HEAD_CX - half}"
        y="${HEAD_CY - half}"
        width="${ICON_VB_SIZE}"
        height="${ICON_VB_SIZE}"
        viewBox="0 0 24 24"
        fill="${PAPEL}"
      >${iconInner}</svg>
    </svg>
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
