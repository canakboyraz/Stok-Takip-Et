import { ExpenseService } from '../expenseService';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errorHandler';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ExpenseService', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
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
    it('should fetch all expenses for a project', async () => {
      const mockExpenses = [
        {
          id: 1,
          amount: 100,
          category: 'Food',
          date: '2024-01-01',
          project_id: 1,
        },
        {
          id: 2,
          amount: 200,
          category: 'Transport',
          date: '2024-01-02',
          project_id: 1,
        },
      ];

      mockOrder.mockResolvedValue({ data: mockExpenses, error: null });

      const result = await ExpenseService.getAll({ projectId: 1 });

      expect(mockFrom).toHaveBeenCalledWith('expenses');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should filter by category', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await ExpenseService.getAll({ projectId: 1, category: 'Food' });

      expect(mockEq).toHaveBeenCalledWith('category', 'Food');
    });

    it('should filter by date range', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await ExpenseService.getAll({
        projectId: 1,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(mockGte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('date', '2024-12-31');
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(ExpenseService.getAll({ projectId: 1 })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('getById', () => {
    it('should fetch a single expense by id', async () => {
      const mockExpense = {
        id: 1,
        amount: 100,
        category: 'Food',
        project_id: 1,
      };

      mockSingle.mockResolvedValue({ data: mockExpense, error: null });

      const result = await ExpenseService.getById(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('expenses');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result?.amount).toBe(100);
    });

    it('should return null when expense not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await ExpenseService.getById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const input = {
        amount: 100,
        category: 'Food',
        date: '2024-01-01',
        project_id: 1,
      };
      const createdExpense = { id: 1, ...input };

      mockSingle.mockResolvedValue({ data: createdExpense, error: null });

      const result = await ExpenseService.create(input);

      expect(mockFrom).toHaveBeenCalledWith('expenses');
      expect(mockInsert).toHaveBeenCalledWith([input]);
      expect(result.id).toBe(1);
    });

    it('should throw AppError when creation fails', async () => {
      const mockError = { message: 'Create failed', code: 'CREATE_ERROR' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        ExpenseService.create({
          amount: 100,
          category: 'Food',
          date: '2024-01-01',
          project_id: 1,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update an existing expense', async () => {
      const input = { id: 1, amount: 150 };
      const updatedExpense = {
        id: 1,
        amount: 150,
        category: 'Food',
        project_id: 1,
      };

      mockSingle.mockResolvedValue({ data: updatedExpense, error: null });

      const result = await ExpenseService.update(input);

      expect(mockUpdate).toHaveBeenCalledWith({ amount: 150 });
      expect(result.amount).toBe(150);
    });
  });

  describe('delete', () => {
    it('should delete an expense', async () => {
      mockEq.mockResolvedValue({ error: null });

      await ExpenseService.delete(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('expenses');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw AppError when delete fails', async () => {
      const mockError = { message: 'Delete failed', code: 'DELETE_ERROR' };
      mockEq.mockResolvedValue({ error: mockError });

      await expect(ExpenseService.delete(1, 1)).rejects.toThrow(AppError);
    });
  });

  describe('getByDateRange', () => {
    it('should fetch expenses within date range', async () => {
      const mockExpenses = [
        {
          id: 1,
          amount: 100,
          date: '2024-01-15',
          category: 'Food',
          project_id: 1,
        },
      ];

      mockOrder.mockResolvedValue({ data: mockExpenses, error: null });

      const result = await ExpenseService.getByDateRange(
        1,
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockGte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('date', '2024-01-31');
      expect(result).toHaveLength(1);
    });
  });

  describe('getTotalByCategory', () => {
    it('should aggregate expenses by category', async () => {
      const mockExpenses = [
        { category: 'Food', amount: 100 },
        { category: 'Food', amount: 50 },
        { category: 'Transport', amount: 200 },
      ];

      mockSelect.mockResolvedValue({ data: mockExpenses, error: null });

      const result = await ExpenseService.getTotalByCategory(1);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('Transport'); // sorted by total
      expect(result[0].total).toBe(200);
      expect(result[1].category).toBe('Food');
      expect(result[1].total).toBe(150);
      expect(result[1].count).toBe(2);
    });

    it('should handle expenses without category', async () => {
      const mockExpenses = [{ category: null, amount: 100 }];

      mockSelect.mockResolvedValue({ data: mockExpenses, error: null });

      const result = await ExpenseService.getTotalByCategory(1);

      expect(result[0].category).toBe('Diğer');
    });
  });

  describe('getTotalForDateRange', () => {
    it('should calculate total expenses for date range', async () => {
      const mockExpenses = [
        {
          id: 1,
          amount: 100,
          date: '2024-01-15',
          category: 'Food',
          project_id: 1,
        },
        {
          id: 2,
          amount: 200,
          date: '2024-01-20',
          category: 'Transport',
          project_id: 1,
        },
      ];

      mockOrder.mockResolvedValue({ data: mockExpenses, error: null });

      const result = await ExpenseService.getTotalForDateRange(
        1,
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toBe(300);
    });
  });
});
