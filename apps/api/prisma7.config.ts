// Carrega .env explicitamente: diferente do restante do projeto (NestJS lê
// .env sozinho via ConfigModule), o Prisma CLI não popula process.env antes
// de avaliar este arquivo — sem isso, env('DATABASE_URL') abaixo falha.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 parou de ler o campo "prisma.schema" do package.json — o CLI agora
// procura por este arquivo (nome de convenção "prisma7.config.ts") na raiz
// do projeto. Mantém o schema em src/prisma/ conforme a estrutura de pastas
// definida em CLAUDE.md, em vez de mover pra raiz de apps/api.
//
// datasource.url é usada só pelo CLI (migrate, studio, db push) — o
// PrismaClient em runtime não lê mais daqui, precisa do driver adapter
// (@prisma/adapter-pg) instanciado em src/prisma/prisma.service.ts.
export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
