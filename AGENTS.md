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

## Tests
- Framework: **vitest** + **supertest** (HTTP assertions)
- Each run connects to the `apiCoordenadas_test` database on Atlas and drops it after
- Test files run sequentially (`fileParallelism: false` em `vitest.config.js`)
- Covers: auth flow (login/validation), user CRUD (`/me`), empresa CRUD + ownership isolation

## Architecture
`src/routes/` → `src/controllers/` → `src/repositories/` → Mongoose models (`src/models/`)

**Entrypoints:** `src/server.js` (boot), `src/app.js` (Express + DB setup)

**Routes:**
- `GET /` — health check `{"message": "API funcionando"}`
- `/usuario` — `POST /login` (public), `POST /refresh` (public), `POST /` (criar, auth), `GET /me`, `PATCH /me`, `DELETE /me`, `POST /logout` (auth)
- `/empresa` — CRUD com filtros (`?name=&document=&city`), sempre filtrando por dono (`req.userId`)

**Models:**
- `Usuario` — `password` tem `select: false` (excluída de queries por padrão); bcrypt hash em `pre("save")`
- `Empresa` — referencia `Usuario` via ObjectId `usuario`, populado nas queries
- `RefreshToken` — token hasheado (sha256), referência ao `Usuario`, expira_em, revogado_em

## Authentication
- `POST /usuario/login` aceita `{ email, password }`, retorna `{ accessToken, refreshToken, user }`
- `accessToken`: JWT assinado com `JWT_SECRET` do `.env`, expira em `JWT_EXPIRES_IN` (default 15m)
- `refreshToken`: string randômica de 40 bytes, dura `REFRESH_TOKEN_EXPIRES_IN_DAYS` (default 7d), armazenada hasheada no banco
- `POST /usuario/refresh` aceita `{ refreshToken }`, retorna novo `{ accessToken }`
- `POST /usuario/logout` (auth) aceita `{ refreshToken }` opcional; se omitido, revoga todos os tokens do usuário
- Header: `Authorization: Bearer <accessToken>`
- Middleware: `src/middlewares/auth.middleware.js` — seta `req.userId`
- Middleware aplicado via `router.use(authMiddleware)` em empresa e usuario (exceto login e refresh)

## Ownership control
- **Usuário:** cada um vê/altera/exclui apenas a si mesmo (`/usuario/me`)
- **Empresa:** cada um vê/altera/exclui apenas empresas onde `usuario === req.userId`

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

## `.env`
| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `API_PORT` | Express listen port (default 27017) |
| `JWT_SECRET` | Secret for signing JWT tokens (64 hex chars) |
| `JWT_EXPIRES_IN` | Access token duration (default `15m`) |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh token lifetime in days (default `7`) |
| `SEED_ADMIN_EMAIL` | Admin email for `npm run seed` |
| `SEED_ADMIN_PASSWORD` | Admin password for `npm run seed` |

## Known issues
- `models/Usuario.js` has `password` with `select: false`; `findByEmail` must use `.select("+password")` to include it
