ALTER TABLE quotes ADD COLUMN IF NOT EXISTS extras_json jsonb DEFAULT '{}'::jsonb;
