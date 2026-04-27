-- Add section column to quote_rooms for grouping by area (Upstairs/Downstairs/Kitchen/Foyer)
ALTER TABLE quote_rooms ADD COLUMN IF NOT EXISTS section text;
