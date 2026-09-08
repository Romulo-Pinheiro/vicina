-- Renomeia tabelas e colunas para snake_case (padrão de nomenclatura do
-- Postgres), refletindo os @@map/@map adicionados em schema.prisma.
-- Usa ALTER TABLE ... RENAME em vez de DROP/CREATE (que `prisma migrate dev`
-- geraria por padrão nesse tipo de mudança) para preservar os dados já
-- existentes — em especial o seed de categorias municipais.
-- Nomes de constraint/index (ex.: "Problem_pkey", "Vote_problemId_userId_key")
-- são mantidos como estão: não afetam o funcionamento e renomeá-los é apenas
-- cosmético, sem necessidade concreta.

-- RenameTable
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Category" RENAME TO "categories";
ALTER TABLE "Problem" RENAME TO "problems";
ALTER TABLE "Vote" RENAME TO "votes";
ALTER TABLE "Comment" RENAME TO "comments";

-- RenameColumn (users)
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";

-- RenameColumn (problems)
ALTER TABLE "problems" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "problems" RENAME COLUMN "authorId" TO "author_id";
ALTER TABLE "problems" RENAME COLUMN "resolvedAt" TO "resolved_at";
ALTER TABLE "problems" RENAME COLUMN "resolutionRating" TO "resolution_rating";
ALTER TABLE "problems" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "problems" RENAME COLUMN "updatedAt" TO "updated_at";

-- RenameColumn (votes)
ALTER TABLE "votes" RENAME COLUMN "problemId" TO "problem_id";
ALTER TABLE "votes" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "votes" RENAME COLUMN "createdAt" TO "created_at";

-- RenameColumn (comments)
ALTER TABLE "comments" RENAME COLUMN "problemId" TO "problem_id";
ALTER TABLE "comments" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "comments" RENAME COLUMN "createdAt" TO "created_at";
