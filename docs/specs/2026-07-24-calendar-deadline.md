# Spec — Calendário de disponibilidade + prazo entre jantares

> **Estado:** draft v2 — grill + revisão de design (2026-07-24)
> **Revisão:** pontos 1–7 fechados (âncora no end, attach por user, pause derivado, unique indexes, poll overdue, rotação alfabética, reemitir = edit)  
> **Scope:** feature completa num bloco (prazo + multas pending + poll + criar jantar)  
> **Alinhamento:** Mandamentos (prazo ~6 meses, multa 20 pipas + acumulação); settings configuráveis

---

## 1. Problema

1. O grupo precisa de **combinar uma data** em que todos os fundadores possam ir ao jantar.
2. Os mandamentos exigem **não deixar passar demasiado tempo** entre jantares; se passar, o **organizador da vez** paga multa (hoje: 20 pipas + 20 por cada bloco de 6 meses).
3. O intervalo **não pode ser hardcoded** — o admin deve poder alterar (ex. 6 → 4 meses) sem reescrever o código.
4. Hoje a app **não calcula** prazos nem multas de atraso; multas são só manuais no payment do jantar.

---

## 2. Objectivos

| Objectivo | Sucesso |
|----------|---------|
| Poll de disponibilidade | Admin abre poll; founders respondem; admin escolhe data → jantar criado |
| Prazo visível | Banner com data limite e urgência (home + jantares) |
| Multas de atraso | Automáticas na conta do organizador; pagas no dia do jantar |
| Configurável | Intervalo e valor da multa em settings globais; mudança **não retroage** |

### Fora de scope (v1)

- Email / push notifications
- Polls múltiplos em paralelo
- Guests no poll
- Cron jobs (geração é lazy)
- Calendário de disponibilidade “sempre aberto” (recorrente semanal)

---

## 3. Decisões fechadas (grill)

### 3.1 Prazo e multas

| # | Decisão | Escolha |
|---|---------|---------|
| 1 | Âncora do prazo | `event_date` do **último jantar realizado** = `is_completed = true` (setado no **end**, não no fim do reveal). Ver §4.1 |
| 2 | Cumprir o prazo | Só quando o **próximo jantar é realizado** (`is_completed` no **end**) — marcar data **não** reinicia o relógio |
| 3 | Quem paga multa | **Organizador da vez** (rotação da temporada) |
| 4 | Mudar organizador | Relógio **não faz reset**; multa e pressão seguem o organizador **actual** |
| 5 | Admin | Pode **cancelar / alterar** multas de prazo |
| 6 | Automação | Multa **automática** em cada aniversário do prazo |
| 7 | Pagamento | **Só no dia do jantar** (via payment do **devedor** nesse jantar; ver §4.6) |
| 8 | Antes do jantar | Dívida em **pending fine** na conta do user (não exige `payment_id` ainda) |
| 9 | Intervalo | Setting **global** (default **6 meses**); mudança **não retroage** (cada ciclo congela o intervalo no início) |
| 10 | Valor | Setting global (default **20** pipas por multa) |
| 11 | Acumulação | Em cada marco (T+1×interval, T+2×interval, …) gera-se **mais uma** multa |
| 12 | Geração | **Lazy** ao carregar home / jantares / admin / calendário |
| 13 | Jantar extra | **Não gera multa de atraso** se o atraso for “só do extra” (ver §4.3) |
| 14 | Sem histórico | Sem jantar completed → **sem prazo / sem multa** |
| 15 | UI aviso | Banner home + jantares (ok / a aproximar / em atraso + multas) |

### 3.2 Calendário / poll

| # | Decisão | Escolha |
|---|---------|---------|
| 16 | Modelo | **Um poll** para o próximo jantar (não calendário livre permanente) |
| 17 | Resposta | Utilizador marca **só os dias em que pode**; resto = não disponível |
| 18 | Submit | Explícito: `pending` vs `submitted` (0 dias livres é submit válido) |
| 19 | Quem gere | **Só admin** (abrir, fechar, escolher data, cancelar poll) |
| 20 | Quem responde | **Founders + admin** |
| 21 | Janela de datas | Default até data limite se ainda no futuro; **se overdue** → hoje+1 … hoje+N (N=45 default). Admin alarga/encurta. Ver §4.8 |
| 22 | Polls em paralelo | **Máx. 1** poll `open` de cada vez |
| 23 | Ao escolher data | Cria jantar `status=setup`, `event_date` = data escolhida, `organizer_id` = organizador da rotação |
| 24 | Menu | Item principal **Calendário** na home (junto a Jantares, Stats, …) |

### 3.3 Organizer da vez

| # | Decisão | Escolha |
|---|---------|---------|
| 25 | Determinação | **Rotação da temporada** — founders/admin elegíveis que ainda não organizaram (available-organizers) |
| 26 | Ordem | **Alfabética por `users.name`** (como o código actual). **Não** ordem dos mandamentos — a rotação real nem sempre segue essa lista |

### 3.4 Entrega

| # | Decisão | Escolha |
|---|---------|---------|
| 27 | Scope v1 | **Tudo junto**: prazo + banner + pending fines + poll + criar jantar |

### 3.5 Defaults de nome ao criar jantar pelo poll

- Nome default: `Jantar do {nome do organizer}` (editável depois no fluxo normal).
- `location` vazio; `is_blind` default `true` (como create dinner actual).
- `is_extra_dinner` / `dinner_number_in_season` calculados como no `POST /api/dinners` actual.

---

## 4. Regras de domínio (detalhe)

### 4.1 Último jantar “realizado” (âncora) — **fechado na revisão**

No código actual:

- **End** (`POST .../end`): regular → `status = ended`, **`is_completed = true`**, `ended_at` set; extra → `status = completed`, `is_completed = true`.
- **Reveal-next** (última garrafa): regular → `status = completed`.

**Decisão de domínio:** “jantar realizado” = **`is_completed = true`** (e preferencialmente `ended_at IS NOT NULL`), **não** `status = completed`.

Motivo: o jantar **aconteceu** no end; se o host se esquecer de terminar o reveal, o organizador **não** deve continuar a acumular multas de atraso. O fallback “ou is_completed” não é opcional — é a definição canónica.

```
lastRealizedDinner = dinner
  WHERE is_completed = true
  ORDER BY event_date DESC, ended_at DESC NULLS LAST
  LIMIT 1
```

- Âncora: `anchor_date = lastRealizedDinner.event_date` (`YYYY-MM-DD`).
- Se não existir → sem ciclo de prazo activo.
- **Disparo de ciclo:** `onDinnerRealized(dinner)` no handler de **`end`** (e no caminho extra que já faz completed no end). **Não** no fim do reveal.
- Idempotência: se `end` for chamado de novo ou reveal completar depois, `onDinnerRealized` é no-op se este dinner já é a âncora do ciclo activo ou se o ciclo já foi aberto a partir dele.

> Nota de nomenclatura no código: preferir `onDinnerRealized` / `isDinnerRealized` em vez de `onDinnerCompleted`, para não colidir com `status === "completed"`.

### 4.2 Ciclo de prazo (congelar intervalo)

Quando um jantar é **realizado** no **end** (`is_completed = true`, e aplica-se o relógio — §4.3):

1. Ler settings globais actuais: `interval_months`, `deadline_fine_amount`.
2. Abrir (ou substituir) o **ciclo activo**:
   - `anchor_dinner_id`
   - `anchor_date`
   - `interval_months` **snapshot** (não muda se admin alterar o setting depois)
   - `fine_amount` **snapshot**
   - `deadline_at = anchor_date + interval_months` (calendário civil; ver §4.5)
   - `status = active`

Quando o **próximo** jantar (não extra isento) é **realizado** no end:

- Fechar ciclo activo (`status = fulfilled`).
- Abrir novo ciclo com a nova âncora.

### 4.3 Jantar extra e isenção de multa — **pause derivado (não snapshot)**

**Regra do grill:** *“Jantar extra não gera multa de atraso se o atraso for só no extra.”*

**Decisão de revisão:** **não** guardar `pause_penalties` no ciclo (é frágil se a season mudar, admin saltar o extra, etc.).

**Derivar em cada geração lazy:**

```
function shouldPausePenalties(now):
  activeSeason = season WHERE status = 'active'
  if !activeSeason: return false
  regularCount = count dinners in season WHERE NOT is_extra_dinner AND is_completed
  // "só falta o extra" (ou o 8.º slot):
  return regularCount >= 7
```

Enquanto `shouldPausePenalties`:

- **não criar** novas `deadline_penalties`;
- banner pode mostrar estado informativo (`urgency = paused`), sem alarme de multa.

Jantares regulares (atraso entre 1–7): multas normais.

**Realizar** um jantar (incl. extra) no **end** → nova âncora / fulfill ciclo como §4.2 (o extra **reinicia** o relógio quando acontece).

### 4.4 Geração lazy de multas (aniversários)

Em cada request relevante (home, dinners list, admin, calendário):

```
cycle = active deadline cycle
if no cycle: return

now = today (Europe/Lisbon date)

// Marcos: deadline_at, deadline_at+interval, deadline_at+2*interval, ...
// Enquanto now >= marco_k e não existe penalty para k:
//   criar deadline_penalty para o current organizer
```

- `period_index` começa em 1 (primeira ultrapassagem do deadline).
- `amount` = `cycle.fine_amount` (snapshot).
- `reason` exemplo: `Atraso no jantar (período {k}: prazo {deadline_k})`.
- `user_id` = organizador da vez **no momento da geração** (se mudar organizer entre marcos, novas multas vão para o novo; multas antigas ficam no user que as “ganhou”).
- Idempotente: **unique `(cycle_id, period_index)`** — uma row por marco no ciclo.

**Decisão de atribuição se organizer mudou a meio do atraso:**

- Multas **já criadas** permanecem no `user_id` original.
- Novos marcos → `user_id` = organizer actual (no momento da geração lazy).
- Alinha com “o tempo não faz reset” e “multa futura segue o organizador actual”.

**Cancelar / reemitir (admin) — fechado na revisão:**

- **Waive** = `status = waived` (não apaga a row; o unique mantém-se).
- **Reemitir** para outro user ou reactivar = **editar a row existente** (`user_id`, `amount`, `status → pending`), **não** inserir segunda row do mesmo `(cycle_id, period_index)`.
- **Alterar valor** = PATCH `amount` na mesma row (antes do attach).

### 4.5 Cálculo de meses

```
deadline = addCalendarMonths(anchor_date, interval_months)
// ex. 2024-01-31 + 1 mês → 2024-02-29 (ou 28) — usar data-fns / luxon calendar months
// timezone de referência: Europe/Lisbon (só a parte date)
```

### 4.6 Ligar multas ao jantar (pagamento no dia) — **attach por user, não só organizer**

**Problema (revisão):** se só se atam penalties do `organizer_id` do dinner, um ex-organizador com multas antigas (decisão #4) **nunca** passa pelo attach e a dívida fica órfã.

**Regra:** sempre que se **garante um payment** para um `user_id` num dinner (qualquer participante, não só o organizer):

1. Listar `deadline_penalties` desse **`user_id`** com `status = pending` e ainda sem `fine_id` / attach.
2. Para cada uma:
   - Criar `fines` no `payment_id` desse user nesse dinner (amount, reason).
   - Marcar penalty `status = attached`, `payment_id`, `fine_id`, `dinner_id`.

Assim:

- Organizer actual com multas → paga no jantar dele (caso normal).
- Ex-organizador que **ainda participa** (traz garrafa / tem payment) → liquida a dívida antiga nesse jantar.
- Quem tem dívida e **não** aparece no jantar → penalty continua `pending` até ter payment num jantar futuro (ou admin waive).

Se admin **waived** → não cria fine.  
Se admin **alterou amount** → fine usa o amount actual.

**Momentos de attach (idempotentes):**

- Ao **criar/garantir payment** (POST bottles e qualquer path que insira payment).
- No **GET payments** do dinner (lazy catch-up).
- Opcional no **end** do jantar para apanhar quem tem payment mas attach falhou.

`created_by` na fine: user system/admin placeholder ou o admin que forçou attach; se nullable na BD, permitir null com reason clara.

### 4.7 Organizer da vez (rotação) — **sem ordem dos mandamentos**

Reutilizar lógica de `available-organizers` (código actual):

- Users com role `founder` ou `admin`.
- Excluir quem já tem `organizer_id` num dinner da season activa.
- Ordenação: **`users.name` ASC** (alfabética). **Não** implementar lista fixa dos mandamentos na v1 — a rotação real “nem sempre é igual”.

O **primeiro** da lista de “ainda não organizou” é só **sugestão**.

**Poll:**

- Ao **abrir**, pode gravar `suggested_organizer_id` (snapshot da sugestão na altura).
- Ao **choose-date**, **recalcular** available-organizers (o estado pode ter mudado) e:
  - default = primeiro da lista recalculada, **ou**
  - `organizer_id` explícito no body se o admin escolher outro elegível.
- Mudar organizer no choose-date **não** reinicia o ciclo de prazo.

### 4.8 Janela default do poll (incl. overdue) — **fechado na revisão**

```
function defaultPollWindow(today, deadline_at, overdueHorizonDays = 45):
  start = today + 1 day
  if deadline_at >= start:
    end = deadline_at
  else:
    // already overdue: window_end < window_start would break
    end = today + overdueHorizonDays
  // always enforce end >= start
  if end < start: end = start
  return (start, end)
```

Admin pode override `window_start` / `window_end` no POST/PATCH do poll, com validação `end >= start`.

---

## 5. Modelo de dados

### 5.1 `app_settings` (key-value ou row única)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `dinner_interval_months` | int NOT NULL DEFAULT 6 | Intervalo global default |
| `deadline_fine_amount` | int NOT NULL DEFAULT 20 | Pipas por multa de marco |
| `updated_at` | timestamptz | |
| `updated_by` | uuid FK users | opcional |

Só admin PATCH.

### 5.2 `deadline_cycles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `anchor_dinner_id` | uuid FK dinners | Jantar **realizado** (end) que abriu o ciclo |
| `anchor_date` | date NOT NULL | Cópia de event_date |
| `interval_months` | int NOT NULL | Snapshot (não retroage) |
| `fine_amount` | int NOT NULL | Snapshot |
| `deadline_at` | date NOT NULL | anchor + interval |
| `status` | text | `active` \| `fulfilled` \| `cancelled` |
| `created_at` / `updated_at` | timestamptz | |

**Não** há coluna `pause_penalties` — derivar em runtime (§4.3).

**Invariant BD (obrigatório):** partial unique index  
`CREATE UNIQUE INDEX deadline_cycles_one_active ON deadline_cycles (status) WHERE status = 'active';`  
(ou expressão equivalente; em Drizzle: `uniqueIndex(...).where(sql\`status = 'active'\`)` — um único active).  
Alternativa robusta: unique em coluna booleana gerada / partial unique on `( (status = 'active') )` — o essencial é a BD rejeitar 2 actives sob concorrência lazy.

### 5.3 `deadline_penalties` (pending fines na conta do user)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `cycle_id` | uuid FK deadline_cycles | |
| `user_id` | uuid FK users | Organizer na altura da criação |
| `period_index` | int NOT NULL | 1, 2, 3… |
| `amount` | int NOT NULL | |
| `reason` | text NOT NULL | |
| `status` | text | `pending` \| `attached` \| `waived` |
| `period_deadline` | date | Data do marco que gerou a multa |
| `dinner_id` | uuid FK nullable | Preenchido ao attach |
| `payment_id` | uuid FK nullable | |
| `fine_id` | uuid FK fines nullable | Fine real no payment |
| `created_at` / `updated_at` | timestamptz | |
| `waived_by` / `waived_at` | opcional | Admin |

Unique: `(cycle_id, period_index)`.

### 5.4 `availability_polls`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `status` | text | `open` \| `closed` \| `cancelled` |
| `window_start` | date NOT NULL | |
| `window_end` | date NOT NULL | |
| `suggested_organizer_id` | uuid FK users nullable | Snapshot da sugestão ao abrir (só referência) |
| `created_by` | uuid FK users | Admin |
| `chosen_date` | date nullable | Quando admin escolhe |
| `created_dinner_id` | uuid FK dinners nullable | Jantar criado |
| `created_at` / `closed_at` | timestamptz | |

**Invariant BD (obrigatório):** partial unique  
`CREATE UNIQUE INDEX availability_polls_one_open ON availability_polls ((status)) WHERE status = 'open';`  
(equivalente Drizzle `uniqueIndex().where(sql\`status = 'open'\`)`).

Checks na app **não bastam** sob concurrent lazy/admin opens.

### 5.5 `availability_responses`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `poll_id` | uuid FK polls ON DELETE CASCADE | |
| `user_id` | uuid FK users | |
| `status` | text | `pending` \| `submitted` |
| `submitted_at` | timestamptz nullable | |
| Unique | (poll_id, user_id) | |

### 5.6 `availability_days`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | |
| `response_id` | uuid FK responses CASCADE | |
| `day` | date NOT NULL | Dia marcado como “posso” |
| Unique | (response_id, day) | |

Só dias **dentro** de `[window_start, window_end]`.

### 5.7 Extensão opcional a `fines`

Manter tabela `fines` actual. Penalties attached criam rows aí com `created_by` = admin que atachou ou user system (nullable / admin id).

---

## 6. API

### Settings (admin)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/settings` | requireAuth | Lê intervalo + fine amount (founders podem ver; só admin altera) |
| PATCH | `/api/settings` | requireAdmin | Actualiza defaults globais |

### Deadline

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/deadline/status` | requireAuth | Lazy-sync penalties; devolve anchor, deadline, days_left, urgency, organizer, penalties summary, pause_penalties |
| GET | `/api/deadline/penalties` | requireAuth | Lista penalties (próprias; admin vê todas) |
| PATCH | `/api/deadline/penalties/[id]` | requireAdmin | Alterar amount / waive |

### Polls

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/calendar/polls/active` | requireAuth (founder/admin) | Poll open + respostas agregadas + meu response |
| POST | `/api/calendar/polls` | requireAdmin | Abrir poll (`window_start/end` opcionais → §4.8 default, incl. overdue) |
| PATCH | `/api/calendar/polls/[id]` | requireAdmin | Ajustar janela, cancelar |
| POST | `/api/calendar/polls/[id]/respond` | requireFounder | Body: `{ days: string[] }` → status submitted |
| POST | `/api/calendar/polls/[id]/choose-date` | requireAdmin | Body: `{ date, organizer_id? }` → cria dinner, fecha poll |

### Integração dinners

- Ao **end** do jantar (`is_completed = true`): domain `onDinnerRealized(dinner)` → fulfill cycle activo + abrir novo (com regras extra / pause derivado no lazy).
- Ao **garantir payment de qualquer user** no dinner: `attachPendingPenaltiesForUser(userId, dinnerId)` (não só organizer).
- GET payments: catch-up idempotente de attach.

---

## 7. UI

### 7.1 Home + `/dinners`

Banner (componente `DeadlineBanner`):

- Estado `ok`: “Próximo jantar até **DD/MM/AAAA** (faltam X dias) · Organizador: Y”
- `warning` (ex. ≤ 30 dias): amarelo
- `overdue`: vermelho + “Em atraso · N multa(s) pendente(s) · Z pipas”
- `paused` (extra): texto informativo sem alarme de multa
- `none`: escondido (sem ciclo)

### 7.2 Menu **Calendário** (`/calendar`)

- Founder: ver poll activo, marcar dias (toggle), botão **Submeter disponibilidade**
- Lista “X/7 responderam”
- Heatmap / contagem por dia (“5 disponíveis”)
- Admin: criar poll, editar janela, ver grelha, **Escolher esta data** → confirma → jantar criado → redirect para o dinner

### 7.3 Admin

- Settings: intervalo (meses), valor multa
- Lista penalties: waive / edit amount
- (Opcional) ver ciclo activo

### 7.4 Pagamentos no jantar

- PaymentsSection já mostra fines; as attached aparecem como multas normais no payment do **devedor** (qualquer participante com penalties pending)
- Opcional: badge “multa de prazo” no reason

---

## 8. Domain modules (proposta)

```
lib/domain/deadline.ts      # anchor, deadline, period index, pause rules
lib/domain/availability.ts  # poll window defaults, day validation
lib/domain/constants.ts     # defaults INTERVAL=6, FINE=20 (overridable by settings)
```

Lazy entrypoint: `ensureDeadlineState(now)` chamado nos GET de status/banner.

---

## 9. Casos de teste (aceitação)

1. Sem jantar `is_completed` → GET status sem deadline; sem penalties.
2. **End** jantar D0 (`is_completed=true`, mesmo se status ainda `ended`) → deadline = D0 + 6 meses; banner ok. Reveal **não** reabre ciclo.
3. Hoje ≥ deadline → 1 penalty pending no organizer actual; amount 20.
4. Hoje ≥ deadline + 6 meses → 2 penalties (period 1 e 2).
5. Admin altera interval para 4 → ciclo activo **mantém** 6; novo ciclo após próximo end usa 4.
6. Admin waives penalty → não attach no jantar.
7. Organizer muda → novas penalties no novo user; antigas no antigo.
8. Ex-organizador com penalty pending **participa** noutro jantar (payment) → attach às **suas** multas nesse payment (não órfãs).
9. Poll: 2.º open rejeitado pela **BD** (unique partial) enquanto 1 open.
10. Founder submit days → submitted; contagem de disponíveis correcta.
11. Admin choose-date → dinner setup; poll closed; organizer recalculado ou override.
12. Guest não acede respond/poll manage.
13. Season com 7 regulares completed → `shouldPausePenalties` true; sem novas auto-penalties.
14. Default poll window com deadline no passado → start=hoje+1, end=hoje+45 (não start>end).
15. Admin reemitir: edita row waived → pending + outro user_id; unique (cycle, period) mantém-se.
16. Ao payment de qualquer user com pending → fines no payment; pagáveis no fluxo actual.

---

## 10. Plano de implementação (ordem sugerida)

1. Schema + migration (`app_settings`, cycles, penalties, polls, responses, days)
2. Domain deadline + settings API
3. Hook **end** dinner (`onDinnerRealized`) → open/fulfill cycle
4. Lazy ensure + GET status + DeadlineBanner (home, dinners)
5. Admin PATCH penalty + settings UI
6. Attach penalties → fines on payment
7. Poll API + UI `/calendar`
8. choose-date → create dinner (reuse dinner create rules)
9. Testes unitários domain + testes manuais checklist §9

---

## 11. Riscos e notas

- **Meses civis** vs 180 dias: spec usa meses civis (mandamentos falam “6 meses”).
- **Lazy generation**: se ninguém abrir a app durante meses, multas criam-se em rajada no próximo load — OK e idempotente.
- **Multa sem payment até ao jantar**: UX de “dívida” no banner/admin; não confundir com payment pending de 10 pipas.
- **Mandamentos page**: actualizar texto se o interval deixar de ser “sempre 6” — opcional v1 (mostrar valor do setting).
- **APP_SPEC.md**: após merge, actualizar secções schema + rotas.

---

## 12. Revisão de design (2026-07-24) — pontos fechados

| # | Tema | Decisão |
|---|------|---------|
| R1 | Âncora / completed | **Realizado = `is_completed` no end**; `onDinnerRealized` no end, não no reveal |
| R2 | Attach órfão | Attach penalties do **`user_id` do payment**, não só do organizer do dinner |
| R3 | pause_penalties | **Derivado** em lazy gen; sem coluna no ciclo |
| R4 | Invariantes 1 active/open | **Partial unique indexes** na BD |
| R5 | Poll window overdue | Fallback **hoje+1 … hoje+45** (configurável) |
| R6 | Ordem rotação | **Alfabética `name`**; sem ordem mandamentos; choose-date **recalcula** |
| R7 | Reemitir | **Editar** row existente; unique `(cycle_id, period_index)` |

### Open questions menores (não bloqueiam v1)

1. Nome default multi-idioma: só PT (`Jantar do {name}`).
2. Cancel poll só antes de choose-date; depois gestão do jantar é o fluxo normal.
3. Valor exacto de `overdueHorizonDays` (default 45) — admin pode alargar a janela manualmente.

---

## 13. Changelog da spec

| Data | Mudança |
|------|---------|
| 2026-07-23/24 | Grill inicial |
| 2026-07-24 | Revisão: R1–R7 incorporados no corpo do spec |
| 2026-07-24 | Amendments: max 1 scheduled dinner; poll ≥6 Posso; deadline card UI |

---



---

## Amendments 2026-07-24

Product clarification after v1 implementation.

### A1. Max 1 scheduled dinner at a time

- **Scheduled** = dinner `status` in `setup` | `active` (not yet ended/realized).
- Enforce on:
  - `POST /api/dinners` (create dinner without poll)
  - `chooseDate` in calendar service (admin marks date from poll)
- Error PT: *«Já existe um jantar marcado. Só podes marcar o próximo depois de o actual terminar.»*
- Domain: `SCHEDULED_DINNER_STATUSES`, helper `hasScheduledDinner(statuses)`.

### A2. Poll is helper only — does not auto-mark

- Poll does **not** auto-create a dinner.
- Admin confirmation (`choose-date`) creates dinner **only if** that day has ≥ **6** members who **submitted** and marked **"Posso"** (day in `availability_days`).
- Count users with role `founder` OR `admin` (admin counts as founder).
- Constant: `MIN_AVAILABLE_FOR_SCHEDULED_DINNER = 6`.
- Error if &lt; 6: *«São necessários pelo menos 6 membros disponíveis (Posso) neste dia.»*

### A3. Create dinner without poll still allowed

- Only rule A1 applies (max 1 scheduled). No availability threshold on direct create.

### A4. Calendar UI — deadline limit always visible

- Keep `DeadlineBanner` at top.
- Also show card **«Limite de marcação do próximo jantar»** with deadline date / days left even when no poll (fetch `/api/deadline/status`).
- If no cycle: *«Sem prazo activo (ainda não há jantar realizado).»*

### A5. Calendar UI — choose-date UX

- Day buttons show count of «Posso» (`day_counts`, submitted only).
- Admin «Escolher» only enabled when `count >= 6` (greyed + tooltip otherwise).
- Confirm: *«Confirmar marcação do jantar em {date}? ({n} membros disponíveis)»*
- Copy: poll = disponibilidade; marcação só com confirmação admin e ≥6 Posso.
- Poll is not the only path to create a dinner.

---

*Fim da spec.*
