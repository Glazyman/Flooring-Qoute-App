-- Adds a free-form jsonb bag of "checkbox" options describing the job
-- (scope, finish, install method, rooms involved, removals, trim, site
-- access, etc). Used by the QuoteForm right-side checklist that mirrors
-- contractors' paper estimate forms.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS job_options jsonb DEFAULT '{}'::jsonb;
