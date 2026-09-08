# Vicina

> Plataforma digital colaborativa para participação cidadã e priorização de políticas públicas municipais.
> _A collaborative civic platform for reporting, prioritizing and tracking local urban issues._

Protótipo desenvolvido como Trabalho de Conclusão de Curso (Engenharia de Software — UNIFAN), aplicando princípios de engenharia de software ao setor público: cidadãos registram problemas urbanos em um mapa, votam para priorizar demandas, comentam e acompanham a resolução — dados que podem subsidiar a atuação de gestores públicos municipais.

## Funcionalidades

- Registro georreferenciado de problemas urbanos (mapa interativo com pins)
- Votação e priorização colaborativa das demandas
- Comentários estruturados
- Confirmação de resolução pelo autor do problema, com avaliação opcional da solução
- Painel de gestor público (módulo implementado na arquitetura; não validado empiricamente neste protótipo — ver delimitação de escopo abaixo)

## Stack

| Camada                      | Tecnologia                                    |
| --------------------------- | --------------------------------------------- |
| Frontend                    | React + MUI                                   |
| Mapa                        | Leaflet + react-leaflet (tiles OpenStreetMap) |
| Backend                     | NestJS                                        |
| ORM                         | Prisma                                        |
| Banco de dados              | PostgreSQL                                    |
| Containerização (dev local) | Docker / docker-compose                       |
| Hospedagem                  | Vercel (frontend) + Render (backend)          |

## Arquitetura

Três camadas, sem microsserviços:

1. **Apresentação** — SPA React consumindo a API via REST/JSON.
2. **Aplicação** — API NestJS organizada em módulos por domínio (`auth`, `problems`, `votes`, `comments`).
3. **Persistência** — PostgreSQL via Prisma.

Detalhes de decisão técnica (e por que cada tecnologia foi escolhida) estão documentados em [`CLAUDE.md`](./CLAUDE.md).

## Como rodar localmente

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd vicina

# 2. Subir o banco de dados
docker compose up -d

# 3. Configurar variáveis de ambiente, instalar dependências e aplicar migrations (apps/api)
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev

# 4. Rodar a API
npm run start:dev

# 5. Em outro terminal, configurar e rodar o frontend (apps/web)
cd apps/web
cp .env.example .env
npm install
npm run dev
```

## Estrutura do repositório

```
vicina/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── prisma/       # PrismaService + schema.prisma
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── .env.example
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── theme.ts
│       └── .env.example
├── docker-compose.yml       # Postgres local
├── CLAUDE.md
└── README.md
```

Os módulos de domínio da API (`auth`, `problems`, `votes`, `comments`) e as páginas do frontend (`Login`, `Mapa`, `DetalheProblema`, `PainelGestor`) entram em `apps/api/src/` e `apps/web/src/pages/` conforme forem implementados — não existem como arquivos vazios no scaffold inicial.

## Escopo e delimitações

Este é um protótipo acadêmico, não um produto em produção. Delimitações deliberadas do escopo:

- A validação empírica foi conduzida com cidadãos comuns, reportando problemas reais observados em seu cotidiano — não com gestores públicos reais.
- Não há classificação automática de problemas por esfera administrativa (municipal/estadual/federal); a taxonomia de categorias é restrita a temas municipais.
- Contas com papel de gestor são provisionadas manualmente (sem autocadastro público), já que a concessão real desse acesso pressupõe um vínculo institucional fora do escopo técnico deste trabalho.

## Sobre o TCC

Trabalho de Conclusão de Curso apresentado ao Curso de Engenharia de Software do Centro Universitário Nobre (UNIFAN) — Feira de Santana, BA.

**Autor:** Romulo Emanuel Pinheiro de Jesus

## Licença

Licença MIT
