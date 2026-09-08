import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // isGlobal: true — não precisa reimportar ConfigModule em cada módulo de
    // domínio (auth, problems, votes, comments) conforme forem criados.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
})
export class AppModule {}
