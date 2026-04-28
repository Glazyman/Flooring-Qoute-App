-- Quote enhancements: flexible line items, scope of work, configurable terms

-- ----------------------------------------------------------------
-- Quote line items (analogous to invoice_line_items but as a real table)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_line_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  position     int NOT NULL DEFAULT 0,
  description  text,
  qty          numeric(12,3) NOT NULL DEFAULT 0,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  total        numeric(12,2) NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_line_items_quote_id_idx
  ON public.quote_line_items (quote_id);

ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;

-- RLS: only members of the quote's company can read/write (mirrors quote_rooms)
DROP POLICY IF EXISTS "Members can access quote line items" ON public.quote_line_items;
CREATE POLICY "Members can access quote line items"
  ON public.quote_line_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      JOIN public.company_members cm ON cm.company_id = q.company_id
      WHERE q.id = quote_line_items.quote_id
        AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      JOIN public.company_members cm ON cm.company_id = q.company_id
      WHERE q.id = quote_line_items.quote_id
        AND cm.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- Scope of Work / Exclusions on quotes
-- ----------------------------------------------------------------
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS scope_of_work text;

-- ----------------------------------------------------------------
-- Configurable quote terms on company_settings
-- ----------------------------------------------------------------
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS terms_validity text
  DEFAULT 'Prices subject to change without notice after 30 days of estimate.';

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS terms_scheduling text
  DEFAULT 'Additional fees may occur if work is not done at one time.';

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS terms_scope text
  DEFAULT 'Any additional work will be priced and billed separately.';

-- Backfill defaults onto existing rows where the column is NULL
UPDATE public.company_settings
SET terms_validity = 'Prices subject to change without notice after 30 days of estimate.'
WHERE terms_validity IS NULL;

UPDATE public.company_settings
SET terms_scheduling = 'Additional fees may occur if work is not done at one time.'
WHERE terms_scheduling IS NULL;

UPDATE public.company_settings
SET terms_scope = 'Any additional work will be priced and billed separately.'
WHERE terms_scope IS NULL;
