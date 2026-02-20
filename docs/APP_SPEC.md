# Jantar do Vinho — Especificação Completa da Aplicação

> **Documento vivo.** Corrige iterativamente conforme necessário.
> Última atualização: 2026-02-19

---

## 1. Visão Geral

**Jantar do Vinho** é uma aplicação web para gerir um grupo privado de jantares de vinho — os "Jantares do Vinho". O grupo tem 7 Fundadores fixos e 1 Admin. Cada Fundador organiza um jantar por temporada (Sequência), trazendo garrafas de vinho para provas às cegas. Os outros fundadores avaliam as garrafas sem saber de quem são. No fim, as identidades são reveladas numa cerimónia e é apurado o vencedor.

**Stack:**
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend:** Next.js API Routes (Edge-compatible)
- **Base de dados:** PostgreSQL via Neon (serverless), ORM Drizzle
- **Armazenamento de ficheiros:** Cloudflare R2 (S3-compatible)
- **Auth:** JWT (jsonwebtoken) + bcrypt (bcryptjs), token em localStorage
- **Monitorização:** Vercel Speed Insights + Analytics

---

## 2. Roles e Permissões

| Role | Descrição | Pode fazer |
|------|-----------|-----------|
| `admin` | Administrador único (José Carreira) | Tudo — criar temporadas, fechar temporadas, criar jantares, gerir utilizadores, adicionar multas |
| `founder` | Os 6 fundadores restantes | Organizar jantares, adicionar garrafas (1 ou 2), avaliar vinhos, ver pagamentos, adicionar multas ao seu próprio jantar |
| `guest` | Qualquer registo novo | Ver jantares e vinhos, avaliar vinhos durante jantares ativos, ver perfil próprio |

**Nota:** Novos registos são sempre `guest`. Só o admin pode promover utilizadores a `founder` (máximo 7 founders+admin total). O role de `admin` não pode ser alterado.

---

## 3. Base de Dados — Schema

### Tabela `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Auto-gerado |
| `name` | text NOT NULL | Nome do utilizador |
| `email` | text NOT NULL UNIQUE | Email |
| `password_hash` | text | Hash bcrypt (rounds=12) — pode ser null para contas sem password |
| `role` | text DEFAULT 'guest' | `admin` / `founder` / `guest` |
| `profile_photo_url` | text | URL da foto de perfil no R2 |
| `created_at` / `updated_at` | timestamp | |

### Tabela `seasons`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `season_number` | integer NOT NULL | 1, 2, 3... auto-incrementado |
| `status` | text DEFAULT 'active' | `active` / `completed` |
| `start_date` / `end_date` | timestamp | `end_date` preenchido ao fechar |
| `created_at` / `updated_at` | timestamp | |

**Regras:**
- Só pode existir 1 temporada `active` de cada vez.
- Uma temporada só pode ser fechada quando tem exatamente 8 jantares.
- A nova temporada auto-incrementa o `season_number`.

### Tabela `dinners`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `name` | text NOT NULL | Nome do jantar (ex: "Jantar do Ivo") |
| `event_date` | text NOT NULL | Data no formato `YYYY-MM-DD` (string, não timestamp) |
| `location` | text | Local do jantar (opcional) |
| `status` | text DEFAULT 'setup' | `setup` → `active` → `ended` → `revealing` → `completed` |
| `season_id` | UUID FK → seasons | Cascade delete |
| `created_by` | UUID FK → users | Quem criou (admin/founder) |
| `organizer_id` | UUID FK → users | O founder que organiza |
| `host_id` | UUID FK → users | O anfitrião (pode diferir do organizador) — **nota: nunca vi ser preenchido via UI** |
| `is_blind` | boolean DEFAULT false | Se é prova cega |
| `is_extra_dinner` | boolean DEFAULT false | 8.º jantar da temporada (jantar extra) |
| `dinner_number_in_season` | integer | 1 a 8 |
| `is_completed` | boolean DEFAULT false | Definido `true` quando status passa a `ended` |
| `reveal_index` | integer DEFAULT 0 | Quantas garrafas já foram reveladas na cerimónia |
| `revealed_at` | timestamp | Quando ficou completamente revelado |
| `started_at` / `ended_at` | timestamp | |
| `created_at` / `updated_at` | timestamp | |

**Regras:**
- Máximo 8 jantares por temporada.
- Um founder não pode organizar mais de um jantar na mesma temporada.
- O organizador tem direito a 2 garrafas; os restantes só 1.
- O 8.º jantar é automaticamente marcado como `is_extra_dinner = true`.

### Tabela `bottles`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `name` | text NOT NULL | Nome do vinho |
| `producer` | text | Produtor/Quinta |
| `vintage` | integer | Ano do vinho |
| `wine_type` | text DEFAULT 'red' | `red` / `white` / `rosé` / `sparkling` / `dessert` / `other` |
| `description` | text | Notas do utilizador (opcional) |
| `photo_url` | text | URL da foto da garrafa no R2 |
| `position` | integer | Posição sequencial na lista do jantar (1, 2, 3...) |
| `dinner_id` | UUID FK → dinners | Cascade delete |
| `brought_by` | UUID FK → users | Quem trouxe |
| `created_at` / `updated_at` | timestamp | |

### Tabela `ratings`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `bottle_id` | UUID FK → bottles | Cascade delete |
| `user_id` | UUID FK → users | Cascade delete |
| `score` | numeric(3,1) NOT NULL | 1.0 a 10.0, em passos de 0.5 |
| `tasting_notes` | text | Notas de prova (opcional) |
| `created_at` / `updated_at` | timestamp | |

**Regras:** Cada utilizador só pode ter 1 rating por garrafa (upsert — se já existe, atualiza).

### Tabela `dinner_photos`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `dinner_id` | UUID FK → dinners | Cascade delete |
| `photo_url` | text NOT NULL | URL da foto no R2 |
| `uploaded_by` | UUID FK → users | |
| `created_at` | timestamp | |

### Tabela `payments`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `dinner_id` | UUID FK → dinners | Cascade delete |
| `user_id` | UUID FK → users | Cascade delete |
| `base_amount` | integer DEFAULT 10 | Valor base em "pipas" (€) |
| `status` | text DEFAULT 'pending' | `pending` / `paid` |
| `paid_at` | timestamp | |
| `created_at` / `updated_at` | timestamp | |

**Criação automática:** Quando um utilizador adiciona uma garrafa ao jantar, um payment é criado automaticamente para esse utilizador (se ainda não existir).

### Tabela `fines`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `payment_id` | UUID FK → payments | Cascade delete |
| `amount` | integer NOT NULL | Valor da multa em pipas (€) |
| `reason` | text NOT NULL | Motivo da multa |
| `created_by` | UUID FK → users | Admin ou host que criou |
| `created_at` / `updated_at` | timestamp | |

---

## 4. Autenticação

- **Mecanismo:** JWT Bearer Token (7 dias de validade)
- **Armazenamento:** `localStorage` (chaves `"token"` e `"user"`)
- **Payload JWT:** `{ userId: string, role: string }`
- **Bcrypt rounds:** 12
- **Password mínima:** 12 caracteres
- **Registo:** Qualquer pessoa pode registar-se (role padrão: `guest`)
- **Auto-logout:** `checkAuthStatus()` verifica expiração do token em cada visita

**Headers de autenticação:**
```
Authorization: Bearer <token>
```

**Funções de middleware no servidor:**
- `authenticate(req)` → retorna `{ userId, userRole }` ou `null`
- `requireAuth(req)` → retorna auth ou `NextResponse 401`
- `requireFounder(req)` → retorna auth ou `NextResponse 401/403` (só `admin`/`founder`)

---

## 5. API Routes

### Autenticação
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | ❌ | Login com email+password |
| POST | `/api/auth/register` | ❌ | Registar nova conta (sempre guest) |

### Utilizadores
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/users/[id]` | ✅ requireAuth | Perfil completo do utilizador (stats, ratings, garrafas) |
| PATCH | `/api/users/[id]` | ✅ requireAuth + own | Atualizar foto de perfil (só próprio perfil) |
| GET | `/api/admin/users` | ✅ admin only | Listar todos os utilizadores |
| PATCH | `/api/admin/users/[id]` | ✅ admin only | Alterar role do utilizador (guest ↔ founder, max 7) |

### Temporadas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/seasons` | optional | Listar todas as temporadas com stats |
| POST | `/api/seasons` | ✅ founder/admin | Criar nova temporada (só se não há ativa) |
| GET | `/api/seasons/active` | optional | Temporada ativa + lista de jantares + stats |
| GET | `/api/seasons/active/available-organizers` | ✅ founder | Founders que ainda não organizaram nesta temporada |
| GET | `/api/seasons/[id]/stats` | ❌ (sem auth) | Stats de pagamentos de uma temporada |
| POST | `/api/seasons/[id]/close` | ✅ founder/admin | Fechar temporada (requer exatamente 8 jantares) |

### Jantares
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/dinners` | optional | Listar jantares (filtro: `seasonId`, `onlyActive`) |
| POST | `/api/dinners` | ✅ founder/admin | Criar jantar na temporada ativa |
| GET | `/api/dinners/[id]` | ✅ requireAuth | Detalhes de um jantar |

### Fluxo do Jantar
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/dinners/[id]/start` | ✅ host/creator | Iniciar prova cega (setup → active) |
| POST | `/api/dinners/[id]/end` | ✅ host/creator | Terminar jantar (active → ended, is_completed=true) |
| GET | `/api/dinners/[id]/reveal-status` | ❌ | Estado atual da revelação |
| POST | `/api/dinners/[id]/reveal-next` | ✅ host/creator | Revelar próxima garrafa (ended/revealing → completing) |
| GET | `/api/dinners/[id]/ratings` | ❌ | Rankings finais do jantar |

### Garrafas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/bottles` | ✅ requireAuth | Catálogo global de vinhos (sort, filter) |
| GET | `/api/dinners/[id]/bottles` | ❌ | Garrafas de um jantar |
| POST | `/api/dinners/[id]/bottles` | ✅ requireAuth | Adicionar garrafa (max 1 ou 2 se organizer) |
| GET | `/api/bottles/[id]/ratings` | ✅ requireAuth | Ratings de uma garrafa |
| POST | `/api/bottles/[id]/ratings` | ✅ requireAuth | Submeter/atualizar rating (upsert) |

### Pagamentos e Multas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/dinners/[id]/payments` | ✅ requireAuth | Listar pagamentos + multas + stats do jantar |
| POST | `/api/dinners/[id]/payments` | ✅ admin only | Criar pagamento manualmente |
| PATCH | `/api/dinners/[id]/payments/[paymentId]` | ✅ admin only | Marcar como paid/pending |
| GET | `/api/dinners/[id]/payments/[paymentId]/fines` | ❌ | Listar multas de um pagamento |
| POST | `/api/dinners/[id]/payments/[paymentId]/fines` | ✅ admin ou host | Adicionar multa |
| PATCH/DELETE | `/api/dinners/[id]/payments/[paymentId]/fines/[fineId]` | ✅ admin | Editar/apagar multa |

### Fotos
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/dinners/[id]/photos` | ✅ requireAuth | Listar fotos do jantar |
| POST | `/api/dinners/[id]/photos` | ✅ requireAuth | Adicionar foto ao jantar |
| POST | `/api/upload` | ✅ requireAuth | Upload de ficheiro para R2 |

### Estatísticas Globais
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/stats/all-seasons` | ✅ (verify token) | Totais de pagamentos de todas as temporadas |

---

## 6. Páginas (Frontend)

### Página Inicial — `/`
- Mostra logótipo e nome "Jantar do Vinho"
- **Não autenticado:** botões "Entrar" e "Criar Conta"
- **Autenticado:** saudação com nome, botões para Jantares, Catálogo, Estatísticas, Mandamentos e Perfil

### Login — `/login`
- Form email + password
- Armazena token e user em localStorage
- Link para registo

### Registo — `/register`
- Form nome + email + password (min 12 chars)
- Auto-login após registo bem-sucedido (role sempre `guest`)

### Jantares — `/dinners`
- Lista jantares da temporada ativa
- Mostra stats (total/8 jantares)
- Botões de admin: Novo Jantar (se não há jantar agendado e temporada não cheia), Fechar Temporada
- Botões para Estatísticas (pagamentos) e Histórico
- Se não há temporada ativa e user é admin: opção de criar nova temporada

### Detalhe do Jantar — `/dinners/[id]`
- Informação do jantar (data, local, organizador)
- Lista de garrafas (em modo cego: só posição, sem revelar nomes)
- **Status setup:** Botão "Adicionar Garrafa" (para todos), botão "Iniciar Prova" (para host/admin)
- **Status active:** Garrafas visíveis para avaliação; botão "Terminar Jantar" (para host/admin)
- **Status ended/revealing:** Botão para ir à Cerimónia de Revelação (host/admin)
- **Status completed:** Resultados finais, rankings, fotos

### Adicionar Garrafa — `/dinners/[id]/add-bottle`
- Form: nome, produtor, vintage, tipo, descrição, foto
- Upload de foto para R2

### Avaliar Garrafa — `/bottles/[id]/rate`
- Slider de 0 a 10 em passos de 0.5
- Campo de notas de prova
- Upsert (pode reavaliar)

### Cerimónia de Revelação — `/dinners/[id]/reveal`
- Só acessível quando jantar está `ended` ou `revealing`
- Botão "Revelar Próxima Garrafa" (só host pode chamar a API, mas a página é pública)
- Revela do pior para o melhor, com suspense especial para os 2 últimos (runner-up e vencedor)
- Quando completo, redireciona para rankings

### Rankings — `/dinners/[id]/rankings`
- Lista de garrafas ordenadas por média (melhor primeiro)
- Medals 🥇🥈🥉 para top 3
- Ratings individuais com notas de prova
- Caixa de vencedor no fundo

### Fotos do Jantar — `/dinners/[id]/photos`
- Galeria em grid
- Upload de novas fotos (qualquer utilizador autenticado)
- Lightbox para ver foto em tamanho completo

### Histórico de Jantares — `/dinners/history`
- Lista todos os jantares de todas as temporadas

### Detalhe no Histórico — `/dinners/history/[id]`
- Versão read-only do jantar concluído

### Catálogo de Vinhos — `/bottles`
- Todos os vinhos de todos os jantares
- Sort: nome, produtor, rating, vintage
- Filter: tipo de vinho, produtor
- Toggle grid/lista
- Foto, rating médio, jantar de onde veio

### Detalhe de Garrafa — `/bottles/[id]`
- Informação completa do vinho
- Lista de ratings com notas

### Criar Jantar — `/create-dinner`
- Só para admin/founder
- Form: nome, data, local, organizador, modo cego
- Dropdown de organizadores disponíveis (quem ainda não organizou nesta temporada)

### Estatísticas de Temporada — `/seasons/[id]/payments`
- Breakdown de pagamentos por jantar
- Totais: recolhido, pendente, multas

### Estatísticas Gerais — `/stats`
- Overview de todas as temporadas
- Grand totals

### Perfil — `/profile`
- Foto de perfil (upload)
- Stats pessoais: jantares, ratings, garrafas trazidas, média, total gasto
- Vinho favorito
- Ratings recentes
- Garrafas trazidas
- Botão de logout

### Admin — `/admin`
- Lista de todos os utilizadores
- Botão para promover/rebaixar roles
- Limite de 7 founders (incluindo admin)

### Mandamentos do Vinho — `/mandamentos`
- Regras sagradas do grupo (13 fundamentos + 4 penalizações)
- Conteúdo estático

---

## 7. Regras de Negócio

### Temporadas (Sequências)
- Uma temporada = 7 jantares regulares + 1 jantar extra = 8 total
- Só pode existir uma temporada ativa de cada vez
- Para fechar uma temporada, tem de ter exatamente 8 jantares
- A nova temporada auto-incrementa o número

### Jantares
- Cada founder organiza 1 jantar por temporada (não pode repetir)
- Um jantar não pode ser criado se já há um jantar agendado (status setup ou active) na temporada — **verify this**
- Máximo 8 jantares por temporada; o 8.º é automáticamente `is_extra_dinner = true`

### Garrafas
- Organizador do jantar: pode trazer até 2 garrafas
- Outros participantes: podem trazer 1 garrafa
- Em modo cego (`is_blind = true`): durante a prova (`active`), as garrafas são mostradas por posição sem revelar a identidade de quem trouxe

### Avaliações
- Escala de 1 a 10 (0.5 em 0.5)
- Cada utilizador tem 1 rating por garrafa (pode atualizar)
- Critérios de desempate: 1.º média, 2.º total de pontos, 3.º nota mais alta

### Revelação (Cerimónia)
- Só começa depois do jantar terminar (`ended`)
- Revela do pior para o melhor
- Excepção nos últimos 2: o penúltimo a revelar é o runner-up (2.º lugar), o último é o vencedor (1.º lugar) — criando suspense
- `reveal_index` conta quantas já foram reveladas
- Quando `reveal_index >= total_bottles`, status muda para `completed`

### Pagamentos
- Cada garrafa adicionada cria automaticamente um payment de 10€ para o utilizador
- Pagamentos podem ser criados manualmente pelo admin
- Multas somam ao valor base

### Multas ("Pipas")
- Podem ser criadas pelo admin ou pelo host do jantar
- Razões tipicas: convidado extra (20€), garrafa repetida (10€), atraso organização (20€)
- "Pipas" = €

---

## 8. Upload de Ficheiros (Cloudflare R2)

**Rota:** `POST /api/upload`

**Buckets (prefixos dentro do mesmo bucket R2):**
- `bottle-photos/` — fotos de garrafas
- `dinner-photos/` — fotos dos jantares
- `profile-photos/` — fotos de perfil

**Limitações:**
- Max 5MB por ficheiro
- Tipos aceites: JPEG, PNG, WebP, GIF (validação por MIME type)
- Nome do ficheiro: `{userId}-{timestamp}.{ext}`

**URL pública:** `${R2_PUBLIC_URL}/${bucket}/{fileName}`

---

## 9. Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL (Neon) |
| `JWT_SECRET` | Secret para assinar tokens JWT (min 32 chars) |
| `R2_ENDPOINT` | Endpoint S3-compatible do R2 |
| `R2_ACCESS_KEY_ID` | Access key do R2 |
| `R2_SECRET_ACCESS_KEY` | Secret key do R2 |
| `R2_BUCKET_NAME` | Nome do bucket no R2 |
| `R2_PUBLIC_URL` | URL pública base do R2 (sem trailing slash) |

---

## 10. Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| `Header` | Cabeçalho com botão de voltar e ícone de casa |
| `Button` | Botão com variants (primary, secondary, danger, success), sizes, fullWidth, icon |
| `Card` | Container com glassmorphism (bg-white/5, backdrop-blur, border) |
| `Input` | Input com label e estilos consistentes |
| `Textarea` | Textarea com label |
| `Badge` | Badges de estado, tipo de vinho, tags de multa/extra |
| `Skeletons` | DinnerCardSkeleton, BottleCardSkeleton para loading states |
| `ToastProvider` | Sistema de notificações (success/error) via `useToast()` hook |
| `LoadingSpinner` | Indicador de loading animado |
| `PaymentsSection` | Componente de pagamentos: lista, mark as paid, modal de multas |
| `ReactQueryProvider` | Setup do TanStack React Query v5 (cache de dados) |
| `index.ts` | Barrel export de todos os componentes |

---

## 11. Hooks e Validações

### `lib/hooks/useApi.ts` — TanStack React Query v5

| Hook | Descrição |
|------|-----------|
| `useDinners()` | Lista todos os jantares (`GET /api/dinners`) |
| `useDinner(id)` | Jantar por ID com Bearer token |
| `useDinnerBottles(dinnerId)` | Garrafas de um jantar |
| `useCreateDinner()` | Mutation POST, invalida cache `["dinners"]` |
| `useSubmitRating(bottleId)` | Mutation POST rating, invalida cache do bottle |
| `useBottlesCatalog(params)` | Catálogo com filtros (sortBy, order, producer, wineType) |

### `lib/validations.ts` — Zod Schemas

| Schema | Campos |
|--------|--------|
| `loginSchema` | email (valid), password (min 6 client ⚠️) |
| `registerSchema` | name (min 2), email, password (min 6 client ⚠️), confirmPassword |
| `createDinnerSchema` | name (min 3), event_date (YYYY-MM-DD), location?, is_blind (default true) |
| `ratingSchema` | score (1-10), tasting_notes (max 500)? |
| `addBottleSchema` | name (min 2), producer?, vintage (1900-now+1)?, wine_type?, description (max 500)? |

> ⚠️ **Discrepância:** O cliente valida password com min 6 chars, mas o servidor exige min **12** chars. Formulários de login e registo não usam os Zod schemas — fazem validação nativa HTML.

### `lib/auth-client.ts`
- `getUser()` — retorna user do localStorage (com try/catch)
- `getAuthToken()` — retorna token
- `checkAuthStatus()` — verifica se token é válido e não expirou (auto-remove se expirado)

---

## 12. Fluxo Completo de um Jantar

```
1. Admin/Founder cria jantar (POST /api/dinners)
   → status: "setup"

2. Founders adicionam garrafas (POST /api/dinners/[id]/bottles)
   → payment auto-criado para cada founder
   → garrafas mostradas mas em prova cega (sem identidade)

3. Host inicia prova (POST /api/dinners/[id]/start)
   → status: "active"
   → Todos avaliam as garrafas (POST /api/bottles/[id]/ratings)

4. Host termina jantar (POST /api/dinners/[id]/end)
   → status: "ended", is_completed: true

5. Cerimónia de Revelação (POST /api/dinners/[id]/reveal-next — repetido N vezes)
   → status: "revealing" → "completed"
   → Garrafas reveladas do pior para o melhor
   → reveal_index incrementa a cada revelação

6. Rankings finais (GET /api/dinners/[id]/ratings)
   → Ordenados por média, depois total, depois nota máxima

7. Admin gere pagamentos e multas
   → PATCH /api/dinners/[id]/payments/[id] para marcar como paid
   → POST /api/dinners/[id]/payments/[id]/fines para multas
```

---

## 13. Os 7 Fundadores (por ordem de jantares)

1. José Carreira (Admin)
2. Ivo Duarte
3. Ivo Rocha
4. Miguel Violante
5. Manuel Alves
6. Ricardo Ambrósio
7. João Diogo Carvalho

---

## 14. Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| `next` | 16.1.1 | Framework |
| `react` | 19.2.0 | UI |
| `typescript` | 5.x | Tipos |
| `tailwindcss` | 4 | CSS |
| `@neondatabase/serverless` | 1.0.2 | DB driver |
| `drizzle-orm` | 0.45.1 | ORM |
| `drizzle-kit` | 0.31.9 | Migrations |
| `jsonwebtoken` | 9.0.2 | JWT |
| `bcryptjs` | 3.0.2 | Hash de passwords |
| `@tanstack/react-query` | 5.90.6 | Cache de estado servidor |
| `react-hook-form` | 7.66.0 | Estado de formulários |
| `@hookform/resolvers` | 5.2.2 | Integração Zod + RHF |
| `zod` | 4.1.12 | Validação de schemas |
| `@aws-sdk/client-s3` | 3.990.0 | Upload para R2 |
| `@vercel/analytics` | 1.5.0 | Analytics |
| `@vercel/speed-insights` | 1.2.0 | Performance monitoring |
| `babel-plugin-react-compiler` | 1.0.0 | Otimização React automática |

---

## 15. Questões em Aberto / A Verificar

- [ ] `host_id` vs `organizer_id` — qual a diferença? Parece que `host_id` nunca é preenchido via UI. O `organizer_id` é quem organiza, mas `host_id` é verificado no start/end/reveal. Pode estar incompleto.
- [ ] `/dinners/history/[id]` — a página do histórico individual (existe o ficheiro mas não foi analisado)
- [ ] `lib/queries/seasons.ts` — função `getSeasonStats()` não foi analisada
- [ ] `app/api/dinners/[id]/payments/[paymentId]/route.ts` — PATCH handler para marcar pagamentos (existe mas não foi analisado)
- [ ] `app/api/dinners/[id]/ratings/route.ts` — endpoint de rankings do jantar (não foi analisado — diferente de `/api/bottles/[id]/ratings`)
- [ ] `/app/seasons/[id]/payments/page.tsx` — página de pagamentos da temporada (não foi analisada)
- [ ] A regra "não criar jantar se já há um jantar agendado" — no frontend existe o check `hasScheduledDinner` que verifica status `setup` ou `active`, mas a API não tem esta validação
