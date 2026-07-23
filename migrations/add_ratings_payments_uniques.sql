-- Unique indexes for ratings (one per bottle+user) and payments (one per dinner+user).
-- Apply when ready — check for duplicates first! See MIGRATION_GUIDE.md.

-- Before apply, run:
-- SELECT bottle_id, user_id, COUNT(*) FROM ratings GROUP BY bottle_id, user_id HAVING COUNT(*) > 1;
-- SELECT dinner_id, user_id, COUNT(*) FROM payments GROUP BY dinner_id, user_id HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ratings_bottle_user_unique ON ratings (bottle_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_dinner_user_unique ON payments (dinner_id, user_id);
