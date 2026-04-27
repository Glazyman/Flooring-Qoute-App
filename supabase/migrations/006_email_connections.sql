CREATE TABLE IF NOT EXISTS email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  provider text NOT NULL,
  email_address text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members manage email connections"
  ON email_connections FOR ALL
  USING (company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()));
