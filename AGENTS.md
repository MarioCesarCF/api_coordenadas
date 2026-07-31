# API Coordenadas — AGENTS.md

## Stack
- Node.js **ES Modules** (`"type": "module"`), Express 5, Mongoose 9, bcrypt, jsonwebtoken, dotenv
- MongoDB Atlas (connection string in `.env`, which is gitignored)

## Commands
| Action | Command |
|--------|---------|
| Dev server (nodemon) | `npm run dev` |
| Start (production) | `npm start` |
| Create admin user | `npm run seed` |
| Run all tests | `npm test` |
| Watch mode | `npm run test:watch` |
| Sync limites das orgs ao plano | `npm run sync:planos` |

## Tests
- Framework: **vitest** + **supertest** (HTTP assertions)
- Each run connects to the `apiCoordenadas_test` database on Atlas and drops it after
- Test files run sequentially (`fileParallelism: false` em `vitest.config.js`)
- Covers: auth flow (login/validation), user CRUD (`/me`), empresa CRUD + import, enforcement de limites de plano (`__tests__/planLimit.test.js`)

## Architecture
`src/routes/` → `src/controllers/` → `src/repositories/` → Mongoose models (`src/models/`)

**Entrypoints:** `src/server.js` (boot), `src/app.js` (Express + DB setup)

**Routes:**
- `GET /` — health check `{"message": "API funcionando"}`
- `/usuario` — `POST /login` (public), `POST /refresh` (public), `POST /` (criar, auth), `GET /me`, `PATCH /me`, `DELETE /me`, `POST /logout` (auth)
- `/empresa` — CRUD com filtros (`?name=&document=&city`), isolamento multi-tenant por `organizacao`. Rotas: `GET /`, `GET /:id`, `POST /` (valida `max_empresas`), `POST /import` (upload, valida limite somando as linhas do arquivo), `PATCH /:id`, `DELETE /:id`, `DELETE /all` (da própria organização)
- `/organizacao` — `POST /` (criar), `GET /me`, `PATCH /me`, `GET /membros`, `POST /membros` (convidar), `DELETE /membros/:id`

**Models:**
- `Organizacao` — slug (único), nome, cnpj, plano (free/essential/profissional/enterprise), status (trial/ativo/cancelado/expirado), config_limites (max_empresas, max_usuarios, storage_gb, calculos_habilitados, dominio_personalizado_habilitado), dados_asaas
- `Usuario` — adicionado `organizacao` (ref Organizacao) e `papel` (admin/membro). `password` tem `select: false`; bcrypt hash em `pre("save")`
- `Empresa` — referencia `Usuario` via ObjectId `usuario` e `Organizacao` via `organizacao`. Queries filtram por `organizacao` quando disponível
- `RefreshToken` — token hasheado (sha256), referência ao `Usuario`, expira_em, revogado_em
- `AuditLog` — registro de auditoria com `acao` (create/update/delete/import), `entidade`, `entidade_id`, `usuario` e `dados`

## Authentication
- `POST /usuario/login` aceita `{ email, password }`, retorna `{ accessToken, refreshToken, user }`
- `accessToken`: JWT assinado com `JWT_SECRET` do `.env`, expira em `JWT_EXPIRES_IN` (default 15m). Payload inclui `id`, `organizacao` e `papel`
- `refreshToken`: string randômica de 40 bytes, dura `REFRESH_TOKEN_EXPIRES_IN_DAYS` (default 7d), armazenada hasheada no banco
- `POST /usuario/refresh` aceita `{ refreshToken }`, retorna novo `{ accessToken }`
- `POST /usuario/logout` (auth) aceita `{ refreshToken }` opcional; se omitido, revoga todos os tokens do usuário
- Header: `Authorization: Bearer <accessToken>`
- Middleware: `src/middlewares/auth.middleware.js` — seta `req.userId`, `req.organizacaoId`, `req.papel`
- Middleware aplicado via `router.use(authMiddleware)` em empresa, organizacao e usuario (exceto login e refresh)

## Multi-tenancy
- Cada organização isola dados de empresas (toda query filtra por `organizacao`)
- Usuários sem organização (legado) continuam sem isolamento (backwards compatible)
- JWT contém `organizacao` — middleware decodifica e seta `req.organizacaoId`
- Repositórios aceitam `organizacaoId` opcional; se presente, filtram por ele
- `POST /organizacao` cria organização e vincula usuário como admin
- Convidar membros: `POST /organizacao/membros` (só admin), verifica limite do plano

## Limites de plano (enforcement)
- Definições centralizadas em `src/config/planos.js` (`LIMITES_POR_PLANO`, `limitesPorPlano`, `PLANO_LABELS`); `organizacao.controller.js` usa esse módulo
- Middleware `src/middlewares/planLimit.middleware.js`:
  - `carregarOrganizacao` — busca a org pelo `req.organizacaoId` e seta `req.org` (aplicado em empresa, documento e calculo)
  - `requireCalculos` — 403 se `!config_limites.calculos_habilitados`; aplicado **apenas nas ações** de `/calculo` (POST criar, importar, processar e DELETE). GET de lista/projeto/resultados fica liberado (modo leitura)
  - `checkEmpresaLimit` — 403 se `count(Empresa da org) >= max_empresas` (aplicado em `POST /empresa`); o import valida `count + rows > max` no próprio controller
  - `checkStorage` — 403 se `storage_gb <= 0` ou se `uso + arquivo > storage_gb` (aplicado em `POST /documento` após o multer)
- **Enforcement só vale para usuários com organização.** Usuários legado (sem `organizacao`) não são bloqueados (backwards compatible)
- `npm run sync:planos` (`src/scripts/sync-planos.js`) sincroniza `config_limites` de todas as orgs com o plano atual — necessário após migrar orgs antigas (que tinham limites generosos do `migrate-org`)

## Migration
- `npm run migrate-org` transforma cada usuário existente em sua própria organização
- Vincula todas as empresas do usuário à organização criada
- Define papel como "admin" para o usuário original
- Define limites generosos (max_empresas: 99999, max_usuarios: 5) para não quebrar nada

## Validation (zod)
- Schemas: `src/validations/usuario.validation.js`, `src/validations/empresa.validation.js`
- Middleware: `src/middlewares/validation.middleware.js` — `validate(schema)` retorna 400 com `{ message, errors: [{ field, message }] }`
- Aplicado em `POST` e `PATCH` em ambos os routers

## Error handling
- Centralizado em `src/middlewares/error.middleware.js`, registrado no fim do `app.js`
- Mongoose duplicate key (11000) → `409 { message: "campo já está em uso." }`
- Mongoose ValidationError → `400 { message, errors: [{ field, message }] }`
- Erros com `err.status` → `err.status { message }`
- Todos os controllers chamam `next(err)` em vez de `res.send(err.message)`

## Environment

### `.env` (gitignored — contém secrets)
| Var | Purpose | Dev | Prod (Render) |
|-----|---------|-----|---------------|
| `DATABASE_URL` | MongoDB Atlas connection string | `.env` local | env var no Render |
| `API_PORT` | Express listen port | `27017` | `27017` |
| `JWT_SECRET` | Secret for signing JWT tokens | `.env` local | env var no Render |
| `JWT_EXPIRES_IN` | Access token duration | `15m` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token lifetime | `7` | `7` |
| `FRONTEND_URL` | Frontend origin(s) para CORS | `http://localhost:5173` | URL do frontend em produção |
| `SENDGRID_API_KEY` | SendGrid API key (opcional) | `.env` local | env var no Render |
| `SENDGRID_FROM_EMAIL` | Remetente de emails | `.env` local | env var no Render |

### CORS
- `FRONTEND_URL` aceita CSV (ex: `http://localhost:5173,https://sylven.app`)
- Em dev (`NODE_ENV !== "production"`), adiciona automaticamente `localhost:5173` e `localhost:4173`
- Cookie `sameSite`: `none` em produção, `lax` em dev

## Cálculo Florestal (Fase 3)
- Módulo em `src/routes/calculo.route.js` → `src/controllers/calculo.controller.js`
- **Modelos:** `ProjetoCalculo` (projetos), `Arvore` (árvores individuais)
- **Motor:** `src/services/calculo/engine.service.js` — funções puras (DAP, AB, volume, estatística, fitossociologia)
- **Import:** `src/services/calculo/import.service.js` — parse de XLSX de campo com detecção automática de colunas
- **Coeficientes default (ES/Mata Atlântica):** Valor1=-9,821818496, Valor2=2,1551551721, Valor3=0,790768692
- **Fórmula volume:** EXP(V1 + V2*ln(DAP) + V3*ln(altura))
- **Rotas autenticadas:** POST/GET/DELETE `/calculo/projeto`, POST `/calculo/projeto/:id/importar`, POST `/calculo/projeto/:id/processar`, GET `/calculo/projeto/:id/resultados`
- **CORS:** Suporta múltiplos origins via `FRONTEND_URL` (pode ser CSV separado por vírgulas)
- **Cookie sameSite:** `none` em produção, `lax` em desenvolvimento

## Known issues
- `models/Usuario.js` has `password` with `select: false`; `findByEmail` must use `.select("+password")` to include it
