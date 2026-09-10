import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService, SanitizedUser } from './auth.service';
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_MAX_AGE_MS } from './constants';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SanitizedUser> {
    const result = await this.authService.register(dto);
    this.setAuthCookie(res, result.accessToken);
    return result.user;
  }

  // 200 em vez do 201 default do @Post: login não cria um recurso, só emite
  // um cookie de sessão pra um recurso (usuário) que já existe.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SanitizedUser> {
    const result = await this.authService.login(dto);
    this.setAuthCookie(res, result.accessToken);
    return result.user;
  }

  // Sem guard de propósito: limpar um cookie que já não existe (ou que
  // carrega um token expirado, que o JwtAuthGuard rejeitaria) não deve
  // falhar — o cliente só quer garantir que a sessão local acabou.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  }

  // Rota de conveniência para o frontend validar a sessão salva no cookie
  // (ex.: ao recarregar a página) sem precisar decodificar o JWT no cliente
  // — aliás, com o token num cookie httpOnly, o cliente nem tem acesso a ele.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SanitizedUser): SanitizedUser {
    return user;
  }

  private setAuthCookie(res: Response, accessToken: string): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true, // inacessível a JS no navegador — mitiga roubo via XSS
      // Só trafega em HTTPS. Navegadores tratam http://localhost como
      // contexto seguro por exceção, então isso não quebra o dev local
      // (front em localhost:5173, proxy do Vite pra API em localhost:3000).
      secure: true,
      // 'lax': não vai em requests cross-site de terceiros (mitiga CSRF),
      // mas ainda acompanha navegação normal (ex.: abrir um link direto).
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }
}
