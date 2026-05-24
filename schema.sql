-- ============================================================
--  PRICE ALERT BOT — Supabase Schema
--  Paste this entire file into:
--  https://supabase.com/dashboard/project/YOUR_ID/sql/new
--  Then click "Run"
-- ============================================================

-- ── DEALS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deals (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  price          NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  drop_pct       NUMERIC(5, 2),
  store          TEXT NOT NULL,
  source         TEXT NOT NULL,
  url            TEXT,
  alert_type     TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deals_store_idx      ON deals (store);
CREATE INDEX IF NOT EXISTS deals_created_at_idx ON deals (created_at DESC);
CREATE INDEX IF NOT EXISTS deals_alert_type_idx ON deals (alert_type);

-- ── ALERTED TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerted (
  url        TEXT PRIMARY KEY,
  price      NUMERIC(10, 2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE deals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerted ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read deals"
  ON deals FOR SELECT USING (true);

CREATE POLICY "Service insert deals"
  ON deals FOR INSERT WITH CHECK (true);

CREATE POLICY "Service manage alerted"
  ON alerted FOR ALL USING (true) WITH CHECK (true);
