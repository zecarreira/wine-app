# 🍷 Jantar do Vinho - Wine Rating App

Uma aplicação sofisticada para jantares de prova de vinhos às cegas, construída com Next.js 16, React 19, Neon PostgreSQL e Drizzle ORM. Organiza jantares de vinho com amigos, classifica vinhos às cegas e descobre os vencedores numa cerimónia interativa de revelação.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E699?style=flat-square)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square)

## ✨ Funcionalidades Principais

### 🎭 **Modo Prova Cega**

- Vinhos embaralhados e etiquetados como A, B, C... durante a prova
- Nomes e detalhes escondidos até à cerimónia de revelação
- Embaralhamento determinístico garante a mesma ordem para todos

### ⭐ **Sistema de Classificação**

- Classifica vinhos de 1 a 10 com precisão de meio ponto
- Adiciona notas de prova detalhadas para cada vinho
- Edita as tuas classificações antes do jantar terminar
- Sistema de pontuação customizado com labels divertidos

### 🎪 **Cerimónia Interativa de Revelação**

- Revelação progressiva garrafa a garrafa
- Animações dramáticas e celebrações com emojis
- Mostra todas as classificações e pontuações médias
- Coroa o vencedor no final

### 👥 **Sistema de Temporadas**

- Organiza jantares em temporadas de 8 jantares (7 regulares + 1 extra)
- Cada fundador organiza 1 jantar por temporada
- Sistema de rotação automática
- Jantares extra para celebrar o fim da temporada
- Histórico completo de todas as temporadas

### 💰 **Sistema de Pagamentos e Multas**

- Gestão de "pipas" (moeda do grupo)
- Taxa de participação: 10 pipas por jantar
- Sistema de multas por infrações às regras
- Fundo do vinho acumulado para evento extra
- Dashboard de pagamentos por temporada

### 📜 **Mandamentos do Vinho**

- 13 fundamentos sagrados do grupo
- 4 tipos de penalizações claramente definidas
- Página dedicada com todas as regras
- Design otimizado para consulta rápida

### 👑 **Controlo de Acesso por Funções**

- **Admin**: Controlo total do sistema
- **Founder**: Cria jantares, gere garrafas (máximo 7 fundadores)
- **Guest**: Participa em jantares e classifica vinhos

### 📊 **Estatísticas Completas**

- Rankings finais com pontuações detalhadas
- Estatísticas por temporada
- Estatísticas gerais de todas as temporadas
- Notas de prova individuais exibidas
- Cálculo de pontos totais e médias
- Dashboard de pagamentos e multas

### 📸 **Galeria de Fotos**

- Upload de fotos durante o jantar
- Visualizador de imagens em ecrã completo
- Lightbox interativo
- Partilha de memórias com os participantes

### 📱 **Design Mobile-First**

- 100% otimizado para dispositivos móveis
- Layout responsivo em todas as páginas
- Touch-friendly interface
- Performance otimizada para smartphones

### 🌐 **Totalmente em Português (PT-PT)**

- Interface 100% em Português de Portugal
- Mensagens, labels e notificações traduzidas
- Formato de datas em PT-PT
- Linguagem adaptada ao contexto português

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- npm ou pnpm
- Conta [Neon](https://neon.tech) (PostgreSQL)
- Bucket Cloudflare R2 (imagens)

### Instalação

1. **Clona o repositório**

```bash
git clone https://github.com/zecarreira/wine-app.git
cd wine-app
```

2. **Instala as dependências**

```bash
npm install
```

3. **Configura as variáveis de ambiente**

```bash
cp .env.example .env.local
```

Edita `.env.local` e adiciona as tuas credenciais:

```env
DATABASE_URL=
JWT_SECRET=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Gera um JWT secret seguro:

```bash
openssl rand -base64 32
```

4. **Base de dados (Drizzle + Neon)**

O schema está em `lib/schema.ts`. Para gerar migrações e inspecionar a BD:

```bash
npm run db:generate   # drizzle-kit generate
npm run db:studio     # drizzle-kit studio
```

Aplica migrações no teu ambiente de desenvolvimento conforme o teu fluxo (não corras geradores contra produção sem cuidado).

5. **Executa o servidor de desenvolvimento**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) no teu browser.

## 🏗️ Estrutura do Projeto

```
wine-rating-app/
├── app/                          # App Router do Next.js
│   ├── page.tsx                  # Página inicial
│   ├── layout.tsx                # Layout principal
│   ├── globals.css               # Estilos globais
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── login/            # Autenticação de utilizador
│   │   │   └── register/         # Registo de utilizador
│   │   ├── users/
│   │   │   └── [id]/             # Operações sobre utilizadores
│   │   ├── admin/
│   │   │   └── users/            # Gestão de utilizadores (admin)
│   │   ├── dinners/              # CRUD de jantares
│   │   │   └── [id]/
│   │   │       ├── start/        # Iniciar jantar
│   │   │       ├── end/          # Terminar jantar
│   │   │       ├── reveal-status/# Estado da revelação
│   │   │       ├── reveal-next/  # Revelar próxima garrafa
│   │   │       ├── bottles/      # Garrafas do jantar
│   │   │       ├── ratings/      # Classificações do jantar
│   │   │       ├── photos/       # Fotos do jantar
│   │   │       └── payments/     # Pagamentos do jantar
│   │   ├── bottles/              # CRUD de garrafas
│   │   │   └── [id]/
│   │   │       └── ratings/      # Classificações da garrafa
│   │   ├── seasons/              # Sistema de temporadas
│   │   │   ├── active/           # Temporada ativa
│   │   │   └── [id]/
│   │   │       ├── close/        # Fechar temporada
│   │   │       └── stats/        # Estatísticas da temporada
│   │   ├── stats/
│   │   │   └── all-seasons/      # Estatísticas globais
│   │   └── upload/               # Upload de imagens (R2)
│   │
│   ├── login/                    # Página de login
│   ├── register/                 # Página de registo
│   ├── profile/                  # Perfil do utilizador
│   ├── admin/                    # Painel administrativo
│   │
│   ├── dinners/                  # Gestão de jantares
│   │   ├── page.tsx              # Lista de jantares
│   │   ├── history/              # Histórico de jantares
│   │   └── [id]/
│   │       ├── page.tsx          # Detalhes do jantar
│   │       ├── add-bottle/       # Adicionar garrafa
│   │       ├── photos/           # Galeria de fotos
│   │       ├── rankings/         # Rankings das garrafas
│   │       └── reveal/           # Cerimónia de revelação
│   │
│   ├── bottles/                  # Catálogo e detalhes de garrafas
│   │   └── [id]/
│   │       ├── page.tsx          # Detalhes da garrafa
│   │       └── rate/             # Classificar garrafa
│   │
│   ├── seasons/                  # Sistema de temporadas
│   │   └── [id]/
│   │       └── payments/         # Gestão de pagamentos
│   │
│   ├── create-dinner/            # Criar novo jantar
│   ├── stats/                    # Estatísticas globais
│   └── mandamentos/              # Mandamentos do Vinho
│
├── components/                   # Componentes React reutilizáveis
│   ├── Header.tsx
│   ├── BottleCard.tsx
│   ├── PaymentsSection.tsx
│   ├── payments/                 # Subcomponentes de pagamentos
│   │   ├── FineModal.tsx
│   │   ├── PaymentCard.tsx
│   │   ├── PaymentStatsStrip.tsx
│   │   └── types.ts
│   └── ...
│
├── lib/                          # Utilitários e configuração
│   ├── db.ts                     # Cliente Drizzle + Neon
│   ├── schema.ts                 # Schema da base de dados
│   ├── auth.ts                   # Lógica de autenticação JWT
│   ├── auth-client.ts            # Auth client-side (localStorage Bearer)
│   ├── middleware.ts             # Middleware de autenticação API
│   ├── validations.ts            # Schemas de validação Zod
│   ├── env.ts                    # Variáveis de ambiente
│   ├── domain/                   # Regras de domínio + testes
│   └── hooks/
│       ├── useApi.ts             # React Query hooks
│       └── usePayments.ts        # Hook de pagamentos
│
├── types/                        # Definições TypeScript
├── drizzle.config.ts             # Config Drizzle Kit
└── public/                       # Assets estáticos
```

## 📖 Como Usar

### 1. Autenticação

**Registo**

- Visita `/register` para criar uma nova conta
- Apenas admins podem promover utilizadores a founder ou admin
- Por defeito, novos utilizadores são guests

**Login**

- Visita `/login`
- Usa email e password
- O token JWT é guardado em `localStorage` e enviado como `Bearer` nas APIs
- O token JWT é válido por 7 dias

### 2. Sistema de Temporadas

As temporadas organizam os jantares em períodos (máx. 8 jantares: 7 regulares + 1 extra):

**Criar Temporada** (Admin/Founder)

- Acede a partir da home quando não há temporada ativa
- Jantares criados são associados à temporada ativa

**Gerir Temporada Ativa**

- Apenas uma temporada pode estar ativa de cada vez
- Controla quantos jantares cada membro pode organizar

### 3. Gerir Jantares

**Criar Jantar** (Founders)

- Acede a `/create-dinner`
- Define nome, data, localização
- Escolhe modo de prova cego ou aberto
- Designa um anfitrião (host)

**Adicionar Garrafas**

- Acede ao jantar e clica "Adicionar Garrafa"
- Preenche informações: nome, produtor, ano, tipo
- Adiciona foto (opcional)
- Define quem trouxe a garrafa

**Iniciar Jantar**

- Clica "Iniciar Jantar" quando estiver pronto
- No modo cego, as informações das garrafas ficam ocultas
- Os participantes podem começar a classificar

### 4. Classificar Vinhos

**Durante o Jantar**

- Acede a `/bottles/[id]/rate`
- Atribui uma nota de 1.0 a 10.0
- Adiciona notas de prova (opcional)
- Podes editar a tua classificação a qualquer momento

**Modo Prova Cega**

- As informações das garrafas são ocultadas
- Apenas vês a etiqueta (A, B, C...)
- Classifica baseado apenas na prova

### 5. Cerimónia de Revelação

**Revelar Garrafas** (Organizadores)

- Acede a `/dinners/[id]/reveal`
- Clica "Revelar Próxima" para mostrar cada garrafa
- Vê as classificações em tempo real
- Celebra os vencedores!

**Ver Rankings**

- Acede a `/dinners/[id]/rankings`
- Vê classificações médias e critérios de desempate
- Identifica os vinhos mais bem classificados

### 6. Fotos do Jantar

- Acede a `/dinners/[id]/photos`
- Faz upload de fotos (Cloudflare R2)
- Partilha memórias com o grupo

### 7. Sistema de Pagamentos e Multas

**Gerir Pagamentos** (Admin)

- Secção de pagamentos no detalhe do jantar
- Marca quotas como pagas
- Adiciona / edita / remove multas
- Vê estatísticas de pagamentos

### 8. Mandamentos do Vinho

- Acede a `/mandamentos` a partir da página inicial
- 13 mandamentos fundamentais
- 4 penalizações por violações

### 9. Estatísticas

- Acede a `/stats`
- Vê estatísticas de todas as temporadas
- Consulta totais de pagamentos e multas

### 10. Perfil e Admin

- `/profile` — foto, histórico e dados pessoais
- `/admin` — gestão de utilizadores e roles (apenas admins)

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Base de Dados**: Neon PostgreSQL + Drizzle ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Autenticação**: JWT (Bearer em localStorage) + bcrypt
- **Data Fetching**: TanStack React Query
- **Validação**: Zod
- **Formulários**: React Hook Form
- **Testes**: Vitest
- **Deploy**: Vercel

## 📦 Dependências Principais

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "drizzle-orm": "^0.45.1",
    "@aws-sdk/client-s3": "^3.990.0",
    "@tanstack/react-query": "^5.90.6",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "next": "^16.2.6",
    "react": "19.2.0",
    "react-hook-form": "^7.66.0",
    "zod": "^4.1.12"
  }
}
```

## 🔒 Características de Segurança

- ✅ Autenticação baseada em JWT com expiração de 7 dias
- ✅ Hashing de passwords com Bcrypt
- ✅ Controlo de acesso baseado em roles (RBAC)
- ✅ Validação de variáveis de ambiente
- ✅ Rotas API protegidas com `requireAuth`
- ✅ Queries parametrizadas via Drizzle ORM
- ✅ Constraints únicas em ratings e payments

## 🎨 Destaques UI/UX

- 🌗 Design glassmorphism com backdrop blur
- 🎭 Animações e transições suaves
- 📱 Design mobile-first totalmente responsivo
- 🎨 Tema gradiente roxo/rosa
- ⚡ Loading skeletons para melhor UX
- 🔔 Sistema de notificações toast
- 🌐 Interface 100% em Português (PT-PT)
- 🎯 Otimizado para dispositivos móveis

## 🧪 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # ESLint
npm test             # Vitest (testes unitários de domínio)
npm run test:watch   # Vitest em modo watch
npm run db:generate  # Gerar migrações Drizzle
npm run db:studio    # Abrir Drizzle Studio
```

### Variáveis de Ambiente

| Variável                | Descrição                                      | Obrigatória |
| ----------------------- | ---------------------------------------------- | ----------- |
| `DATABASE_URL`          | Connection string Neon PostgreSQL              | Sim         |
| `JWT_SECRET`            | Secret para tokens JWT (mín. 32 chars)         | Sim         |
| `R2_ENDPOINT`           | Endpoint Cloudflare R2                         | Sim         |
| `R2_ACCESS_KEY_ID`      | Access key R2                                  | Sim         |
| `R2_SECRET_ACCESS_KEY`  | Secret key R2                                  | Sim         |
| `R2_BUCKET_NAME`        | Nome do bucket R2                              | Sim         |
| `R2_PUBLIC_URL`         | URL pública do bucket (imagens)                | Sim         |

## 📝 Principais API Endpoints

### 🔐 Autenticação

- `POST /api/auth/login` - Login de utilizador
- `POST /api/auth/register` - Registo de utilizador

### 🍷 Jantares

- `GET /api/dinners` - Listar todos os jantares
- `POST /api/dinners` - Criar novo jantar (apenas founders)
- `POST /api/dinners/:id/start` - Iniciar prova cega
- `POST /api/dinners/:id/end` - Terminar jantar
- `GET /api/dinners/:id/bottles` - Obter garrafas do jantar
- `GET /api/dinners/:id/ratings` - Obter rankings finais
- `POST /api/dinners/:id/photos` - Upload de foto do jantar
- `GET /api/dinners/:id/photos` - Listar fotos do jantar

### 🍾 Garrafas e Classificações

- `GET /api/bottles/:id` - Detalhes da garrafa
- `GET /api/bottles/:id/ratings` - Classificações da garrafa
- `POST /api/bottles/:id/ratings` - Submeter/atualizar classificação

### 🎭 Cerimónia de Revelação

- `GET /api/dinners/:id/reveal-status` - Estado da revelação
- `POST /api/dinners/:id/reveal-next` - Revelar próxima garrafa

### 🏆 Temporadas

- `GET /api/seasons` - Listar temporadas
- `POST /api/seasons` - Criar temporada (apenas founders)
- `GET /api/seasons/active` - Obter temporada ativa
- `GET /api/seasons/:id/stats` - Estatísticas da temporada
- `POST /api/seasons/:id/close` - Fechar temporada (apenas admin)

### 💰 Pagamentos e Multas

- `GET /api/dinners/:id/payments` - Listar pagamentos do jantar
- `PATCH /api/dinners/:id/payments/:paymentId` - Atualizar pagamento (apenas admin)
- `POST /api/dinners/:id/payments/:paymentId/fines` - Adicionar multa (apenas admin)
- `DELETE /api/dinners/:id/payments/:paymentId/fines/:fineId` - Remover multa (apenas admin)

### 📊 Estatísticas

- `GET /api/stats/all-seasons` - Estatísticas globais de todas as temporadas

### 👥 Administração

- `GET /api/admin/users` - Listar todos os utilizadores (apenas admin)
- `PATCH /api/admin/users/:id` - Atualizar role do utilizador (apenas admin)

### 📸 Upload

- `POST /api/upload` - Upload de imagens para Cloudflare R2

---

## 🚀 Deploy na Vercel

### Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Base de dados Neon configurada
- Bucket Cloudflare R2 configurado
- Repositório Git (GitHub, GitLab ou Bitbucket)

### Passos para Deploy

1. **Prepara o Repositório**

   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. **Importa o Projeto na Vercel**

   - Acede a [vercel.com](https://vercel.com) e faz login
   - Clica em "Add New Project"
   - Seleciona o teu repositório Git
   - Clica em "Import"

3. **Configura as Variáveis de Ambiente**

   Na secção "Environment Variables", adiciona:

   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=seu_secret_com_pelo_menos_32_caracteres
   R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=...
   R2_PUBLIC_URL=https://...
   ```

4. **Deploy!**
   - Clica em "Deploy"
   - Aguarda o build
   - Recebe o URL do teu site

### Deploy Automático

A Vercel faz deploy automático quando fazes push para o branch principal.

---

## 🤝 Contribuir

Contribuições são bem-vindas! Sente-te à vontade para submeter um Pull Request.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.

## 👨‍💻 Autor

**José Carreira** - [@zecarreira](https://github.com/zecarreira)

## 🙏 Agradecimentos

- Ícones: Sistema de design baseado em Emojis
- Inspiração UI: Tendências modernas de glassmorphism
- Agradecimento especial a todos os entusiastas de vinho que testaram esta aplicação

---

Feito com ❤️ e 🍷 por José Carreira
