// Executado via `npx prisma db seed` (comando configurado em
// migrations.seed do prisma7.config.ts) ou diretamente com
// `npx ts-node src/prisma/seed.ts`. Roda fora do contexto do Nest — por
// isso carrega o .env manualmente, no mesmo espírito de prisma7.config.ts.
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

// Mesmo custo usado em auth.service.ts — mantém o hash gerado aqui
// consistente com o resto do sistema (não é um valor mágico à parte).
const BCRYPT_SALT_ROUNDS = 10;

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

    // Conta de gestor provisionada manualmente via seed (ver CLAUDE.md,
    // "Decisões já tomadas" — não existe rota de autocadastro público para o
    // papel GESTOR, pois a concessão pressupõe vínculo institucional fora do
    // escopo técnico do protótipo). Senha e email configuráveis por env var
    // pra não deixar a credencial fixa no código-fonte; se não configurada,
    // usa um valor padrão só para ambiente de desenvolvimento local.
    const gestorEmail = process.env.SEED_GESTOR_EMAIL ?? 'gestor@vicina.local';
    const gestorPassword = process.env.SEED_GESTOR_PASSWORD ?? 'gestorSenha123';
    const hashedPassword = await bcrypt.hash(gestorPassword, BCRYPT_SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: gestorEmail },
      update: {},
      create: {
        name: 'Gestor Municipal',
        email: gestorEmail,
        password: hashedPassword,
        role: Role.GESTOR,
      },
    });
    logger.log(`Conta de gestor garantida: ${gestorEmail}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error('Falha ao rodar o seed de categorias', error as Error);
  process.exit(1);
});
