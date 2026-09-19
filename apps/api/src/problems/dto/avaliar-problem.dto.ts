import { IsInt, Max, Min } from 'class-validator';

// PATCH /problems/:id/avaliar — avaliação assíncrona (ver CLAUDE.md,
// "Avaliação assíncrona... ao resolver"), diferente de ResolveProblemDto:
// aqui resolutionRating é obrigatório (é a própria ação de avaliar,
// pedida pelo modal do Mapa quando o autor tem resolução pendente de nota).
export class AvaliarProblemDto {
  @IsInt({ message: 'resolutionRating deve ser um número inteiro' })
  @Min(1, { message: 'resolutionRating deve ser entre 1 e 5' })
  @Max(5, { message: 'resolutionRating deve ser entre 1 e 5' })
  resolutionRating: number;
}
