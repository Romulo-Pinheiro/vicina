import { IsUUID } from 'class-validator';

export class CreateVoteDto {
  @IsUUID('4', { message: 'problemId deve ser um UUID válido' })
  problemId: string;
}
