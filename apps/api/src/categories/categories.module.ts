import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

// PrismaModule é global — não precisa reimportar aqui (mesmo padrão dos
// outros módulos de domínio).
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
