import {
  IsLatitude,
  IsLongitude,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProblemDto {
  @IsString()
  @MinLength(3, { message: 'Título deve ter ao menos 3 caracteres' })
  @MaxLength(120, { message: 'Título deve ter no máximo 120 caracteres' })
  title: string;

  @IsString()
  @MinLength(10, { message: 'Descrição deve ter ao menos 10 caracteres' })
  @MaxLength(2000, { message: 'Descrição deve ter no máximo 2000 caracteres' })
  description: string;

  // Categoria é uma FK para a taxonomia fixa (ver seed) — não é um enum aqui
  // porque a lista de categorias vive no banco, não no código (facilita
  // ajustar a taxonomia sem deploy, embora não haja rota para isso agora).
  @IsUUID('4', { message: 'categoryId deve ser um UUID válido' })
  categoryId: string;

  @IsLatitude({ message: 'Latitude inválida' })
  latitude: number;

  @IsLongitude({ message: 'Longitude inválida' })
  longitude: number;
}
