ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS default_tax_pct numeric NOT NULL DEFAULT 0;
