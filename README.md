# 🍷 Jantar do Vinho - Wine Rating App

Uma aplicação sofisticada para jantares de prova de vinhos às cegas, construída com Next.js 16, React 19 e Supabase. Organiza jantares de vinho com amigos, classifica vinhos às cegas e descobre os vencedores numa cerimónia interativa de revelação.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)

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

- Organiza jantares em temporadas de 7 eventos
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

### � **Design Mobile-First**

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
- Conta Supabase

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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_min_32_characters
```

Gera um JWT secret seguro:

```bash
openssl rand -base64 32
```

4. **Configura a base de dados Supabase**

Executa os scripts SQL na pasta `migrations/` pela ordem:

- `create_payments_system.sql` - Sistema de pagamentos e multas
- `create_profile_photos_bucket.sql` - Bucket para fotos de perfil
- `add_organizer_to_dinners.sql` - Sistema de organizadores
- `add_profile_photo_url.sql` - URLs de fotos de perfil
- `add_fines_update_delete_policies.sql` - Políticas de multas

Ou executa todos de uma vez no SQL Editor do Supabase.

5. **Configura o Storage no Supabase**

Cria os seguintes buckets públicos:

- `bottle-photos` - Para fotos de garrafas
- `dinner-photos` - Para fotos de jantares
- `profile-photos` - Para fotos de perfil

6. **Executa o servidor de desenvolvimento**

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
│   │   └── upload/               # Upload de imagens
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
│   ├── bottles/                  # Gestão de garrafas
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
│   ├── Header.tsx                # Cabeçalho com navegação
│   ├── Button.tsx                # Componente de botão
│   ├── Input.tsx                 # Componente de input
│   ├── Card.tsx                  # Componente de card
│   ├── Badge.tsx                 # Componente de badge
│   ├── LoadingSpinner.tsx        # Spinner de loading
│   ├── Skeletons.tsx             # Skeleton loaders
│   ├── Textarea.tsx              # Componente de textarea
│   ├── PaymentsSection.tsx       # Secção de pagamentos
│   ├── ToastProvider.tsx         # Provider de notificações
│   └── ReactQueryProvider.tsx    # Provider do React Query
│
├── lib/                          # Utilitários e configuração
│   ├── db.ts                     # Cliente Supabase
│   ├── auth.ts                   # Lógica de autenticação JWT
│   ├── auth-client.ts            # Auth client-side
│   ├── middleware.ts             # Middleware de autenticação
│   ├── validations.ts            # Schemas de validação Zod
│   ├── env.ts                    # Variáveis de ambiente
│   └── hooks/
│       └── useApi.ts             # Custom hook para chamadas API
│
├── types/                        # Definições TypeScript
│   └── season.ts                 # Tipos do sistema de temporadas
│
├── migrations/                   # Scripts SQL do Supabase
│   ├── create_payments_system.sql
│   ├── create_profile_photos_bucket.sql
│   ├── add_organizer_to_dinners.sql
│   ├── add_profile_photo_url.sql
│   ├── add_fines_update_delete_policies.sql
│   └── MIGRATION_GUIDE.md
│
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
- O token JWT é válido por 7 dias

### 2. Sistema de Temporadas

As temporadas organizam os jantares em períodos (ex: "Temporada 2024"):

**Criar Temporada** (Admin/Founder)

- Acede a `/seasons`
- Define nome, datas de início e fim
- Define valor da quota
- Adiciona membros à temporada

**Gerir Temporada Ativa**

- Apenas uma temporada pode estar ativa de cada vez
- Jantares criados são automaticamente associados à temporada ativa
- Controla o máximo de jantares que cada membro pode organizar

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
- Apenas vês o número da posição
- Classifica baseado apenas na prova

### 5. Cerimónia de Revelação

**Revelar Garrafas** (Organizadores)

- Acede a `/dinners/[id]/reveal`
- Clica "Revelar Próxima" para mostrar cada garrafa
- Vê as classificações em tempo real
- Celebra os vencedores!

**Ver Rankings**

- Acede a `/dinners/[id]/rankings`
- Vê classificações médias
- Vê distribuição de notas
- Identifica os vinhos mais bem classificados

### 6. Fotos do Jantar

**Adicionar Fotos**

- Acede a `/dinners/[id]/photos`
- Faz upload de fotos do jantar
- Partilha memórias com o grupo

### 7. Sistema de Pagamentos e Multas

**Gerir Pagamentos** (Admin)

- Acede a `/seasons/[id]/payments`
- Marca quotas como pagas
- Adiciona multas a membros
- Vê estatísticas de pagamentos da temporada

**Tipos de Multas**

- Valor fixo ou percentagem da quota
- Descrição obrigatória
- Sistema de aprovação por admins

### 8. Mandamentos do Vinho

**Consultar Regras**

- Acede a `/mandamentos` a partir da página inicial
- 13 mandamentos fundamentais
- 4 penalizações por violações
- Mantém o espírito do grupo!

### 9. Estatísticas

**Painel de Stats**

- Acede a `/stats`
- Vê estatísticas de todas as temporadas
- Consulta médias pessoais
- Compara com outros membros
- Identifica vinhos top-rated

### 10. Perfil

**Gerir Perfil**

- Acede a `/profile`
- Atualiza foto de perfil
- Vê histórico de classificações
- Acompanha estatísticas pessoais

### 11. Painel Admin

**Funcionalidades Admin**

- Acede a `/admin` (apenas admins)
- Gere utilizadores
- Define roles (guest, founder, admin)
- Monitora atividade da plataforma

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Base de Dados**: Supabase (PostgreSQL)
- **Autenticação**: JWT com bcrypt
- **Data Fetching**: TanStack React Query
- **Validação**: Zod
- **Formulários**: React Hook Form
- **Deploy**: Vercel

## 📦 Dependências Principais

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.78.0",
    "@tanstack/react-query": "latest",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2",
    "next": "16.0.1",
    "react": "19.2.0",
    "react-hook-form": "latest",
    "zod": "latest"
  }
}
```

## 🔒 Características de Segurança

- ✅ Autenticação baseada em JWT com expiração de 7 dias
- ✅ Hashing de passwords com Bcrypt
- ✅ Controlo de acesso baseado em roles (RBAC)
- ✅ Validação de variáveis de ambiente
- ✅ Rotas API protegidas
- ✅ Prevenção de SQL injection via Supabase
- ✅ CORS configurado para acesso em rede local

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
npm run dev      # Iniciar servidor de desenvolvimento
npm run build    # Build para produção
npm run start    # Iniciar servidor de produção
npm run lint     # Executar ESLint
```

### Variáveis de Ambiente

| Variável                        | Descrição                              | Obrigatória |
| ------------------------------- | -------------------------------------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do teu projeto Supabase            | Sim         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anónima do Supabase              | Sim         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave de service role do Supabase      | Sim         |
| `JWT_SECRET`                    | Secret para tokens JWT (mín. 32 chars) | Sim         |

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

- `POST /api/upload` - Upload de imagens (garrafas, jantares, perfis)

---

## 🚀 Deploy na Vercel

### Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Projeto Supabase configurado
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
   NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=seu_secret_com_pelo_menos_32_caracteres
   ```

4. **Deploy!**
   - Clica em "Deploy"
   - Aguarda alguns minutos enquanto a Vercel faz o build
   - Recebe o URL do teu site: `https://wine-app.vercel.app`

### Configuração Pós-Deploy

1. **Atualiza os CORS no Supabase**

   - Acede ao Dashboard do Supabase
   - Settings → API → CORS
   - Adiciona o domínio Vercel: `https://wine-app.vercel.app`

2. **Testa o Site**

   - Acede ao URL do Vercel
   - Faz login/registo
   - Verifica que tudo funciona

3. **Domínio Personalizado (Opcional)**
   - Na Vercel, vai a Settings → Domains
   - Adiciona o teu domínio personalizado
   - Segue as instruções para configurar DNS

### Deploy Automático

A Vercel faz deploy automático quando fazes push para o branch principal:

```bash
git add .
git commit -m "Nova funcionalidade"
git push origin main
```

O site é automaticamente atualizado em produção! 🎉

### Variáveis de Ambiente para Produção

⚠️ **Importante**: Certifica-te que todas as 4 variáveis estão configuradas:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `JWT_SECRET`

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
