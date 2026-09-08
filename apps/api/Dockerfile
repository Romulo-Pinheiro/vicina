# Build de produção para o Render (ver CLAUDE.md — critério de custo zero e
# deploy contínuo sem infraestrutura própria). Multi-stage para manter a
# imagem final enxuta: só o dist compilado e as deps de produção vão pra ela.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Copia o client já gerado na etapa de build, em vez de rodar `prisma generate`
# de novo aqui: prisma7.config.ts usa dotenv (devDependency, descartada pelo
# --omit=dev acima) e a CLI do Prisma também não faz parte do bundle de produção.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Render injeta a própria porta via env PORT — main.ts já lê process.env.PORT.
EXPOSE 3000
CMD ["node", "dist/main"]
