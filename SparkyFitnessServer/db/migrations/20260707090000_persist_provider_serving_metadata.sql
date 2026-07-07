-- Persist provider provenance and serving metadata for imported foods.
-- Backwards compatible: existing non-provider rows default to unverified; Yazio rows
-- are marked verified because they came from the verified Yazio provider before the
-- explicit flag existed. Variants keep NULL serving metadata until refreshed from
-- an external provider.

ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS provider_verified boolean DEFAULT false NOT NULL;

UPDATE public.foods
SET provider_verified = TRUE,
    updated_at = now()
WHERE provider_type = 'yazio'
  AND COALESCE(provider_verified, FALSE) = FALSE;

ALTER TABLE public.food_variants
  ADD COLUMN IF NOT EXISTS serving_description text,
  ADD COLUMN IF NOT EXISTS serving_weight numeric,
  ADD COLUMN IF NOT EXISTS serving_weight_unit text;
