import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import GlobalStyles from '@mui/material/GlobalStyles';
import { geocoder as createGeocoderControl, geocoders } from 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/style.css';
import { LINHA, SINAL, TEXTO_SECUNDARIO, TINTA } from '../identityColors';
import { PILOT_SEARCH_BBOX } from '../mapConfig';

// Photon (Komoot), não Nominatim: o Nominatim proíbe explicitamente
// autocomplete/busca a cada tecla no lado do cliente por política de uso
// (Nominatim.suggest() da lib lançava SuggestUnsupportedError de propósito
// pra impedir isso — daí o Enter/clique sendo a única forma de buscar até
// aqui). Photon foi desenhado pra isso: `suggest()` delega direto pra
// `geocode()`, sem bloqueio. Continua sem chave de API/cartão de crédito
// (mesmo critério de custo zero do CLAUDE.md), e roda sobre os mesmos dados
// do OpenStreetMap — só muda o provedor da consulta.
//
// Custo/limite visível (pra Seção 4.2 do artigo): o `photon.komoot.io`
// público é declarado pela própria Komoot como instância de demonstração/
// avaliação, não uma API com SLA formal pra produção — mais informal que a
// política do Nominatim (que ao menos documenta um limite de ~1 req/s). O
// `suggestTimeout` abaixo (debounce: só busca depois de uma pausa na
// digitação) e o `limit` nos query params mantêm o volume de requisições
// razoável pro teste com cidadãos.
// Escape manual porque esses dados vêm de fora (OSM via Photon) e vão
// direto pro innerHTML do item da lista de sugestões (ver _createAlt em
// control.ts: `a.innerHTML = a.innerHTML + result.html`) — sem isso, um
// nome de lugar malicioso no OSM viraria HTML/script executado na página.
// Mesma cautela que o htmlTemplate default do Nominatim já tinha via
// util.ts/template() da própria lib, só que reimplementada aqui porque
// esse helper não é exportado publicamente pelo pacote.
function escapeHtml(value: string): string {
  const escapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;',
  };
  return value.replace(/[&<>"'`]/g, (ch) => escapes[ch]);
}

interface PhotonFeature {
  properties?: {
    name?: string;
    housenumber?: string;
    locality?: string;
    district?: string;
    city?: string;
  };
}

// Por padrão o Photon só mostra `name` na lista de sugestões — em ruas com
// nome repetido em bairros diferentes (comum, OSM não garante nome único
// por rua num município), os resultados ficavam idênticos na lista, sem
// diferencial pra escolher o certo (relatado depois da troca de provedor).
// `locality`/`district` (o mais próximo de "bairro" nos dados do OSM via
// Photon — nem toda via tem os dois, `filter(Boolean)` cobre a ausência)
// numa segunda linha, em tom secundário, resolve a ambiguidade sem
// atrapalhar a leitura do nome principal.
function photonResultHtml(feature: PhotonFeature): string {
  const p = feature.properties ?? {};
  const primary = escapeHtml([p.name, p.housenumber].filter(Boolean).join(', '));
  const secondaryParts = [p.locality, p.district, p.city].filter(
    (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index,
  );
  if (secondaryParts.length === 0) {
    return primary;
  }
  const secondary = escapeHtml(secondaryParts.join(', '));
  return `${primary}<br/><span class="leaflet-control-geocoder-address-context">${secondary}</span>`;
}

const photonGeocoder = geocoders.photon({
  // Usado como fallback de texto puro (ex.: título da lista quando
  // htmlTemplate não se aplica) — mesma ordem de bairro/cidade do template
  // HTML acima, pra ficar consistente se algum dia cair no fallback.
  nameProperties: ['name', 'street', 'housenumber', 'locality', 'district', 'city'],
  htmlTemplate: photonResultHtml,
  geocodingQueryParams: {
    limit: '5',
    // Restringe (não só prioriza) os resultados à bbox da cidade-piloto —
    // ver PILOT_SEARCH_BBOX em mapConfig.ts. Testado direto contra a API:
    // sem isso, uma busca por "Rua Senhor do Bonfim" também trazia ruas de
    // outras cidades brasileiras (era o motivo do problema relatado antes).
    bbox: PILOT_SEARCH_BBOX,
  },
});

// data: URI construído em JS (encodeURIComponent), não escrito à mão em
// percent-encoding — assim dá pra trocar a cor do ícone (padrão da lib vem
// com stroke preto fixo, embutido no CSS) reaproveitando os mesmos tokens
// de identityColors.ts usados no resto do app.
function svgIcon(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const SEARCH_ICON_SVG = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><line x1="20" y1="20" x2="15.5" y2="15.5"/></svg>`;

// Mesmo spinner animado (SMIL) do CSS default da lib — só troca o stroke
// preto pela Sinalização, pra combinar com o ícone de busca em repouso.
const THROBBER_ICON_SVG = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" stroke="${color}" stroke-linecap="round" stroke-width="1.6" viewBox="0 0 24 24"><g><path stroke-opacity=".1" d="M14 8.4l3-5"/><path stroke-opacity=".2" d="M15.6 10l5-3"/><path stroke-opacity=".3" d="M16.2 12H22"/><path stroke-opacity=".4" d="M15.6 14l5 3m-6.5-1.4l2.9 5"/><path stroke-opacity=".5" d="M12 16.2V22m-2-6.4l-3 5"/><path stroke-opacity=".6" d="M8.4 14l-5 3"/><path stroke-opacity=".7" d="M7.8 12H2"/><path stroke-opacity=".8" d="M8.4 10l-5-3"/><path stroke-opacity=".9" d="M10 8.4l-3-5"/><path d="M12 7.8V2"/><animateTransform attributeName="transform" calcMode="discrete" dur="1s" repeatCount="indefinite" type="rotate" values="0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12"/></g></svg>`;

// Tinta em rgba, não um cinza/preto genérico — mesma cor usada nas sombras
// de .prob no doc de identidade (rgba(32,34,31,...)), só que aqui pra um
// controle flutuante sobre o mapa (elevação real, cabe sombra mais visível
// que a de um cartão em repouso).
const SHADOW = '0 2px 6px rgba(32,34,31,0.15)';
const SHADOW_FOCUS = `0 0 0 3px rgba(255,107,53,0.16), ${SHADOW}`;

// Componente auxiliar: assim como FitBounds/MapClickHandler em pages/Mapa.tsx,
// precisa viver dentro de <MapContainer> pra usar useMap(). O controle do
// Leaflet é imperativo (não tem wrapper oficial no react-leaflet), então é
// adicionado/removido do mapa via efeito, não renderizado como JSX.
export function GeocoderControl() {
  const map = useMap();

  useEffect(() => {
    const control = createGeocoderControl({
      geocoder: photonGeocoder,
      collapsed: false,
      placeholder: 'Buscar endereço ou local...',
      errorMessage: 'Nenhum local encontrado.',
      queryMinLength: 3,
      // Busca ao vivo: dispara depois de 3+ caracteres, 350ms depois de
      // parar de digitar (um pouco acima do default de 250ms da lib — a
      // instância pública do Photon é só de demonstração, ver comentário
      // acima, então vale um debounce levemente mais folgado). Só passa a
      // fazer efeito agora: com Nominatim, suggestMinLength/suggestTimeout
      // ficavam inertes, porque o listener de digitação nunca chegava a
      // ser registrado (ver histórico do componente).
      suggestMinLength: 3,
      suggestTimeout: 350,
      // O pin default do resultado de busca (ver control.ts, markGeocode)
      // fica visualmente idêntico a um problema registrado no mapa — o
      // usuário confunde um com o outro. Desligamos o marcador padrão e só
      // reaproveitamos o fitBounds dele abaixo, sem adicionar marcador.
      defaultMarkGeocode: false,
    }).addTo(map);

    control.on('markgeocode', (event) => {
      map.fitBounds(event.geocode.bbox);
    });

    return () => {
      control.remove();
    };
  }, [map]);

  // Overrides de estilo pra alinhar o controle (biblioteca de terceiros,
  // CSS/HTML próprios, não componentes React) à identidade visual do Vicina
  // — ver docs/Vicina_Identidade_Visual.html, seções PALETA/TIPOGRAFIA/
  // COMPONENTES: mesmo raio de 10px e borda 1.5px de .field, mesma cor de
  // foco (Sinalização + halo), mesmo tom de hover leve (#FFF3EE) de .vote.
  // GlobalStyles (não um .css solto) porque é assim que o resto do app
  // estiliza — tudo via MUI/Emotion, sem arquivo .css próprio.
  return (
    <GlobalStyles
      styles={{
        // Sem display:flex aqui de propósito: o container tem 4 filhos
        // diretos na lib (ícone, form, mensagem de erro, lista de
        // alternativas — todos irmãos, sem wrapper). Ícone+form já são
        // inline-block (CSS default da lib) e ficam lado a lado sozinhos;
        // erro/alternativas são <div>/<ul> em block, então já quebram linha
        // por conta própria. Um flex no container bagunçaria essa pilha.
        '.leaflet-bar.leaflet-control-geocoder': {
          backgroundColor: '#FFFFFF',
          border: `1.5px solid ${LINHA}`,
          // 10px — o raio de "controle" do doc de identidade (14px é pra
          // cartão). Um controle discreto não precisa de um raio maior só
          // porque ficou fisicamente maior antes; eram dois ajustes
          // separados que eu misturei.
          borderRadius: 10,
          boxShadow: SHADOW,
          overflow: 'hidden',
          transition: 'box-shadow 0.16s ease, border-color 0.16s ease',
        },
        '.leaflet-bar.leaflet-control-geocoder:focus-within': {
          borderColor: SINAL,
          boxShadow: SHADOW_FOCUS,
        },
        '.leaflet-control-geocoder-icon': {
          width: 44,
          height: 44,
          minWidth: 44,
          verticalAlign: 'middle',
          backgroundColor: 'transparent',
          backgroundImage: svgIcon(SEARCH_ICON_SVG(TEXTO_SECUNDARIO)),
          backgroundSize: 18,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: 0,
        },
        '.leaflet-touch .leaflet-control-geocoder-icon': {
          width: 44,
          height: 44,
        },
        '.leaflet-control-geocoder-throbber .leaflet-control-geocoder-icon': {
          backgroundImage: svgIcon(THROBBER_ICON_SVG(SINAL)),
        },
        '.leaflet-control-geocoder-form': {
          verticalAlign: 'middle',
        },
        // Largura fixa no desktop, não fluida com a viewport: era esse o
        // erro de design, não o valor em si. Toda referência de busca sobre
        // mapa (Google/Apple/Bing Maps, o geocoder oficial do Mapbox GL)
        // usa uma caixa de largura fixa e discreta no desktop — ela não
        // compete em tamanho com o mapa, que é o conteúdo principal da
        // tela. 360px é literalmente a largura default do
        // mapboxgl-ctrl-geocoder oficial, não um chute. "Pega a tela quase
        // toda" é comportamento de mobile (pouco espaço sobrando), por
        // isso vira uma regra à parte abaixo, não uma função contínua da
        // viewport.
        '.leaflet-control-geocoder-form input': {
          width: 360,
          height: 44,
          boxSizing: 'border-box',
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: '0.95rem',
          color: TINTA,
          padding: '0 14px 0 2px',
          border: 'none',
          background: 'transparent',
          // input[type=search] tem chrome nativo (borda/cantos) em
          // Chrome/Safari que ignora o restante do estilo aplicado aqui.
          WebkitAppearance: 'none',
          appearance: 'none',
        },
        '.leaflet-control-geocoder-form input::placeholder': {
          color: TEXTO_SECUNDARIO,
          opacity: 1,
        },
        // Breakpoint de mobile (não fluido): aqui sim ela ocupa quase a
        // largura toda, porque no celular não sobra espaço pra manter os
        // 360px fixos do desktop sem cortar o mapa — mesma lógica do
        // Google Maps no celular.
        '@media (max-width: 640px)': {
          '.leaflet-control-geocoder-form input': {
            width: 'calc(100vw - 96px)',
          },
        },
        '.leaflet-control-geocoder-alternatives': {
          // Default da lib é width:272px fixo — mais estreito que a caixa
          // (ícone + input, responsiva, ver acima) daqui, ficaria
          // desalinhado à direita.
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: '0.875rem',
          color: TINTA,
          borderTop: `1px solid ${LINHA}`,
          maxHeight: 260,
          overflowY: 'auto',
        },
        '.leaflet-control-geocoder-alternatives li': {
          padding: '10px 14px',
          borderBottom: `1px solid ${LINHA}`,
          lineHeight: 1.4,
        },
        '.leaflet-control-geocoder-alternatives li:last-child': {
          borderBottom: 'none',
        },
        '.leaflet-control-geocoder-alternatives li:hover, .leaflet-control-geocoder-selected': {
          backgroundColor: '#FFF3EE',
        },
        // Classe usada pela segunda linha (bairro/cidade) de
        // photonResultHtml() acima.
        '.leaflet-control-geocoder-address-context': {
          color: TEXTO_SECUNDARIO,
          fontSize: '0.8rem',
          display: 'block',
          marginTop: 2,
        },
        '.leaflet-control-geocoder-error': {
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: '0.85rem',
          color: TEXTO_SECUNDARIO,
          padding: '10px 14px',
          margin: 0,
          borderTop: `1px solid ${LINHA}`,
        },
      }}
    />
  );
}
