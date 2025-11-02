import { StockMovementService } from '../stockMovementService';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errorHandler';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    raw: jest.fn((sql) => sql),
  },
}));

describe('StockMovementService', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockGte: jest.Mock;
  let mockLte: jest.Mock;
  let mockSingle: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    mockLte = jest.fn().mockReturnThis();
    mockGte = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      gte: mockGte,
      lte: mockLte,
    }));
    mockSelect = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      gte: mockGte,
      lte: mockLte,
    }));
    mockInsert = jest.fn().mockImplementation(() => ({
      select: mockSelect,
      single: mockSingle,
    }));
    mockUpdate = jest.fn().mockImplementation(() => ({
      eq: mockEq,
    }));
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('getAll', () => {
    it('should fetch all stock movements for a project', async () => {
      const mockMovements = [
        { id: 1, product_id: 1, type: 'in', quantity: 10, project_id: 1 },
        { id: 2, product_id: 2, type: 'out', quantity: 5, project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockMovements, error: null });

      const result = await StockMovementService.getAll({ projectId: 1 });

      expect(mockFrom).toHaveBeenCalledWith('stock_movements');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should filter by product id', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await StockMovementService.getAll({ projectId: 1, productId: 5 });

      expect(mockEq).toHaveBeenCalledWith('product_id', 5);
    });

    it('should filter by movement type', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await StockMovementService.getAll({ projectId: 1, type: 'in' });

      expect(mockEq).toHaveBeenCalledWith('type', 'in');
    });

    it('should filter by date range', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await StockMovementService.getAll({
        projectId: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(mockGte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('date', '2024-12-31');
    });

    it('should filter by bulk status', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await StockMovementService.getAll({ projectId: 1, isBulk: true });

      expect(mockEq).toHaveBeenCalledWith('is_bulk', true);
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(
        StockMovementService.getAll({ projectId: 1 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should fetch a single stock movement by id', async () => {
      const mockMovement = { id: 1, product_id: 1, type: 'in', quantity: 10 };

      mockSingle.mockResolvedValue({ data: mockMovement, error: null });

      const result = await StockMovementService.getById(1);

      expect(mockFrom).toHaveBeenCalledWith('stock_movements');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result?.id).toBe(1);
    });

    it('should return null when movement not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await StockMovementService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new stock movement', async () => {
      const input = {
        product_id: 1,
        type: 'in' as const,
        quantity: 10,
        date: '2024-01-01',
        user_id: 'user-123',
        project_id: 1,
      };
      const createdMovement = { id: 1, ...input };

      mockSingle.mockResolvedValue({ data: createdMovement, error: null });

      const result = await StockMovementService.create(input);

      expect(mockFrom).toHaveBeenCalledWith('stock_movements');
      expect(mockInsert).toHaveBeenCalledWith([input]);
      expect(result.id).toBe(1);
    });

    it('should throw AppError when creation fails', async () => {
      const mockError = { message: 'Create failed', code: 'CREATE_ERROR' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        StockMovementService.create({
          product_id: 1,
          type: 'in',
          quantity: 10,
          date: '2024-01-01',
          user_id: 'user-123',
          project_id: 1,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getBulkMovements', () => {
    it('should fetch all bulk movements for a project', async () => {
      const mockBulkMovements = [
        { id: 1, date: '2024-01-01', type: 'out', project_id: 1 },
        { id: 2, date: '2024-01-02', type: 'in', project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockBulkMovements, error: null });

      const result = await StockMovementService.getBulkMovements(1);

      expect(mockFrom).toHaveBeenCalledWith('bulk_movements');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(StockMovementService.getBulkMovements(1)).rejects.toThrow(
        AppError
      );
    });
  });

  describe('reverseBulkMovement', () => {
    it('should reverse a bulk movement successfully', async () => {
      // Mock bulk movement check
      mockSingle.mockResolvedValueOnce({
        data: { id: 1, can_be_reversed: true, project_id: 1 },
        error: null,
      });

      // Mock movements fetch
      mockSelect.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            product_id: 1,
            type: 'out',
            quantity: 10,
            user_id: 'user-123',
            project_id: 1,
          },
        ],
        error: null,
      });

      // Mock product update
      mockEq.mockResolvedValueOnce({ error: null });

      // Mock reverse movement insert
      mockInsert.mockResolvedValueOnce({ error: null });

      // Mock bulk movement update
      mockEq.mockResolvedValueOnce({ error: null });

      await StockMovementService.reverseBulkMovement(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('bulk_movements');
      expect(mockFrom).toHaveBeenCalledWith('stock_movements');
      expect(mockFrom).toHaveBeenCalledWith('products');
    });

    it('should throw error when bulk movement cannot be reversed', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 1, can_be_reversed: false, project_id: 1 },
        error: null,
      });

      await expect(
        StockMovementService.reverseBulkMovement(1, 1)
      ).rejects.toThrow(/geri alınamaz/);
    });

    it('should throw error when bulk movement not found', async () => {
      const mockError = { message: 'Not found', code: 'NOT_FOUND' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        StockMovementService.reverseBulkMovement(999, 1)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getByBulkId', () => {
    it('should fetch movements by bulk id', async () => {
      const mockMovements = [
        { id: 1, bulk_id: 'bulk-123', product_id: 1, project_id: 1 },
        { id: 2, bulk_id: 'bulk-123', product_id: 2, project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockMovements, error: null });

      const result = await StockMovementService.getByBulkId('bulk-123', 1);

      expect(mockFrom).toHaveBeenCalledWith('stock_movements');
      expect(mockEq).toHaveBeenCalledWith('bulk_id', 'bulk-123');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(
        StockMovementService.getByBulkId('bulk-123', 1)
      ).rejects.toThrow(AppError);
    });
  });
});
