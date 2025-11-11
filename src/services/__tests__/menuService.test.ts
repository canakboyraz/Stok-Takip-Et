import { MenuService } from '../menuService';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errorHandler';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('MenuService', () => {
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
    it('should fetch all menus for a project', async () => {
      const mockMenus = [
        { id: 1, name: 'Menu 1', date: '2024-01-01', project_id: 1 },
        { id: 2, name: 'Menu 2', date: '2024-01-02', project_id: 1 },
      ];

      mockOrder.mockResolvedValue({ data: mockMenus, error: null });

      const result = await MenuService.getAll({ projectId: 1 });

      expect(mockFrom).toHaveBeenCalledWith('menus');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should filter by date range', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await MenuService.getAll({
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

      await expect(MenuService.getAll({ projectId: 1 })).rejects.toThrow(
        AppError
      );
    });
  });

  describe('getById', () => {
    it('should fetch menu with recipes', async () => {
      const mockMenu = { id: 1, name: 'Test Menu', project_id: 1 };
      const mockItems = [
        {
          id: 1,
          recipe_id: 1,
          quantity: 2,
          recipes: { name: 'Recipe 1', category: 'Main', serving_size: 4 },
        },
      ];

      mockSingle.mockResolvedValueOnce({ data: mockMenu, error: null });
      mockSelect.mockResolvedValueOnce({ data: mockItems, error: null });

      const result = await MenuService.getById(1, 1);

      expect(result?.name).toBe('Test Menu');
      expect(result?.recipes).toHaveLength(1);
      expect(result?.recipes[0].recipe_name).toBe('Recipe 1');
    });

    it('should return null when menu not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await MenuService.getById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create menu with recipes', async () => {
      const menu = {
        name: 'New Menu',
        date: '2024-01-01',
        project_id: 1,
      };
      const recipes = [
        { recipe_id: 1, quantity: 2 },
        { recipe_id: 2, quantity: 1 },
      ];

      mockSingle.mockResolvedValue({
        data: { id: 1, ...menu },
        error: null,
      });
      mockInsert.mockResolvedValueOnce({ error: null });

      const result = await MenuService.create(menu, recipes);

      expect(mockFrom).toHaveBeenCalledWith('menus');
      expect(mockFrom).toHaveBeenCalledWith('menu_items');
      expect(result.id).toBe(1);
    });

    it('should rollback menu if items insert fails', async () => {
      const menu = { name: 'Menu', date: '2024-01-01', project_id: 1 };
      const recipes = [{ recipe_id: 1, quantity: 1 }];

      mockSingle.mockResolvedValueOnce({
        data: { id: 1, ...menu },
        error: null,
      });

      const itemsError = { message: 'Items error', code: 'ITEMS_ERROR' };
      mockInsert.mockReturnValueOnce({ error: itemsError });

      mockEq.mockResolvedValueOnce({ error: null }); // rollback delete

      await expect(MenuService.create(menu, recipes)).rejects.toThrow(AppError);

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update menu without recipes', async () => {
      const menuData = { id: 1, name: 'Updated Menu' };

      mockSingle.mockResolvedValue({
        data: { id: 1, name: 'Updated Menu' },
        error: null,
      });

      const result = await MenuService.update(menuData);

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated Menu' });
      expect(result.name).toBe('Updated Menu');
    });

    it('should update menu with new recipes', async () => {
      const menuData = { id: 1, name: 'Updated' };
      const recipes = [{ recipe_id: 1, quantity: 2 }];

      mockSingle.mockResolvedValue({
        data: { id: 1, name: 'Updated' },
        error: null,
      });
      mockEq.mockResolvedValueOnce({ error: null }); // delete old
      mockInsert.mockResolvedValueOnce({ error: null }); // insert new

      await MenuService.update(menuData, recipes);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete menu and its items', async () => {
      mockEq.mockResolvedValueOnce({ error: null }); // delete items
      mockEq.mockResolvedValueOnce({ error: null }); // delete menu

      await MenuService.delete(1, 1);

      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('should throw AppError when items delete fails', async () => {
      const mockError = { message: 'Delete error', code: 'DELETE_ERROR' };
      mockEq.mockResolvedValue({ error: mockError });

      await expect(MenuService.delete(1, 1)).rejects.toThrow(AppError);
    });
  });

  describe('getMenuItems', () => {
    it('should fetch menu items', async () => {
      const mockItems = [
        {
          id: 1,
          recipe_id: 1,
          quantity: 2,
          recipes: { name: 'Recipe 1', serving_size: 4 },
        },
        {
          id: 2,
          recipe_id: 2,
          quantity: 1,
          recipes: { name: 'Recipe 2', serving_size: 2 },
        },
      ];

      mockSelect.mockResolvedValue({ data: mockItems, error: null });

      const result = await MenuService.getMenuItems(1);

      expect(result).toHaveLength(2);
      expect(result[0].recipe_name).toBe('Recipe 1');
    });
  });

  describe('calculateConsumption', () => {
    it('should calculate consumption for a menu', async () => {
      // Mock menu items
      mockSelect.mockResolvedValueOnce({
        data: [{ recipe_id: 1, quantity: 1 }],
        error: null,
      });

      // Mock recipe
      mockSingle.mockResolvedValueOnce({
        data: { serving_size: 4 },
        error: null,
      });

      // Mock ingredients
      mockSelect.mockResolvedValueOnce({
        data: [
          {
            product_id: 1,
            quantity: 100,
            unit: 'g',
            products: {
              name: 'Flour',
              price: 5,
              stock_quantity: 1000,
            },
          },
        ],
        error: null,
      });

      const result = await MenuService.calculateConsumption(1, 8);

      expect(result).toHaveLength(1);
      expect(result[0].product_name).toBe('Flour');
      expect(result[0].total_needed).toBe(200); // 100 * 1 * (8/4)
      expect(result[0].sufficient).toBe(true);
    });

    it('should handle insufficient stock', async () => {
      mockSelect.mockResolvedValueOnce({
        data: [{ recipe_id: 1, quantity: 1 }],
        error: null,
      });

      mockSingle.mockResolvedValueOnce({
        data: { serving_size: 2 },
        error: null,
      });

      mockSelect.mockResolvedValueOnce({
        data: [
          {
            product_id: 1,
            quantity: 1000,
            unit: 'g',
            products: {
              name: 'Sugar',
              price: 3,
              stock_quantity: 500,
            },
          },
        ],
        error: null,
      });

      const result = await MenuService.calculateConsumption(1, 4);

      expect(result[0].sufficient).toBe(false);
      expect(result[0].total_needed).toBeGreaterThan(
        result[0].current_stock
      );
    });
  });
});
