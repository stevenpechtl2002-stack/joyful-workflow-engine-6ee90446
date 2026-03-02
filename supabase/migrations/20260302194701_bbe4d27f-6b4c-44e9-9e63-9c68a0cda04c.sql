
-- Add slug column
ALTER TABLE public.customers ADD COLUMN slug text UNIQUE;

-- Backfill existing salons with slugs from company_name
UPDATE public.customers
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        COALESCE(company_name, ''),
        'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'Ä', 'Ae'), 'Ö', 'Oe'), 'Ü', 'Ue'), 'ß', 'ss'),
      '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g')
  )
WHERE company_name IS NOT NULL AND company_name != '' AND slug IS NULL;
