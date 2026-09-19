import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ResolveProblemDto {
  // Opcional, e só aceito quando quem resolve é o autor original — o
  // service rejeita se vier de um gestor não-autor (ver
  // ProblemsService.resolve). Não dá pra expressar essa regra aqui: depende
  // de quem está chamando, não só do formato do payload.
  @IsOptional()
  @IsInt({ message: 'resolutionRating deve ser um número inteiro' })
  @Min(1, { message: 'resolutionRating deve ser entre 1 e 5' })
  @Max(5, { message: 'resolutionRating deve ser entre 1 e 5' })
  resolutionRating?: number;

  // Opcional pra quem resolver, autor ou gestor (ver CLAUDE.md, "mensagem
  // opcional... ao resolver").
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'resolutionNote deve ter no máximo 500 caracteres' })
  resolutionNote?: string;
}
