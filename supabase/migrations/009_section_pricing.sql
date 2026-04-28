ALTER TABLE quotes ADD COLUMN IF NOT EXISTS section_pricing jsonb DEFAULT '{}'::jsonb;
