ALTER TABLE quotes ADD COLUMN IF NOT EXISTS section_flooring_types jsonb DEFAULT '{}'::jsonb;
