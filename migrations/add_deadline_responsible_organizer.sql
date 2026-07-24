-- Admin-assigned organizer for the active deadline cycle
ALTER TABLE deadline_cycles
  ADD COLUMN IF NOT EXISTS responsible_organizer_id uuid REFERENCES users(id);
