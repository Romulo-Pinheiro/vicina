// Executado via `npx prisma db seed` (comando configurado em
// migrations.seed do prisma7.config.ts) ou diretamente com
// `npx ts-node src/prisma/seed.ts`. Roda fora do contexto do Nest — por
// isso carrega o .env manualmente, no mesmo espírito de prisma7.config.ts.
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Taxonomia restrita a temas de esfera municipal (ver CLAUDE.md,
// "Categorias de problema") — não há classificação automática por esfera
// administrativa; problemas fora da alçada municipal são triados
// manualmente pelo gestor, como já ocorre em canais de ouvidoria.
const CATEGORIES = [
  'Infraestrutura urbana',
  'Iluminação pública',
  'Limpeza urbana',
  'Transporte municipal',
  'Mobilidade',
  'Segurança pública local',
];

const logger = new Logger('PrismaSeed');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não definida — configure apps/api/.env (ver .env.example)',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    // upsert em vez de createMany: torna o seed idempotente — pode rodar de
    // novo (ex.: depois de recriar o banco local) sem duplicar categorias
    // nem falhar por violar a constraint @unique em Category.name.
    for (const name of CATEGORIES) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      logger.log(`Categoria garantida: ${name}`);
    }
    logger.log(`Seed concluído: ${CATEGORIES.length} categorias municipais.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error('Falha ao rodar o seed de categorias', error as Error);
  process.exit(1);
});
