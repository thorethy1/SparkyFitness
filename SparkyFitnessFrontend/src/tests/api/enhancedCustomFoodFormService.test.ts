import {
  createFoodVariant,
  saveFood,
} from '@/api/Foods/enhancedCustomFoodFormService';
import { apiCall } from '@/api/api';
import type { Food, FoodVariant } from '@/types/food';

jest.mock('@/api/api', () => ({
  apiCall: jest.fn(),
}));

const mockApiCall = jest.mocked(apiCall);

const createVariant = (overrides: Partial<FoodVariant> = {}): FoodVariant => ({
  serving_size: 1,
  serving_unit: 'piece',
  serving_description: '1 piece (200 g)',
  serving_weight: 200,
  serving_weight_unit: 'g',
  calories: 50,
  protein: 1,
  carbs: 10,
  fat: 1,
  ...overrides,
});

const createFood = (overrides: Partial<Food> = {}): Food => ({
  id: '',
  name: 'Yazio Apple',
  brand: 'Yazio',
  is_custom: true,
  barcode: '1234567890123',
  provider_type: 'yazio',
  provider_external_id: 'yazio-apple-1',
  provider_verified: true,
  ...overrides,
});

describe('enhancedCustomFoodFormService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends provider serving metadata when creating a single food variant', async () => {
    mockApiCall.mockResolvedValue({ id: 'variant-1' });

    await createFoodVariant('food-1', createVariant());

    expect(mockApiCall).toHaveBeenCalledWith(
      '/foods/food-variants',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          food_id: 'food-1',
          serving_size: 1,
          serving_unit: 'piece',
          serving_description: '1 piece (200 g)',
          serving_weight: 200,
          serving_weight_unit: 'g',
        }),
      })
    );
  });

  it('preserves provider verified and serving metadata when saving a new barcode food', async () => {
    mockApiCall.mockResolvedValueOnce({ id: 'food-1' });

    await saveFood(createFood(), [createVariant()], 'user-1');

    expect(mockApiCall).toHaveBeenCalledWith(
      '/foods',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          barcode: '1234567890123',
          provider_type: 'yazio',
          provider_external_id: 'yazio-apple-1',
          provider_verified: true,
          serving_description: '1 piece (200 g)',
          serving_weight: 200,
          serving_weight_unit: 'g',
        }),
      })
    );
  });

  it('preserves serving metadata for additional variants on new foods', async () => {
    mockApiCall
      .mockResolvedValueOnce({ id: 'food-1' })
      .mockResolvedValueOnce([{ id: 'variant-2' }]);

    await saveFood(
      createFood(),
      [
        createVariant({
          serving_size: 100,
          serving_unit: 'g',
          serving_description: '100 g',
        }),
        createVariant({
          serving_size: 1,
          serving_unit: 'whole',
          serving_description: '1 whole (20 g)',
          serving_weight: 20,
        }),
      ],
      'user-1'
    );

    expect(mockApiCall).toHaveBeenCalledWith(
      '/foods/food-variants/bulk',
      expect.objectContaining({
        method: 'POST',
        body: [
          expect.objectContaining({
            serving_size: 1,
            serving_unit: 'whole',
            serving_description: '1 whole (20 g)',
            serving_weight: 20,
            serving_weight_unit: 'g',
          }),
        ],
      })
    );
  });
});
