import { RecipeService } from '../recipeService';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errorHandler';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('RecipeService', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockIlike: jest.Mock;
  let mockSingle: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    mockLimit = jest.fn().mockReturnThis();
    mockIlike = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      limit: mockLimit,
    }));
    mockSelect = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      ilike: mockIlike,
      order: mockOrder,
      single: mockSingle,
      limit: mockLimit,
    }));
    mockInsert = jest.fn().mockImplementation(() => ({
      select: mockSelect,
      single: mockSingle,
    }));
    mockUpdate = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      select: mockSelect,
      single: mockSingle,
    }));
    mockDelete = jest.fn().mockImplementation(() => ({
      eq: mockEq,
    }));
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getAll', () => {
    it('should fetch all recipes for a project', async () => {
      const mockRecipes = [
        { id: 1, name: 'Recipe 1', category: 'Main', project_id: 1 },
        { id: 2, name: 'Recipe 2', category: 'Dessert', project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockRecipes, error: null });

      const result = await RecipeService.getAll({ projectId: 1 });

      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should filter by category', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await RecipeService.getAll({ projectId: 1, category: 'Main' });

      expect(mockEq).toHaveBeenCalledWith('category', 'Main');
    });

    it('should filter by search query', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await RecipeService.getAll({ projectId: 1, searchQuery: 'pasta' });

      expect(mockIlike).toHaveBeenCalledWith('name', '%pasta%');
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(RecipeService.getAll({ projectId: 1 })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('getById', () => {
    it('should fetch recipe with ingredients', async () => {
      const mockRecipe = { id: 1, name: 'Test Recipe', project_id: 1 };
      const mockIngredients = [
        {
          id: 1,
          product_id: 1,
          quantity: 100,
          unit: 'g',
          products: { name: 'Flour', price: 5 },
        },
      ];

      mockSingle.mockResolvedValueOnce({ data: mockRecipe, error: null });
      mockSelect.mockResolvedValueOnce({ data: mockIngredients, error: null });

      const result = await RecipeService.getById(1, 1);

      expect(result?.name).toBe('Test Recipe');
      expect(result?.ingredients).toHaveLength(1);
      expect(result?.ingredients[0].product_name).toBe('Flour');
    });

    it('should return null when recipe not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await RecipeService.getById(999, 1);

      expect(result).toBeNull();
    });

    it('should throw AppError when ingredients fetch fails', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 1, name: 'Recipe' },
        error: null,
      });
      const mockError = { message: 'Ingredients error', code: 'ING_ERROR' };
      mockSelect.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(RecipeService.getById(1, 1)).rejects.toThrow(AppError);
    });
  });

  describe('create', () => {
    it('should create recipe with ingredients', async () => {
      const recipe = {
        name: 'New Recipe',
        category: 'Main',
        serving_size: 4,
        project_id: 1,
      };
      const ingredients = [
        { product_id: 1, quantity: 100, unit: 'g' },
        { product_id: 2, quantity: 50, unit: 'ml' },
      ];

      mockSingle.mockResolvedValue({
        data: { id: 1, ...recipe },
        error: null,
      });
      mockInsert.mockResolvedValueOnce({ error: null });

      const result = await RecipeService.create(recipe, ingredients);

      expect(mockFrom).toHaveBeenCalledWith('recipes');
      expect(mockFrom).toHaveBeenCalledWith('recipe_ingredients');
      expect(result.id).toBe(1);
    });

    it('should rollback recipe if ingredients insert fails', async () => {
      const recipe = {
        name: 'Recipe',
        category: 'Main',
        serving_size: 4,
        project_id: 1,
      };
      const ingredients = [{ product_id: 1, quantity: 100, unit: 'g' }];

      mockSingle.mockResolvedValueOnce({
        data: { id: 1, ...recipe },
        error: null,
      });

      const ingredientsError = {
        message: 'Ingredients error',
        code: 'ING_ERROR',
      };
      mockInsert.mockReturnValueOnce({ error: ingredientsError });

      mockEq.mockResolvedValueOnce({ error: null }); // rollback delete

      await expect(
        RecipeService.create(recipe, ingredients)
      ).rejects.toThrow(AppError);

      // Verify rollback was called
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update recipe without ingredients', async () => {
      const recipeData = {
        id: 1,
        name: 'Updated Recipe',
      };

      mockSingle.mockResolvedValue({
        data: { id: 1, name: 'Updated Recipe' },
        error: null,
      });

      const result = await RecipeService.update(recipeData);

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Recipe' });
      expect(result.name).toBe('Updated Recipe');
    });

    it('should update recipe with new ingredients', async () => {
      const recipeData = { id: 1, name: 'Updated' };
      const ingredients = [{ product_id: 1, quantity: 100, unit: 'g' }];

      mockSingle.mockResolvedValue({
        data: { id: 1, name: 'Updated' },
        error: null,
      });
      mockEq.mockResolvedValueOnce({ error: null }); // delete old
      mockInsert.mockResolvedValueOnce({ error: null }); // insert new

      await RecipeService.update(recipeData, ingredients);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw AppError when update fails', async () => {
      const mockError = { message: 'Update error', code: 'UPDATE_ERROR' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        RecipeService.update({ id: 1, name: 'Updated' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete recipe when not used in menus', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null }); // no menu items
      mockEq.mockResolvedValueOnce({ error: null }); // delete ingredients
      mockEq.mockResolvedValueOnce({ error: null }); // delete recipe

      await RecipeService.delete(1, 1);

      expect(mockDelete).toHaveBeenCalledTimes(2); // ingredients + recipe
    });

    it('should throw AppError when recipe is used in menus', async () => {
      mockLimit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      await expect(RecipeService.delete(1, 1)).rejects.toThrow(AppError);
      await expect(RecipeService.delete(1, 1)).rejects.toThrow(
        /menülerde kullanılıyor/
      );
    });

    it('should throw AppError when menu check fails', async () => {
      const mockError = { message: 'Check error', code: 'CHECK_ERROR' };
      mockLimit.mockResolvedValue({ data: null, error: mockError });

      await expect(RecipeService.delete(1, 1)).rejects.toThrow(AppError);
    });
  });

  describe('getIngredients', () => {
    it('should fetch recipe ingredients', async () => {
      const mockIngredients = [
        {
          id: 1,
          product_id: 1,
          quantity: 100,
          unit: 'g',
          products: { name: 'Flour', price: 5 },
        },
        {
          id: 2,
          product_id: 2,
          quantity: 50,
          unit: 'ml',
          products: { name: 'Milk', price: 3 },
        },
      ];

      mockSelect.mockResolvedValue({ data: mockIngredients, error: null });

      const result = await RecipeService.getIngredients(1);

      expect(result).toHaveLength(2);
      expect(result[0].product_name).toBe('Flour');
      expect(result[1].product_name).toBe('Milk');
    });

    it('should throw AppError on fetch error', async () => {
      const mockError = { message: 'Fetch error', code: 'FETCH_ERROR' };
      mockSelect.mockResolvedValue({ data: null, error: mockError });

      await expect(RecipeService.getIngredients(1)).rejects.toThrow(AppError);
    });
  });

  describe('calculateCost', () => {
    it('should calculate recipe total cost', async () => {
      const mockIngredients = [
        {
          id: 1,
          product_id: 1,
          quantity: 2,
          unit: 'kg',
          product_name: 'Flour',
          product_price: 5,
        },
        {
          id: 2,
          product_id: 2,
          quantity: 1,
          unit: 'L',
          product_name: 'Milk',
          product_price: 3,
        },
      ];

      mockSelect.mockResolvedValue({ data: mockIngredients, error: null });

      const result = await RecipeService.calculateCost(1);

      // 2 * 5 + 1 * 3 = 13
      expect(result).toBe(13);
    });
  });
});
