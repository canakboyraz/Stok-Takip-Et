import { PersonnelService } from '../personnelService';
import { supabase } from '../../lib/supabase';
import { AppError } from '../../utils/errorHandler';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('PersonnelService', () => {
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
  let mockLimit: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    mockLimit = jest.fn().mockReturnThis();
    mockLte = jest.fn().mockReturnThis();
    mockGte = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      gte: mockGte,
      lte: mockLte,
      limit: mockLimit,
    }));
    mockSelect = jest.fn().mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      gte: mockGte,
      lte: mockLte,
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
    it('should fetch all personnel for a project', async () => {
      const mockPersonnel = [
        {
          id: 1,
          name: 'John Doe',
          position: 'Chef',
          salary: 5000,
          project_id: 1,
        },
        {
          id: 2,
          name: 'Jane Smith',
          position: 'Waiter',
          salary: 3000,
          project_id: 1,
        },
      ];

      mockOrder.mockResolvedValue({ data: mockPersonnel, error: null });

      const result = await PersonnelService.getAll({ projectId: 1 });

      expect(mockFrom).toHaveBeenCalledWith('personnel');
      expect(mockEq).toHaveBeenCalledWith('project_id', 1);
      expect(result).toHaveLength(2);
    });

    it('should filter by position', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await PersonnelService.getAll({ projectId: 1, position: 'Chef' });

      expect(mockEq).toHaveBeenCalledWith('position', 'Chef');
    });

    it('should filter by active status', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      await PersonnelService.getAll({ projectId: 1, isActive: true });

      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should throw AppError on database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' };
      mockOrder.mockResolvedValue({ data: null, error: mockError });

      await expect(
        PersonnelService.getAll({ projectId: 1 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should fetch a single personnel by id', async () => {
      const mockPersonnel = {
        id: 1,
        name: 'John Doe',
        position: 'Chef',
        project_id: 1,
      };

      mockSingle.mockResolvedValue({ data: mockPersonnel, error: null });

      const result = await PersonnelService.getById(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('personnel');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result?.name).toBe('John Doe');
    });

    it('should return null when personnel not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await PersonnelService.getById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new personnel', async () => {
      const input = {
        name: 'John Doe',
        position: 'Chef',
        salary: 5000,
        hire_date: '2024-01-01',
        project_id: 1,
      };
      const createdPersonnel = { id: 1, ...input };

      mockSingle.mockResolvedValue({ data: createdPersonnel, error: null });

      const result = await PersonnelService.create(input);

      expect(mockFrom).toHaveBeenCalledWith('personnel');
      expect(mockInsert).toHaveBeenCalledWith([input]);
      expect(result.id).toBe(1);
    });

    it('should throw AppError when creation fails', async () => {
      const mockError = { message: 'Create failed', code: 'CREATE_ERROR' };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      await expect(
        PersonnelService.create({
          name: 'John',
          position: 'Chef',
          salary: 5000,
          hire_date: '2024-01-01',
          project_id: 1,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update an existing personnel', async () => {
      const input = { id: 1, salary: 5500 };
      const updatedPersonnel = {
        id: 1,
        name: 'John Doe',
        salary: 5500,
        project_id: 1,
      };

      mockSingle.mockResolvedValue({ data: updatedPersonnel, error: null });

      const result = await PersonnelService.update(input);

      expect(mockUpdate).toHaveBeenCalledWith({ salary: 5500 });
      expect(result.salary).toBe(5500);
    });
  });

  describe('delete', () => {
    it('should delete personnel when no timesheets exist', async () => {
      mockLimit.mockResolvedValue({ data: [], error: null }); // no timesheets
      mockEq.mockResolvedValue({ error: null }); // delete success

      await PersonnelService.delete(1, 1);

      expect(mockFrom).toHaveBeenCalledWith('personnel_timesheet');
      expect(mockFrom).toHaveBeenCalledWith('personnel');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should throw AppError when personnel has timesheets', async () => {
      mockLimit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      await expect(PersonnelService.delete(1, 1)).rejects.toThrow(AppError);
      await expect(PersonnelService.delete(1, 1)).rejects.toThrow(
        /mesai kayıtları var/
      );
    });
  });

  describe('getTimesheet', () => {
    it('should fetch timesheet for personnel', async () => {
      const mockTimesheet = [
        {
          id: 1,
          personnel_id: 1,
          date: '2024-01-15',
          hours_worked: 8,
          project_id: 1,
        },
        {
          id: 2,
          personnel_id: 1,
          date: '2024-01-16',
          hours_worked: 8,
          project_id: 1,
        },
      ];

      mockOrder.mockResolvedValue({ data: mockTimesheet, error: null });

      const result = await PersonnelService.getTimesheet(
        1,
        1,
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockFrom).toHaveBeenCalledWith('personnel_timesheet');
      expect(mockGte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('date', '2024-01-31');
      expect(result).toHaveLength(2);
    });
  });

  describe('addTimesheetEntry', () => {
    it('should add a timesheet entry', async () => {
      const entry = {
        date: '2024-01-15',
        hours_worked: 8,
        overtime_hours: 2,
      };

      const createdEntry = {
        id: 1,
        personnel_id: 1,
        project_id: 1,
        ...entry,
      };

      mockSingle.mockResolvedValue({ data: createdEntry, error: null });

      const result = await PersonnelService.addTimesheetEntry(1, 1, entry);

      expect(mockFrom).toHaveBeenCalledWith('personnel_timesheet');
      expect(result.id).toBe(1);
    });
  });

  describe('deactivate', () => {
    it('should deactivate personnel', async () => {
      mockEq.mockResolvedValue({ error: null });

      await PersonnelService.deactivate(1, 1);

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    });
  });

  describe('activate', () => {
    it('should activate personnel', async () => {
      mockEq.mockResolvedValue({ error: null });

      await PersonnelService.activate(1, 1);

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: true });
    });
  });

  describe('getActiveCount', () => {
    it('should return count of active personnel', async () => {
      const mockPersonnel = [
        { id: 1, name: 'John', is_active: true },
        { id: 2, name: 'Jane', is_active: true },
      ];

      mockOrder.mockResolvedValue({ data: mockPersonnel, error: null });

      const result = await PersonnelService.getActiveCount(1);

      expect(result).toBe(2);
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });
  });
});
