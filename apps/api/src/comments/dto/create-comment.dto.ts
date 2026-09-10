import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID('4', { message: 'problemId deve ser um UUID válido' })
  problemId: string;

  @IsString()
  @MinLength(1, { message: 'Comentário não pode ser vazio' })
  @MaxLength(1000, { message: 'Comentário deve ter no máximo 1000 caracteres' })
  text: string;
}
