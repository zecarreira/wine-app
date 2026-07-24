-- Calendar availability poll + inter-dinner deadline penalties
-- Apply on Neon: psql $DATABASE_URL -f migrations/add_calendar_deadline.sql

-- App settings (global defaults; interval change does not retroact on open cycles)
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dinner_interval_months integer NOT NULL DEFAULT 6,
  deadline_fine_amount integer NOT NULL DEFAULT 20,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Deadline cycles (snapshot interval/fine; no pause_penalties column)
CREATE TABLE IF NOT EXISTS deadline_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_dinner_id uuid REFERENCES dinners(id),
  anchor_date date NOT NULL,
  interval_months integer NOT NULL,
  fine_amount integer NOT NULL,
  deadline_at date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS deadline_cycles_one_active
  ON deadline_cycles (status)
  WHERE status = 'active';

-- Penalties: unique (cycle_id, period_index); reemit = edit row
CREATE TABLE IF NOT EXISTS deadline_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES deadline_cycles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  period_index integer NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  period_deadline date,
  dinner_id uuid REFERENCES dinners(id),
  payment_id uuid REFERENCES payments(id),
  fine_id uuid REFERENCES fines(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  waived_by uuid REFERENCES users(id),
  waived_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS deadline_penalties_cycle_period_unique
  ON deadline_penalties (cycle_id, period_index);

-- Availability polls: max one open
CREATE TABLE IF NOT EXISTS availability_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'open',
  window_start date NOT NULL,
  window_end date NOT NULL,
  suggested_organizer_id uuid REFERENCES users(id),
  created_by uuid REFERENCES users(id),
  chosen_date date,
  created_dinner_id uuid REFERENCES dinners(id),
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_polls_one_open
  ON availability_polls (status)
  WHERE status = 'open';

CREATE TABLE IF NOT EXISTS availability_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES availability_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_responses_poll_user_unique
  ON availability_responses (poll_id, user_id);

CREATE TABLE IF NOT EXISTS availability_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES availability_responses(id) ON DELETE CASCADE,
  day date NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_days_response_day_unique
  ON availability_days (response_id, day);
