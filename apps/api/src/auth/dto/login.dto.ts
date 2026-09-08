import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  // Sem @MinLength aqui de propósito: validar regras de formato de senha no
  // login (em vez de só "existe e é string") vaza informação sobre a política
  // de senha para quem está tentando adivinhar credenciais.
  @IsString()
  password: string;
}
