import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Nome deve ter ao menos 2 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  // 8 caracteres: mínimo razoável para um protótipo — sem exigência de
  // caracteres especiais/maiúsculas, o que adicionaria complexidade de UX
  // não justificada pelo escopo acadêmico deste trabalho.
  @IsString()
  @MinLength(8, { message: 'Senha deve ter ao menos 8 caracteres' })
  password: string;
}
