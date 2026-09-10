// Nome do cookie httpOnly que carrega o JWT — chave compartilhada entre quem
// seta o cookie (auth.controller.ts) e quem o lê de volta
// (strategies/jwt.strategy.ts), pra evitar divergência por um typo.
export const ACCESS_TOKEN_COOKIE = 'access_token';

// 7 dias em ms. Precisa ficar em sincronia com JWT_EXPIRES_IN em
// auth.module.ts (o cookie não deve durar mais que o JWT que ele carrega —
// um cookie mais longo só guardaria um token já expirado e inútil).
export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
