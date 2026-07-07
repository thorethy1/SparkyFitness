import {
  createFoodVariant,
  fetchFoodVariants,
  updateFoodVariant,
  type CreateFoodVariantPayload,
  type UpdateFoodVariantPayload,
} from '../services/api/foodsApi';
import type { ExternalFoodVariant } from '../types/externalFoods';
import type { FoodVariantDetail } from '../types/foods';

type SavedFoodWithDefaultVariant = {
  id: string;
  default_variant?: {
    serving_size?: number;
    serving_unit?: string;
  } | null;
};

function variantKey(variant: { serving_size?: number; serving_unit?: string } | null | undefined) {
  return `${variant?.serving_size}:${variant?.serving_unit}`;
}

function normalizedDescription(description?: string | null) {
  return description?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
}

function hasWeightInDescription(description?: string | null) {
  return /\(\s*\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l)\s*\)/i.test(description ?? '');
}

function shouldUpdateExistingVariant(
  existing: FoodVariantDetail,
  external: ExternalFoodVariant,
) {
  const externalDescription = normalizedDescription(external.serving_description);
  const existingDescription = normalizedDescription(existing.serving_description);
  const hasBetterDescription =
    Boolean(externalDescription)
    && externalDescription !== existingDescription
    && (!existingDescription
      || hasWeightInDescription(external.serving_description)
      || externalDescription.length > existingDescription.length);

  const hasBetterWeight =
    external.serving_weight != null
    && (existing.serving_weight == null
      || Number(existing.serving_weight) !== Number(external.serving_weight)
      || existing.serving_weight_unit !== external.serving_weight_unit);

  return hasBetterDescription || hasBetterWeight;
}

function externalVariantToUpdatePayload(
  foodId: string,
  variant: ExternalFoodVariant,
): UpdateFoodVariantPayload {
  return {
    food_id: foodId,
    serving_size: variant.serving_size,
    serving_unit: variant.serving_unit,
    serving_description: variant.serving_description,
    serving_weight: variant.serving_weight,
    serving_weight_unit: variant.serving_weight_unit,
    calories: variant.calories,
    protein: variant.protein,
    carbs: variant.carbs,
    fat: variant.fat,
    saturated_fat: variant.saturated_fat,
    sodium: variant.sodium,
    dietary_fiber: variant.fiber,
    sugars: variant.sugars,
    trans_fat: variant.trans_fat,
    potassium: variant.potassium,
    calcium: variant.calcium,
    iron: variant.iron,
    cholesterol: variant.cholesterol,
    vitamin_a: variant.vitamin_a,
    vitamin_c: variant.vitamin_c,
  };
}

/**
 * Persist all external provider variants as local food_variants for a saved food.
 *
 * The initial POST /api/foods stores exactly one default_variant. Providers like
 * Yazio can return several serving sizes, so save the remaining variants too,
 * while keeping the operation idempotent for repeated saves/deduped foods.
 */
export async function persistExternalVariants(
  savedFood: SavedFoodWithDefaultVariant,
  externalVariants: ExternalFoodVariant[] | undefined,
) {
  if (!externalVariants || externalVariants.length === 0) return;

  let existingByKey = new Map<string, FoodVariantDetail>();
  let fetchedExistingVariants = false;
  try {
    const existing = await fetchFoodVariants(savedFood.id);
    existingByKey = new Map(existing.map((variant) => [variantKey(variant), variant]));
    fetchedExistingVariants = true;
  } catch {
    // If we can't check existing variants, fall back to the saved default only.
    // A possible duplicate is less harmful than missing all alternate servings.
  }

  const defaultKey = variantKey(savedFood.default_variant);

  await Promise.all(
    externalVariants.map(async (variant) => {
      const key = variantKey(variant);
      const existingVariant = existingByKey.get(key);
      if (existingVariant) {
        if (!shouldUpdateExistingVariant(existingVariant, variant)) return;

        try {
          await updateFoodVariant(
            existingVariant.id,
            externalVariantToUpdatePayload(savedFood.id, variant),
          );
        } catch {
          // Non-blocking: provider metadata backfill should not prevent logging.
        }
        return;
      }
      if (!fetchedExistingVariants && key === defaultKey) return;

      try {
        await createFoodVariant({
          food_id: savedFood.id,
          serving_size: variant.serving_size,
          serving_unit: variant.serving_unit,
          serving_description: variant.serving_description,
          serving_weight: variant.serving_weight,
          serving_weight_unit: variant.serving_weight_unit,
          calories: variant.calories,
          protein: variant.protein,
          carbs: variant.carbs,
          fat: variant.fat,
          saturated_fat: variant.saturated_fat,
          sodium: variant.sodium,
          dietary_fiber: variant.fiber,
          sugars: variant.sugars,
          trans_fat: variant.trans_fat,
          potassium: variant.potassium,
          calcium: variant.calcium,
          iron: variant.iron,
          cholesterol: variant.cholesterol,
          vitamin_a: variant.vitamin_a,
          vitamin_c: variant.vitamin_c,
        } as CreateFoodVariantPayload);
      } catch {
        // Non-blocking: one provider variant failing should not prevent logging.
      }
    }),
  );
}
