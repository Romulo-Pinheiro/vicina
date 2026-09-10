// Fix para o ícone default do Leaflet: a lib resolve o caminho de
// marker-icon.png/marker-shadow.png via URL relativa ao próprio pacote, que
// o Vite não reescreve — sem isso os markers aparecem quebrados (ícone
// ausente). Workaround padrão da comunidade react-leaflet: reaponta pros
// assets já processados pelo bundler. Import só por efeito colateral — só
// precisa rodar uma vez antes do primeiro <MapContainer> montar (ver
// pages/Mapa.tsx).
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
