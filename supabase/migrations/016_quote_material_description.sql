-- Free-form description of the main flooring line item (mirrors Farkas-style "Install and supply..." text)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS material_description text;
