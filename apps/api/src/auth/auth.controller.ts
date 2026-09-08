import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthResult, AuthService, SanitizedUser } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  // 200 em vez do 201 default do @Post: login não cria um recurso, só emite
  // um token para um recurso (usuário) que já existe.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  // Rota de conveniência para o frontend validar a sessão salva (ex.: ao
  // recarregar a página com um token já armazenado) sem precisar decodificar
  // o JWT no cliente.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SanitizedUser): SanitizedUser {
    return user;
  }
}
