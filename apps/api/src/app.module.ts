import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CommentsModule } from './comments/comments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProblemsModule } from './problems/problems.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    // isGlobal: true — não precisa reimportar ConfigModule em cada módulo de
    // domínio (auth, problems, votes, comments) conforme forem criados.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProblemsModule,
    VotesModule,
    CommentsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
