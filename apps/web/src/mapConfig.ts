// Configuração de mapa compartilhada entre o Mapa real (pages/Mapa.tsx) e a
// ilustração de mapa da Home (pages/Home.tsx) — mesma cidade-piloto, mesmo
// provedor de tiles, um só lugar pra atualizar se algum dia mudar.

// Centro de Feira de Santana, BA — cidade-piloto definida para a validação
// empírica (ver CLAUDE.md).
export const FALLBACK_CENTER: [number, number] = [-12.2597, -38.9647];
export const FALLBACK_ZOOM = 13;

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Bounding box ao redor da cidade-piloto, usada pra restringir a busca de
// endereço do geocoder (ver components/GeocoderControl.tsx) — o teste
// empírico é só em Feira de Santana, então resultado de outra cidade/país é
// ruído, não recurso. Margem de 0.25° (~28km) cobre a área do município com
// folga, sem depender de um shapefile do limite administrativo exato.
// Formato exigido pelo Photon: "minLon,minLat,maxLon,maxLat" (ordem
// diferente do "viewbox" do Nominatim, usado antes de trocar de provedor —
// ver GeocoderControl.tsx pro porquê da troca).
const PILOT_BBOX_MARGIN_DEG = 0.25;
const [PILOT_LAT, PILOT_LON] = FALLBACK_CENTER;
export const PILOT_SEARCH_BBOX = [
  PILOT_LON - PILOT_BBOX_MARGIN_DEG,
  PILOT_LAT - PILOT_BBOX_MARGIN_DEG,
  PILOT_LON + PILOT_BBOX_MARGIN_DEG,
  PILOT_LAT + PILOT_BBOX_MARGIN_DEG,
].join(',');
