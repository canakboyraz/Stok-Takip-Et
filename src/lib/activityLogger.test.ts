import { logActivity, getActivityTypeLabel, getEntityTypeLabel, ActivityType, EntityType } from './activityLogger';
import { supabase } from './supabase';

// Mock the supabase module
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }
}));

describe('Activity Logger', () => {
  // Mock console methods to avoid cluttering test output
  const originalConsoleGroup = console.group;
  const originalConsoleGroupEnd = console.groupEnd;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Mock console methods
    console.group = jest.fn();
    console.groupEnd = jest.fn();
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'currentProjectId') return '1';
      return null;
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.group = originalConsoleGroup;
    console.groupEnd = originalConsoleGroupEnd;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('logActivity', () => {
    it('should successfully log activity when user and project are available', async () => {
      // Mock successful user fetch
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      // Mock successful insert
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null
      });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await logActivity(
        'product_create',
        'Test product created',
        'product',
        123
      );

      expect(result).toBe(true);
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('activities');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        project_id: 1,
        action_type: 'product_create',
        action_description: 'Test product created',
        entity_type: 'product',
        entity_id: 123,
        user_email: 'test@example.com',
        ip_address: '127.0.0.1'
      });
    });

    it('should return false when user fetch fails', async () => {
      // Mock user fetch error
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Auth error' }
      });

      const result = await logActivity(
        'product_create',
        'Test product created',
        'product',
        123
      );

      expect(result).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return false when user data is null', async () => {
      // Mock user not found
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: null,
        error: null
      });

      const result = await logActivity(
        'product_create',
        'Test product created',
        'product',
        123
      );

      expect(result).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return false when project ID is not in localStorage', async () => {
      // Mock successful user fetch
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      // Mock localStorage without project ID
      Storage.prototype.getItem = jest.fn(() => null);

      const result = await logActivity(
        'product_create',
        'Test product created',
        'product',
        123
      );

      expect(result).toBe(false);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return false when database insert fails', async () => {
      // Mock successful user fetch
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      // Mock failed insert
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Insert failed',
          code: '23505',
          hint: 'Duplicate key'
        }
      });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await logActivity(
        'product_create',
        'Test product created',
        'product',
        123
      );

      expect(result).toBe(false);
    });

    it('should handle null entity_id', async () => {
      // Mock successful user fetch
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      // Mock successful insert
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null
      });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await logActivity(
        'user_login',
        'User logged in',
        'system',
        null
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_id: null
        })
      );
    });

    it('should catch and handle unexpected errors', async () => {
      // Mock user fetch to throw an error
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await logActivity(
        'product_create',
        'Test product created',
        'product',
        123
      );

      expect(result).toBe(false);
    });

    it('should handle different activity types', async () => {
      // Mock successful user fetch
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      // Mock successful insert
      const mockSelect = jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        error: null
      });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      // Test different activity types
      const activityTypes: ActivityType[] = [
        'stock_add',
        'stock_bulk_out',
        'menu_consumption',
        'expense_create'
      ];

      for (const activityType of activityTypes) {
        jest.clearAllMocks();

        const result = await logActivity(
          activityType,
          `Test ${activityType}`,
          'product',
          1
        );

        expect(result).toBe(true);
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            action_type: activityType
          })
        );
      }
    });
  });

  describe('getActivityTypeLabel', () => {
    it('should return correct Turkish labels for stock operations', () => {
      expect(getActivityTypeLabel('stock_add')).toBe('Stok Girişi');
      expect(getActivityTypeLabel('stock_remove')).toBe('Stok Çıkışı');
      expect(getActivityTypeLabel('stock_bulk_out')).toBe('Toplu Stok Çıkışı');
    });

    it('should return correct Turkish labels for product operations', () => {
      expect(getActivityTypeLabel('product_create')).toBe('Ürün Ekleme');
      expect(getActivityTypeLabel('product_update')).toBe('Ürün Güncelleme');
      expect(getActivityTypeLabel('product_delete')).toBe('Ürün Silme');
    });

    it('should return correct Turkish labels for menu operations', () => {
      expect(getActivityTypeLabel('menu_create')).toBe('Menü Ekleme');
      expect(getActivityTypeLabel('menu_consumption')).toBe('Menü Tüketimi');
      expect(getActivityTypeLabel('menu_consumption_undo')).toBe('Menü Tüketimi Geri Alma');
    });

    it('should return correct Turkish labels for system operations', () => {
      expect(getActivityTypeLabel('user_login')).toBe('Kullanıcı Girişi');
      expect(getActivityTypeLabel('user_logout')).toBe('Kullanıcı Çıkışı');
      expect(getActivityTypeLabel('system_backup')).toBe('Sistem Yedeği');
    });

    it('should return "Bilinmeyen İşlem" for unknown activity type', () => {
      // @ts-ignore - Testing invalid input
      expect(getActivityTypeLabel('unknown_type')).toBe('Bilinmeyen İşlem');
    });

    it('should handle all defined activity types', () => {
      const allTypes: ActivityType[] = [
        'stock_add', 'stock_remove', 'stock_update', 'stock_transfer',
        'stock_adjustment', 'stock_bulk_update', 'stock_bulk_out',
        'product_create', 'product_update', 'product_delete',
        'product_template_create', 'product_template_update', 'product_template_delete',
        'category_create', 'category_update', 'category_delete',
        'recipe_create', 'recipe_update', 'recipe_delete',
        'menu_create', 'menu_update', 'menu_delete', 'menu_consumption', 'menu_consumption_undo',
        'personnel_create', 'personnel_update', 'personnel_delete',
        'expense_create', 'expense_update', 'expense_delete',
        'user_login', 'user_logout', 'system_backup', 'data_export', 'data_import',
        'project_create', 'project_update', 'project_delete', 'project_permission_change'
      ];

      allTypes.forEach(type => {
        const label = getActivityTypeLabel(type);
        expect(label).toBeTruthy();
        expect(label).not.toBe('Bilinmeyen İşlem');
      });
    });
  });

  describe('getEntityTypeLabel', () => {
    it('should return correct Turkish labels for entity types', () => {
      expect(getEntityTypeLabel('product')).toBe('Ürün');
      expect(getEntityTypeLabel('category')).toBe('Kategori');
      expect(getEntityTypeLabel('recipe')).toBe('Tarif');
      expect(getEntityTypeLabel('menu')).toBe('Menü');
      expect(getEntityTypeLabel('personnel')).toBe('Personel');
      expect(getEntityTypeLabel('expense')).toBe('Gider');
      expect(getEntityTypeLabel('project')).toBe('Proje');
      expect(getEntityTypeLabel('system')).toBe('Sistem');
    });

    it('should return correct labels for movement types', () => {
      expect(getEntityTypeLabel('stock_movement')).toBe('Stok Hareketi');
      expect(getEntityTypeLabel('bulk_movement')).toBe('Toplu İşlem');
    });

    it('should return correct labels for template and permission types', () => {
      expect(getEntityTypeLabel('product_template')).toBe('Ürün Şablonu');
      expect(getEntityTypeLabel('user_permission')).toBe('Kullanıcı İzni');
    });

    it('should return "Bilinmeyen Varlık Tipi" for unknown entity type', () => {
      // @ts-ignore - Testing invalid input
      expect(getEntityTypeLabel('unknown_entity')).toBe('Bilinmeyen Varlık Tipi');
    });

    it('should handle all defined entity types', () => {
      const allTypes: EntityType[] = [
        'product', 'product_template', 'category', 'recipe', 'menu',
        'stock_movement', 'bulk_movement', 'personnel', 'expense',
        'project', 'user_permission', 'system'
      ];

      allTypes.forEach(type => {
        const label = getEntityTypeLabel(type);
        expect(label).toBeTruthy();
        expect(label).not.toBe('Bilinmeyen Varlık Tipi');
      });
    });
  });
});
