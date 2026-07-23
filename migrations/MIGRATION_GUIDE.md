# Payment System Migration Guide

## 🚀 Como executar a migration no Supabase

### Passo 1: Aceder ao Supabase Dashboard

1. Vai a https://supabase.com/dashboard
2. Seleciona o teu projeto
3. Vai para **SQL Editor** no menu lateral

### Passo 2: Executar a Migration

1. Abre o ficheiro `/migrations/create_payments_system.sql`
2. Copia todo o conteúdo do ficheiro
3. Cola no SQL Editor do Supabase
4. Clica em **Run** ou pressiona `Ctrl/Cmd + Enter`

### Passo 3: Verificar

Após executar, verifica que as tabelas foram criadas:

```sql
-- Ver todas as tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Deve ver: payments, fines

-- Verificar estrutura da tabela payments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments';

-- Verificar estrutura da tabela fines
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fines';
```

## ✅ O que foi criado

### Tabela: `payments`

- Guarda os pagamentos base (10 pipas por jantar)
- Um pagamento por pessoa por jantar (UNIQUE constraint)
- Status: pending/paid
- Timestamp quando marcado como pago

### Tabela: `fines`

- Multas adicionais aos pagamentos
- Múltiplas fines por payment permitidas
- Guarda quem criou a fine (admin)
- Reason obrigatório

### RLS Policies

- **Leitura**: Todos podem ver pagamentos e fines
- **Escrita**: Apenas admins podem criar/atualizar

### Indexes

- Otimização de queries por dinner_id, user_id, status
- Foreign keys indexadas para performance

## 🎯 Próximos Passos

Após executar a migration, a UI de pagamentos já está pronta!

**Acede a qualquer jantar e verás:**

- 💰 Secção de Pagamentos
- Estatísticas (Paid, Pending, Base, Fines)
- Lista de todos os pagamentos
- Botões de admin (se fores admin):
  - ✅ Mark Paid / Mark Pending
  - 🚨 Add Fine

## 📝 Notas

- Por agora, os pagamentos têm de ser criados **manualmente** pelo admin
- Fase de **automação** (criar ao adicionar garrafa) será implementada depois
- Base amount é sempre **10 pipas**
- Fines são adicionais e podem ser múltiplas


---

## Neon: unique indexes for ratings & payments

Schema (`lib/schema.ts`) defines unique constraints on:

- `ratings (bottle_id, user_id)` → `ratings_bottle_user_unique`
- `payments (dinner_id, user_id)` → `payments_dinner_user_unique`

Hand SQL: `migrations/add_ratings_payments_uniques.sql`

### Before applying on Neon / production

1. **Check for duplicates** (must be empty before CREATE UNIQUE INDEX):

```sql
SELECT bottle_id, user_id, COUNT(*) AS n
FROM ratings
GROUP BY bottle_id, user_id
HAVING COUNT(*) > 1;

SELECT dinner_id, user_id, COUNT(*) AS n
FROM payments
GROUP BY dinner_id, user_id
HAVING COUNT(*) > 1;
```

2. Resolve any duplicate rows (keep one, delete extras).
3. Run the SQL from `add_ratings_payments_uniques.sql` in the Neon SQL editor.
4. Do **not** apply migrations to remote DBs from local tooling without explicit approval.

