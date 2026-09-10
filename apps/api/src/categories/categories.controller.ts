import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

// Público e somente leitura: a taxonomia municipal é fixa, gerenciada só
// pelo seed (ver CLAUDE.md, "Categorias de problema") — sem
// POST/PATCH/DELETE aqui de propósito, não há rota de administração.
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }
}
