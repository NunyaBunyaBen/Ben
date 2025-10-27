# BEN HQ - Life Operating System

Your complete business and life management platform.

**Single-User App - No Authentication Required**

## Features

- **Legal Demands Automation** - Upload medical PDFs, AI generates demand letters
- **Task Management** - Tasks with Pomodoro timer
- **Goals Hierarchy** - 4-year goals cascade to daily tasks
- **Client Management** - Track clients, projects, deliverables
- **Content Calendar** - Master calendar + per-client view
- **Opportunities Tracker** - Contests, grants, deadlines
- **Habits Tracking** - Daily habits with point system
- **Personal Metrics** - Life category scores (health, wealth, business, creative, relationship)
- **Finance Dashboard** - Income, expenses, debt, budgets, subscriptions

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Supabase (Database + Storage)
- Lucide React (Icons)

**No authentication - This is a personal app for one user**

## Setup

### 1. Supabase Setup

Create a Supabase project at https://supabase.com

Run the SQL in `supabase/schema.sql` to create all tables.

Create storage buckets:
- `demand-documents` (private)
- `client-assets` (private)
- `content-media` (private)
- `deliverables` (private)

### 2. Environment Variables

Create `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Deploy

Deploy to Vercel:
```bash
vercel deploy
```

## Project Structure

```
ben-hq/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   ├── LegalDemands.jsx
│   │   ├── Tasks.jsx
│   │   ├── Goals.jsx
│   │   ├── Clients.jsx
│   │   ├── ContentCalendar.jsx
│   │   ├── Opportunities.jsx
│   │   ├── Habits.jsx
│   │   ├── Metrics.jsx
│   │   ├── Finance.jsx
│   │   └── Analytics.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── schema.sql
│   └── functions/
│       └── process-demand/
├── public/
└── package.json
```

## Development Phases

**Phase 1: Foundation** ✓
- Project setup
- Supabase connection
- Auth flow
- Basic navigation

**Phase 2: Critical Features** (This Week)
- Legal demands automation
- Task list + Pomodoro
- Basic client list
- Habit tracking

**Phase 3: Advanced Features** (Next Week)
- Goals hierarchy
- Content calendar
- Finance dashboard
- Opportunities tracker

**Phase 4: Polish**
- Analytics
- Mobile optimization
- Performance tuning

## Notes

This is a production-ready application. No childish language, no gamification cheese - just clean, professional data tracking and goal management.
