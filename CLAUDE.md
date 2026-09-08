# CLAUDE.md — Vicina (Plataforma Digital Colaborativa para Participação Cidadã)

Este arquivo orienta o Claude Code durante o desenvolvimento do protótipo do TCC. Leia antes de qualquer alteração.

## Contexto do projeto

TCC de Engenharia de Software (UNIFAN), formato **Artigo científico**. Protótipo funcional de uma plataforma onde cidadãos registram problemas urbanos em um mapa, comentam, votam e acompanham a priorização das demandas. Autor: Romulo Emanuel Pinheiro de Jesus. Prazo de entrega: fim de novembro de 2026.

O código produzido aqui alimenta diretamente a Seção 4 (Apresentação da Solução) e a Seção 5 (Resultados e Discussão) do artigo — decisões técnicas tomadas devem ser justificáveis por escrito depois (custo, familiaridade prévia, maturidade da ferramenta), então **documente o "porquê" de decisões não óbvias em comentário curto no código**, não só o "o quê".

## Decisões já tomadas (não reabrir sem avisar)

- **Público de teste:** cidadãos comuns reportando problemas reais, não gestores públicos. O módulo de gestor é implementado, mas não será validado empiricamente neste protótipo.
- **Hospedagem:** Vercel (frontend) + Render (backend) — não AWS EC2. Critério: custo zero e entrega contínua sem configuração de infraestrutura própria.
- **ORM:** Prisma, não TypeORM. Critério: familiaridade prévia do autor (usado profissionalmente com NestJS + PostgreSQL).
- **UI:** Material UI (MUI), não CSS/componentes do zero. Mesmo critério de familiaridade prévia; também alinhado à preferência por UI limpa e minimalista adequada a um protótipo acadêmico.
- **Mapa:** Leaflet + react-leaflet, com tiles do OpenStreetMap — não Google Maps nem Mapbox. Critério: custo zero, sem exigência de chave de API ou cartão de crédito cadastrado (mesma lógica de custo-zero que motivou trocar AWS por Vercel/Render).
- **Categorias de problema:** taxonomia restrita a temas de esfera municipal (infraestrutura urbana, iluminação pública, limpeza urbana, transporte municipal, mobilidade, segurança pública local). Não há classificação automática por esfera administrativa (municipal/estadual/federal) — problemas fora da alçada municipal são triados manualmente pelo gestor, como já ocorre em canais de ouvidoria.
- **Contas de gestor:** provisionadas manualmente pelo administrador do sistema (seed/script), sem rota de autocadastro público — a concessão do papel `GESTOR` pressupõe vínculo institucional que está fora do escopo técnico do protótipo.
- **Sessão/JWT:** token de acesso único, expiração de 7 dias, sem fluxo de refresh token nem blocklist de revogação antecipada. Trade-off deliberado de escopo de protótipo (ver "simplicidade sobre generalização" abaixo); revogação de sessão fica como trabalho futuro caso o protótipo evolua para produção.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + MUI |
| Mapa | Leaflet + react-leaflet (tiles OpenStreetMap) |
| Backend | NestJS |
| ORM | Prisma **v7 (fixar a major — não usar v8, ainda em Release Candidate com CLI totalmente reformulada: `migrate dev` não existe mais na v8, virou `db migrate` + `migration`)** |
| Banco de dados | PostgreSQL (extensão PostGIS a avaliar, se necessário para consultas geoespaciais) |
| Containerização (dev local) | Docker / docker-compose |
| Hospedagem — frontend | Vercel |
| Hospedagem — backend | Render |

## Arquitetura

Três camadas, sem microsserviços (escopo de protótipo não justifica a complexidade):

1. **Apresentação** — SPA React consumindo a API via REST/JSON.
2. **Aplicação** — API NestJS, organizada em módulos por domínio: `auth`, `problems`, `votes`, `comments`. Cada módulo é autocontido (controller, service, DTOs próprios).
3. **Persistência** — PostgreSQL via Prisma. Schema único, sem multi-tenant.

## Estrutura de pastas

```
vicina/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── problems/
│   │   │   ├── votes/
│   │   │   ├── comments/
│   │   │   ├── prisma/          # PrismaService + schema.prisma
│   │   │   └── main.ts
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       │   ├── pages/           # Login, Mapa, DetalheProblema, PainelGestor
│       │   ├── components/
│       │   └── services/        # chamadas à API
├── docker-compose.yml            # Postgres + API local
└── CLAUDE.md
```

## Modelo de dados (visão geral — o schema.prisma é a fonte da verdade)

- `User` — id, nome, email, senha (hash), role (`CIDADAO` | `GESTOR`)
- `Problem` — id, título, descrição, categoria, latitude, longitude, status (`ABERTO` | `RESOLVIDO`), authorId, resolvedAt, resolutionRating (1–5), createdAt
- `Vote` — id, problemId, userId, createdAt (unique em problemId+userId)
- `Comment` — id, problemId, userId, texto, createdAt
- `Category` — id, nome

Não adicionar entidades além dessas sem necessidade concreta identificada durante o desenvolvimento — escopo de protótipo, não de produto.

**Confirmação de resolução:** apenas o autor original do `Problem` pode marcar como `RESOLVIDO` e opcionalmente avaliar a solução (`resolutionRating`, 1–5). Não implementar confirmação por terceiros/votação de resolução — decisão deliberada para evitar ambiguidade de autoridade.

**Trabalho futuro (não implementar agora):** status "sem atividade" para problemas sem voto/comentário/atualização há X dias. Quando chegar a hora, isso é sinalização visual (ex.: item acinzentado, fora do destaque padrão do mapa), nunca expiração/exclusão do registro — apagar dados por tempo contradiz o objetivo de transparência que sustenta a proposta (ver Pinho, 2008, na fundamentação teórica do artigo). Só entra em pauta depois do deploy pós-TCC.

## Convenções de código

- **Código completo e executável, nunca stubs ou placeholders do tipo `// TODO: implementar depois`.** Se uma funcionalidade não vai ser feita agora, não criar o arquivo/método vazio — só criar quando for implementar de verdade.
- **Logging estruturado** em vez de `console.log` solto — usar o `Logger` nativo do NestJS nos services, com contexto (nome da classe) e nível apropriado (`log`, `warn`, `error`).
- **Simplicidade sobre generalização.** Este é um protótipo acadêmico com prazo fixo — evitar abstrações genéricas "para o futuro" que não são exigidas pelo escopo atual (ver seção de decisões acima).
- **Custo sempre visível.** Qualquer escolha com implicação de custo/limite de camada gratuita (ex.: cron jobs no Render, cold starts, limites de conexão do Postgres gratuito) deve ser comentada inline no código, para virar nota na Seção 4.2 do artigo depois.
- **Commits pequenos e descritivos**, em português, referenciando o módulo (`feat(problems): adiciona registro georreferenciado`). **Commitar por contexto**: cada commit deve corresponder a uma unidade lógica de trabalho (ex.: "implementa CRUD de problems", "adiciona validação de DTO de auth") — nunca misturar mudanças não relacionadas num único commit. **Nunca adicionar trailer de coautoria do Claude** (`Co-Authored-By: Claude <...>`) nem menção a "Generated with Claude Code" na mensagem de commit — a autoria do commit é exclusivamente do desenvolvedor.
- **Validação de entrada em todos os endpoints** via DTOs com `class-validator` — é parte do que será citado como prática de engenharia de software no artigo.

## Comandos úteis

```bash
npm install --save-dev prisma@7   # NUNCA instalar sem fixar a major — v8 é RC e quebra o fluxo abaixo
npm install @prisma/client@7
docker compose up -d          # sobe Postgres local
npx prisma migrate dev        # aplica migrations
npx prisma studio             # inspeciona dados
npm run start:dev             # API em modo watch (apps/api)
npm run dev                   # frontend (apps/web)
```

## Fora de escopo (não implementar)

- Autenticação social (login com Google/etc.) — autenticação simples por email/senha é suficiente.
- Notificações em tempo real (WebSocket) — não é requisito do artigo.
- Multi-idioma — plataforma em português apenas.
- Qualquer funcionalidade de gestor além do necessário para descrever a arquitetura na Seção 4 — o módulo existe, mas não precisa de profundidade de produto, já que não será testado empiricamente com esse perfil de usuário.
- Roteamento automático de esfera administrativa (municipal/estadual/federal) — triagem manual pelo gestor, ver decisão acima.
- Fluxo de autocadastro para o papel `GESTOR` — contas desse tipo são provisionadas manualmente.

## Melhorias possíveis (não obrigatórias — só se sobrar tempo após o MVP)

- Filtro por categoria no mapa (baixo custo de implementação, reforça a visualização territorial já prevista no artigo).
- Upload de foto no registro do problema (stretch goal — exige armazenamento de arquivo, mais peça de infraestrutura para gerenciar no prazo).
