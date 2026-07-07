-- Persist provider provenance and serving metadata for imported foods.
-- Backwards compatible: existing rows default to unverified and variants keep NULL
-- serving metadata until they are refreshed from an external provider.

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS provider_verified boolean DEFAULT false NOT NULL;

ALTER TABLE public.food_variants
  ADD COLUMN IF NOT EXISTS serving_description text,
  ADD COLUMN IF NOT EXISTS serving_weight numeric,
  ADD COLUMN IF NOT EXISTS serving_weight_unit text;
