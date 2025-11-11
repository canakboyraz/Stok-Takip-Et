import { ProductService } from '../productService';
import { supabase } from '../../lib/supabase';

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ProductService', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;
  let mockOrder: jest.Mock;
  let mockGt: jest.Mock;
  let mockLte: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock chain
    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockOrder = jest.fn().mockReturnThis();
    mockGt = jest.fn().mockReturnThis();
    mockLte = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockImplementation(() => ({
      order: mockOrder,
      single: mockSingle,
      gt: mockGt,
      lte: mockLte,
    }));
    mockSelect = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      gt: mockGt,
      lte: mockLte,
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
    it('should fetch all products for a project', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', project_id: 1 },
        { id: 2, name: 'Product 2', project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockProducts, error: null });

      const result = await ProductService.getAll({ projectId: 1 });

      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
    });

    it('should filter out zero stock when showZeroStock is false', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', stock_quantity: 10 },
        { id: 2, name: 'Product 2', stock_quantity: 0 },
      ];

      mockGt.mockResolvedValue({ data: mockProducts, error: null });

      await ProductService.getAll({ projectId: 1, showZeroStock: false });

      expect(mockGt).toHaveBeenCalledWith('stock_quantity', 0);
    });

    it('should filter by category when provided', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', category: 'Test Category' }];

      mockEq.mockImplementation((field: string) => {
        if (field === 'category') {
          return { order: mockOrder };
        }
        return { eq: mockEq, order: mockOrder };
      });

      mockOrder.mockResolvedValue({ data: mockProducts, error: null });

      await ProductService.getAll({ projectId: 1, category: 'Test Category' });

      expect(mockEq).toHaveBeenCalledWith('category', 'Test Category');
    });

    it('should handle errors gracefully', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(
        ProductService.getAll({ projectId: 1 })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should fetch a single product by id', async () => {
      const mockProduct = { id: 1, name: 'Test Product', project_id: 1 };

      mockSingle.mockResolvedValue({ data: mockProduct, error: null });

      const result = await ProductService.getById(1);

      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result.name).toBe('Test Product');
    });

    it('should throw error when product not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });

      await expect(ProductService.getById(999)).rejects.toThrow('Ürün bulunamadı');
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        category: 'Test',
        unit: 'kg',
        price: 10,
        project_id: 1,
      };

      const createdProduct = { ...newProduct, id: 1 };

      mockSingle.mockResolvedValue({ data: createdProduct, error: null });

      const result = await ProductService.create(newProduct);

      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockInsert).toHaveBeenCalledWith([newProduct]);
      expect(result.id).toBe(1);
    });

    it('should handle creation errors', async () => {
      const mockError = { message: 'Duplicate key', code: '23505' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        ProductService.create({
          name: 'Product',
          category: 'Test',
          unit: 'kg',
          price: 10,
          project_id: 1,
        })
      ).rejects.toThrow('Duplicate key');
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      const updates = { name: 'Updated Product', price: 20 };
      const updatedProduct = { id: 1, ...updates };

      mockSingle.mockResolvedValue({ data: updatedProduct, error: null });

      const result = await ProductService.update(1, updates);

      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result.name).toBe('Updated Product');
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      mockEq.mockResolvedValue({ error: null });

      await ProductService.delete(1);

      expect(mockFrom).toHaveBeenCalledWith('products');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    it('should handle deletion errors', async () => {
      const mockError = { message: 'Foreign key constraint', code: '23503' };
      mockEq.mockResolvedValue({ error: mockError });

      await expect(ProductService.delete(1)).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('updateStock', () => {
    it('should update product stock quantity', async () => {
      const updatedProduct = { id: 1, stock_quantity: 100 };

      mockSingle.mockResolvedValue({ data: updatedProduct, error: null });

      const result = await ProductService.updateStock(1, 100);

      expect(mockUpdate).toHaveBeenCalledWith({ stock_quantity: 100 });
      expect(result.stock_quantity).toBe(100);
    });
  });

  describe('getLowStock', () => {
    it('should fetch products with low stock', async () => {
      const mockProducts = [
        { id: 1, name: 'Low Stock Product', stock_quantity: 5, min_stock: 10 },
      ];

      mockLte.mockResolvedValue({ data: mockProducts, error: null });

      const result = await ProductService.getLowStock(1);

      expect(mockLte).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Low Stock Product');
    });
  });
});
