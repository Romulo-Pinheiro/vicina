import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AccessibleOutlined from '@mui/icons-material/AccessibleOutlined';
import ConstructionOutlined from '@mui/icons-material/ConstructionOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DirectionsBusOutlined from '@mui/icons-material/DirectionsBusOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import LocalPoliceOutlined from '@mui/icons-material/LocalPoliceOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';

export type CategoryIconComponent = ComponentType<SvgIconProps>;

// Ícone por categoria, usado no pin do mapa e no chip do popup (ver
// pages/Mapa.tsx). Mapeado pelo nome exato da categoria — a taxonomia é
// fixa (ver apps/api/src/prisma/seed.ts e "Categorias de problema" no
// CLAUDE.md), sem rota de autocadastro que pudesse criar um nome fora
// desta lista.
const CATEGORY_ICONS: Record<string, CategoryIconComponent> = {
  'Infraestrutura urbana': ConstructionOutlined,
  'Iluminação pública': LightbulbOutlined,
  'Limpeza urbana': DeleteOutline,
  'Transporte municipal': DirectionsBusOutlined,
  Mobilidade: AccessibleOutlined,
  'Segurança pública local': LocalPoliceOutlined,
};

// PlaceOutlined é só um fallback defensivo — não deveria aparecer na
// prática, mas é melhor que renderizar nada caso o backend um dia introduza
// uma categoria fora desta lista.
export function getCategoryIcon(categoryName: string): CategoryIconComponent {
  return CATEGORY_ICONS[categoryName] ?? PlaceOutlined;
}
