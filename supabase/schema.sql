-- BEN HQ Database Schema - Single User Version
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTE: This is a single-user app
-- No authentication required
-- No Row Level Security needed
-- ============================================

-- ============================================
-- LEGAL DEMANDS
-- ============================================

CREATE TABLE demand_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  client_name TEXT NOT NULL,
  case_number TEXT,
  injury_type TEXT,
  incident_date DATE,
  status TEXT DEFAULT 'draft', -- draft, processing, generated, sent, resolved
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE demand_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES demand_cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES demand_cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS & POMODORO
-- ============================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- money, agency, health, film, photo, personal, relationship
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  estimated_pomodoros INTEGER DEFAULT 1,
  completed_pomodoros INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pomodoros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL, -- minutes (25, 5, 15)
  type TEXT NOT NULL, -- work, short_break, long_break
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brain_dump (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  content TEXT NOT NULL,
  converted_to_task BOOLEAN DEFAULT FALSE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOALS HIERARCHY
-- ============================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT NOT NULL, -- 4-year, 2-year, 1-year, quarterly, monthly, weekly, daily
  category TEXT NOT NULL, -- business, health, creative, finance, relationship, personal
  target_date DATE,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  success_metric TEXT,
  current_progress TEXT,
  progress_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'on_track', -- on_track, at_risk, behind, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENT MANAGEMENT
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  package_type TEXT, -- starter, growth, elite
  service_type TEXT, -- social, authority, ads, photo, web, signature
  monthly_rate INTEGER,
  status TEXT DEFAULT 'active', -- active, paused, cancelled
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- social_post, video, photo, blog, ad, website, other
  platform TEXT, -- instagram, facebook, tiktok, youtube, website, etc
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, review, approved, scheduled, completed
  priority TEXT DEFAULT 'medium',
  estimated_time INTEGER, -- hours
  actual_time INTEGER, -- hours tracked
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- daily, weekly, monthly
  parent_deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  notes TEXT,
  file_urls TEXT[], -- array of storage URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, received, late
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPPORTUNITIES
-- ============================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- contest, competition, grant, festival, deadline, other
  category TEXT NOT NULL, -- film, photo, business, sports, creative
  deadline DATE NOT NULL,
  submission_requirements TEXT,
  entry_fee INTEGER,
  prize_amount INTEGER,
  website_url TEXT,
  status TEXT DEFAULT 'researching', -- researching, preparing, submitted, accepted, rejected
  notes TEXT,
  reminder_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opportunity_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  submission_date DATE NOT NULL,
  materials_submitted TEXT,
  confirmation_number TEXT,
  result TEXT,
  result_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HABITS & METRICS
-- ============================================

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- health, business, creative, relationship, personal
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  target_count INTEGER DEFAULT 1,
  points INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE personal_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  health_score INTEGER DEFAULT 0,
  wealth_score INTEGER DEFAULT 0,
  business_score INTEGER DEFAULT 0,
  creative_score INTEGER DEFAULT 0,
  relationship_score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  requirement TEXT,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FINANCE
-- ============================================

CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  category TEXT, -- client_work, project, passive, other
  amount INTEGER NOT NULL,
  frequency TEXT, -- one_time, weekly, monthly, annual
  expected_date DATE,
  received_date DATE,
  status TEXT DEFAULT 'pending', -- pending, received, late
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- housing, food, transport, business, entertainment, health, other
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT, -- weekly, monthly, annual
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  original_amount INTEGER NOT NULL,
  current_balance INTEGER NOT NULL,
  interest_rate DECIMAL(5,2),
  minimum_payment INTEGER,
  due_date INTEGER, -- day of month
  payoff_goal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  category TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  billing_cycle TEXT NOT NULL, -- monthly, annual
  next_billing_date DATE NOT NULL,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_day INTEGER NOT NULL, -- day of month
  auto_pay BOOLEAN DEFAULT FALSE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  hours DECIMAL(4,2) NOT NULL,
  date DATE NOT NULL,
  billable BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE revenue_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  month DATE NOT NULL,
  client_revenue INTEGER DEFAULT 0,
  project_revenue INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  expenses INTEGER DEFAULT 0,
  net_profit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX idx_deliverables_due_date ON deliverables(due_date);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_at);

