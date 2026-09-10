import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ResolveProblemDto {
  // Opcional: o autor pode marcar como resolvido sem avaliar a solução.
  @IsOptional()
  @IsInt({ message: 'resolutionRating deve ser um número inteiro' })
  @Min(1, { message: 'resolutionRating deve ser entre 1 e 5' })
  @Max(5, { message: 'resolutionRating deve ser entre 1 e 5' })
  resolutionRating?: number;
}
