ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS quote_number_prefix text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_number_prefix text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS next_quote_number integer DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS next_invoice_number integer DEFAULT 1;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS default_quote_valid_days integer DEFAULT 30;
