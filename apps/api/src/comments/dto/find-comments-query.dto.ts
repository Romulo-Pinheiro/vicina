import { IsUUID } from 'class-validator';

// Listagem é sempre escopada a um problema — não existe "feed geral" de
// comentários, então problemId é obrigatório na query.
export class FindCommentsQueryDto {
  @IsUUID('4', { message: 'problemId deve ser um UUID válido' })
  problemId: string;
}
