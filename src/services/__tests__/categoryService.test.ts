import { CategoryService } from '../categoryService';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errorHandler';

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('CategoryService', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockNeq: jest.Mock;
  let mockSingle: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    mockLimit = jest.fn().mockReturnThis();
    mockNeq = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      limit: mockLimit,
    }));
    mockSelect = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      neq: mockNeq,
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
    it('should fetch all categories for a project', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1', project_id: 1 },
        { id: 2, name: 'Category 2', project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockCategories, error: null });

      const result = await CategoryService.getAll(1);

      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Category 1');
    });

    it('should return empty array when no categories found', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await CategoryService.getAll(1);

      expect(result).toEqual([]);
    });

    it('should throw AppError when database error occurs', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(CategoryService.getAll(1)).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should fetch a single category by id and project', async () => {
      const mockCategory = { id: 1, name: 'Test Category', project_id: 1 };

      mockSingle.mockResolvedValue({ data: mockCategory, error: null });

      const result = await CategoryService.getById(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result?.name).toBe('Test Category');
    });

    it('should return null when category not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await CategoryService.getById(999, 1);

      expect(result).toBeNull();
    });

    it('should throw AppError for other database errors', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(CategoryService.getById(1, 1)).rejects.toThrow(AppError);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const input = { name: 'New Category', project_id: 1 };
      const createdCategory = { id: 1, ...input };

      mockSingle.mockResolvedValue({ data: createdCategory, error: null });

      const result = await CategoryService.create(input);

      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockInsert).toHaveBeenCalledWith([input]);
      expect(result.id).toBe(1);
      expect(result.name).toBe('New Category');
    });

    it('should throw AppError when creation fails', async () => {
      const mockError = { message: 'Duplicate key', code: '23505' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        CategoryService.create({ name: 'Category', project_id: 1 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const input = { id: 1, name: 'Updated Category' };
      const updatedCategory = { id: 1, name: 'Updated Category', project_id: 1 };

      mockSingle.mockResolvedValue({ data: updatedCategory, error: null });

      const result = await CategoryService.update(input);

      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Category' });
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result.name).toBe('Updated Category');
    });

    it('should throw AppError when update fails', async () => {
      const mockError = { message: 'Update failed', code: 'UPDATE_ERROR' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        CategoryService.update({ id: 1, name: 'Updated' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete a category when no products exist', async () => {
      // Mock empty products check
      mockLimit.mockResolvedValue({ data: [], error: null });
      // Mock successful delete
      mockEq.mockResolvedValue({ error: null });

      await CategoryService.delete(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw AppError when category has products', async () => {
      // Mock products exist
      mockLimit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      await expect(CategoryService.delete(1, 1)).rejects.toThrow(AppError);
      await expect(CategoryService.delete(1, 1)).rejects.toThrow(
        /Bu kategoriye ait ürünler var/
      );
    });

    it('should throw AppError when product check fails', async () => {
      const mockError = { message: 'Check failed', code: 'CHECK_ERROR' };
      mockLimit.mockResolvedValue({ data: null, error: mockError });

      await expect(CategoryService.delete(1, 1)).rejects.toThrow(AppError);
    });

    it('should throw AppError when delete operation fails', async () => {
      // Mock empty products check
      mockLimit.mockResolvedValue({ data: [], error: null });
      // Mock delete error
      const mockError = { message: 'Delete failed', code: 'DELETE_ERROR' };
      mockEq.mockResolvedValue({ error: mockError });

      await expect(CategoryService.delete(1, 1)).rejects.toThrow(AppError);
    });
  });

  describe('nameExists', () => {
    it('should return true when category name exists', async () => {
      mockSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });

      const result = await CategoryService.nameExists('Existing Category', 1);

      expect(result).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('name', 'Existing Category');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
    });

    it('should return false when category name does not exist', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });

      const result = await CategoryService.nameExists('New Category', 1);

      expect(result).toBe(false);
    });

    it('should exclude specific category id when provided', async () => {
      mockNeq.mockResolvedValue({ data: [], error: null });

      await CategoryService.nameExists('Category', 1, 5);

      expect(mockNeq).toHaveBeenCalledWith('id', 5);
    });

    it('should return false when database error occurs', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockSelect.mockResolvedValue({ data: null, error: mockError });

      const result = await CategoryService.nameExists('Category', 1);

      expect(result).toBe(false);
    });
  });

  describe('getWithProductCount', () => {
    it('should fetch categories with product counts', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Category 1',
          project_id: 1,
          products: [{ count: 5 }],
        },
        {
          id: 2,
          name: 'Category 2',
          project_id: 1,
          products: [{ count: 3 }],
        },
      ];

      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const result = await CategoryService.getWithProductCount(1);

      expect(mockFrom).toHaveBeenCalledWith('categories');
      expect(result).toHaveLength(2);
      expect(result[0].product_count).toBe(5);
      expect(result[1].product_count).toBe(3);
    });

    it('should handle categories with no products', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Empty Category',
          project_id: 1,
          products: [],
        },
      ];

      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const result = await CategoryService.getWithProductCount(1);

      expect(result[0].product_count).toBe(0);
    });

    it('should throw AppError when database error occurs', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(CategoryService.getWithProductCount(1)).rejects.toThrow(
        AppError
      );
    });
  });
});
