-- AlterTable
ALTER TABLE "categories" RENAME CONSTRAINT "Category_pkey" TO "categories_pkey";

-- AlterTable
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_pkey" TO "comments_pkey";

-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "problems" RENAME CONSTRAINT "Problem_pkey" TO "problems_pkey";

-- AlterTable
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";

-- AlterTable
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_pkey" TO "votes_pkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_problemId_fkey" TO "comments_problem_id_fkey";

-- RenameForeignKey
ALTER TABLE "comments" RENAME CONSTRAINT "Comment_userId_fkey" TO "comments_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "problems" RENAME CONSTRAINT "Problem_authorId_fkey" TO "problems_author_id_fkey";

-- RenameForeignKey
ALTER TABLE "problems" RENAME CONSTRAINT "Problem_categoryId_fkey" TO "problems_category_id_fkey";

-- RenameForeignKey
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_problemId_fkey" TO "votes_problem_id_fkey";

-- RenameForeignKey
ALTER TABLE "votes" RENAME CONSTRAINT "Vote_userId_fkey" TO "votes_user_id_fkey";

-- RenameIndex
ALTER INDEX "Category_name_key" RENAME TO "categories_name_key";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "users_email_key";

-- RenameIndex
ALTER INDEX "Vote_problemId_userId_key" RENAME TO "votes_problem_id_user_id_key";
