# 🍷 Jantar do Vinho - Wine Rating App

A sophisticated blind wine tasting app built with Next.js 16, React 19, and Supabase. Host wine dinners with friends, rate wines blind, and discover the winners in an interactive reveal ceremony.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🎭 **Blind Tasting Mode**

- Wines are shuffled and labeled A, B, C... during tasting
- Names and details hidden until the reveal ceremony
- Deterministic shuffling ensures all guests see the same order

### ⭐ **Rating System**

- Rate wines from 1-10 with half-point precision
- Add detailed tasting notes for each wine
- Edit your ratings before the dinner ends

### 🎪 **Interactive Reveal Ceremony**

- Progressive bottle-by-bottle reveal
- Dramatic animations and emoji celebrations
- Shows all ratings and average scores
- Crowns the winner at the end

### 👑 **Role-Based Access**

- **Admin**: Full system control
- **Founder**: Create dinners, manage bottles (max 7)
- **Guest**: Join dinners and rate wines

### 📊 **Statistics & Rankings**

- Final leaderboard with detailed scores
- Individual tasting notes displayed
- Total points and average calculations

### 📸 **Photo Gallery**

- Upload photos during the dinner
- Share memories with participants

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/zecarreira/wine-app.git
cd wine-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_min_32_characters
```

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

4. **Set up Supabase database**

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'founder', 'guest')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dinners table
CREATE TABLE dinners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  is_blind BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'ended', 'revealing', 'completed')),
  host_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bottles table
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dinner_id UUID REFERENCES dinners(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  producer TEXT,
  vintage INTEGER,
  wine_type TEXT CHECK (wine_type IN ('red', 'white', 'rosé', 'sparkling', 'dessert', 'other')),
  description TEXT,
  position INTEGER NOT NULL,
  brought_by UUID REFERENCES users(id),
  revealed BOOLEAN DEFAULT FALSE,
  reveal_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id UUID REFERENCES bottles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 1 AND score <= 10),
  tasting_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bottle_id, user_id)
);

-- Create photos table (optional)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dinner_id UUID REFERENCES dinners(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_dinners_created_by ON dinners(created_by);
CREATE INDEX idx_bottles_dinner_id ON bottles(dinner_id);
CREATE INDEX idx_ratings_bottle_id ON ratings(bottle_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_photos_dinner_id ON photos(dinner_id);
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
wine-rating-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── dinners/              # Dinner management
│   │   ├── bottles/              # Bottle & ratings
│   │   └── admin/                # Admin endpoints
│   ├── dinners/                  # Dinner pages
│   ├── bottles/                  # Bottle rating pages
│   ├── login/                    # Auth pages
│   └── admin/                    # Admin panel
├── components/                   # Reusable UI components
│   ├── Header.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── LoadingSpinner.tsx
│   ├── Skeletons.tsx
│   ├── ToastProvider.tsx
│   └── ReactQueryProvider.tsx
├── lib/                          # Utilities & config
│   ├── auth.ts                   # JWT authentication
│   ├── auth-client.ts            # Client-side auth utils
│   ├── db.ts                     # Supabase client
│   ├── env.ts                    # Environment validation
│   ├── middleware.ts             # API middleware
│   ├── validations.ts            # Zod schemas
│   └── hooks/
│       └── useApi.ts             # React Query hooks
└── public/                       # Static assets
```

## 🎯 Usage Guide

### For Founders

1. **Create a Dinner**

   - Go to `/dinners`
   - Click "Create New Dinner"
   - Fill in details and enable blind tasting

2. **Add Bottles**

   - Enter dinner detail page
   - Click "Add Wine Bottle"
   - Add wine information

3. **Start Tasting**

   - When ready, click "Start Blind Tasting"
   - Wines will be shuffled and hidden
   - Share dinner link with guests

4. **End & Reveal**
   - When tasting is complete, click "End Dinner"
   - Start the reveal ceremony
   - Reveal bottles one by one

### For Guests

1. **Join a Dinner**

   - Navigate to `/dinners`
   - Select a dinner from the list

2. **Rate Wines**

   - During active tasting, click "Rate This Wine"
   - Use slider to set score (1-10)
   - Add tasting notes (optional)
   - Submit rating

3. **View Results**
   - After reveal, check final rankings
   - See everyone's ratings and notes

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with bcrypt
- **Data Fetching**: TanStack React Query
- **Validation**: Zod
- **Forms**: React Hook Form

## 📦 Key Dependencies

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

## 🔒 Security Features

- ✅ JWT-based authentication with 7-day expiration
- ✅ Bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Environment variable validation
- ✅ Protected API routes
- ✅ SQL injection prevention via Supabase

## 🎨 UI/UX Highlights

- 🌗 Glassmorphism design with backdrop blur
- 🎭 Smooth animations and transitions
- 📱 Fully responsive mobile-first design
- 🎨 Purple/pink gradient theme
- ⚡ Loading skeletons for better UX
- 🔔 Toast notifications system

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

| Variable                        | Description                          | Required |
| ------------------------------- | ------------------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL            | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key               | Yes      |
| `JWT_SECRET`                    | Secret for JWT tokens (min 32 chars) | Yes      |

## 📝 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Dinners

- `GET /api/dinners` - List all dinners
- `POST /api/dinners` - Create new dinner (founders only)
- `POST /api/dinners/:id/start` - Start blind tasting
- `POST /api/dinners/:id/end` - End dinner
- `GET /api/dinners/:id/bottles` - Get dinner bottles
- `GET /api/dinners/:id/ratings` - Get final rankings

### Bottles & Ratings

- `GET /api/bottles/:id` - Get bottle details
- `GET /api/bottles/:id/ratings` - Get bottle ratings
- `POST /api/bottles/:id/ratings` - Submit/update rating

### Reveal

- `GET /api/dinners/:id/reveal-status` - Check reveal status
- `POST /api/dinners/:id/reveal-next` - Reveal next bottle

### Admin

- `GET /api/admin/users` - List all users (admin only)
- `PATCH /api/admin/users/:id` - Update user role (admin only)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**José Carreira** - [@zecarreira](https://github.com/zecarreira)

## 🙏 Acknowledgments

- Icons: Emoji-based design system
- UI Inspiration: Modern glassmorphism trends
- Special thanks to all wine enthusiasts who tested this app

---

Made with ❤️ and 🍷 by José Carreira
