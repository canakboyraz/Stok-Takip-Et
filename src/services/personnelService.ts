/**
 * Personnel Service
 *
 * Handles all personnel-related API calls
 */

import { supabase } from '../lib/supabase';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface Personnel {
  id: number;
  name: string;
  position: string;
  salary: number;
  hire_date: string;
  email?: string;
  phone?: string;
  project_id: number;
  created_at?: string;
  is_active?: boolean;
}

export interface PersonnelFilters {
  projectId: number;
  position?: string;
  isActive?: boolean;
}

export interface PersonnelCreateInput {
  name: string;
  position: string;
  salary: number;
  hire_date: string;
  email?: string;
  phone?: string;
  project_id: number;
  is_active?: boolean;
}

export interface PersonnelUpdateInput extends Partial<PersonnelCreateInput> {
  id: number;
}

export interface Timesheet {
  id: number;
  personnel_id: number;
  date: string;
  hours_worked: number;
  overtime_hours?: number;
  notes?: string;
  project_id: number;
}

export interface TimesheetEntry {
  date: string;
  hours_worked: number;
  overtime_hours?: number;
  notes?: string;
}

/**
 * Personnel Service Class
 */
export class PersonnelService {
  /**
   * Get all personnel with filters
   */
  static async getAll(filters: PersonnelFilters): Promise<Personnel[]> {
    try {
      logger.log('PersonnelService.getAll:', filters);

      let query = supabase
        .from('personnel')
        .select('*')
        .eq('project_id', filters.projectId);

      if (filters.position) {
        query = query.eq('position', filters.position);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        logger.error('PersonnelService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Personel listesi yüklenirken hata oluştu'
        );
      }

      logger.log(`PersonnelService.getAll: Fetched ${data.length} personnel`);
      return data;
    } catch (error) {
      logger.error('PersonnelService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single personnel by ID
   */
  static async getById(id: number, projectId: number): Promise<Personnel | null> {
    try {
      logger.log('PersonnelService.getById:', { id, projectId });

      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('PersonnelService.getById error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Personel yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('PersonnelService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new personnel
   */
  static async create(input: PersonnelCreateInput): Promise<Personnel> {
    try {
      logger.log('PersonnelService.create:', input);

      const { data, error } = await supabase
        .from('personnel')
        .insert([input])
        .select()
        .single();

      if (error) {
        logger.error('PersonnelService.create error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Personel eklenirken hata oluştu'
        );
      }

      logger.log('PersonnelService.create: Created personnel:', data.id);
      return data;
    } catch (error) {
      logger.error('PersonnelService.create exception:', error);
      throw error;
    }
  }

  /**
   * Update existing personnel
   */
  static async update(input: PersonnelUpdateInput): Promise<Personnel> {
    try {
      logger.log('PersonnelService.update:', input);

      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('personnel')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('PersonnelService.update error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Personel güncellenirken hata oluştu'
        );
      }

      logger.log('PersonnelService.update: Updated personnel:', data.id);
      return data;
    } catch (error) {
      logger.error('PersonnelService.update exception:', error);
      throw error;
    }
  }

  /**
   * Delete personnel
   */
  static async delete(id: number, projectId: number): Promise<void> {
    try {
      logger.log('PersonnelService.delete:', { id, projectId });

      // Check if personnel has timesheet entries
      const { data: timesheets, error: checkError } = await supabase
        .from('personnel_timesheet')
        .select('id')
        .eq('personnel_id', id)
        .limit(1);

      if (checkError) {
        logger.error('PersonnelService.delete check error:', checkError);
        throw new AppError(
          checkError.message,
          checkError.code || 'TIMESHEET_CHECK_ERROR',
          ErrorSeverity.ERROR,
          'Personel kontrol edilirken hata oluştu'
        );
      }

      if (timesheets && timesheets.length > 0) {
        throw new AppError(
          'Personnel has timesheet entries',
          'PERSONNEL_HAS_TIMESHEETS',
          ErrorSeverity.WARNING,
          'Bu personele ait mesai kayıtları var. Önce kayıtları silin veya personeli pasif yapın.'
        );
      }

      const { error } = await supabase
        .from('personnel')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        logger.error('PersonnelService.delete error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Personel silinirken hata oluştu'
        );
      }

      logger.log('PersonnelService.delete: Deleted personnel:', id);
    } catch (error) {
      logger.error('PersonnelService.delete exception:', error);
      throw error;
    }
  }

  /**
   * Get timesheet for personnel within date range
   */
  static async getTimesheet(
    personnelId: number,
    projectId: number,
    startDate: string,
    endDate: string
  ): Promise<Timesheet[]> {
    try {
      logger.log('PersonnelService.getTimesheet:', {
        personnelId,
        projectId,
        startDate,
        endDate,
      });

      const { data, error } = await supabase
        .from('personnel_timesheet')
        .select('*')
        .eq('personnel_id', personnelId)
        .eq('project_id', projectId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        logger.error('PersonnelService.getTimesheet error:', error);
        throw new AppError(
          error.message,
          error.code || 'TIMESHEET_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Mesai kayıtları yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('PersonnelService.getTimesheet exception:', error);
      throw error;
    }
  }

  /**
   * Add timesheet entry
   */
  static async addTimesheetEntry(
    personnelId: number,
    projectId: number,
    entry: TimesheetEntry
  ): Promise<Timesheet> {
    try {
      logger.log('PersonnelService.addTimesheetEntry:', {
        personnelId,
        projectId,
        entry,
      });

      const timesheetData = {
        personnel_id: personnelId,
        project_id: projectId,
        ...entry,
      };

      const { data, error } = await supabase
        .from('personnel_timesheet')
        .insert([timesheetData])
        .select()
        .single();

      if (error) {
        logger.error('PersonnelService.addTimesheetEntry error:', error);
        throw new AppError(
          error.message,
          error.code || 'TIMESHEET_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Mesai kaydı eklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('PersonnelService.addTimesheetEntry exception:', error);
      throw error;
    }
  }

  /**
   * Deactivate personnel (soft delete)
   */
  static async deactivate(id: number, projectId: number): Promise<void> {
    try {
      logger.log('PersonnelService.deactivate:', { id, projectId });

      const { error } = await supabase
        .from('personnel')
        .update({ is_active: false })
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        logger.error('PersonnelService.deactivate error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_DEACTIVATE_ERROR',
          ErrorSeverity.ERROR,
          'Personel pasif yapılırken hata oluştu'
        );
      }

      logger.log('PersonnelService.deactivate: Deactivated personnel:', id);
    } catch (error) {
      logger.error('PersonnelService.deactivate exception:', error);
      throw error;
    }
  }

  /**
   * Activate personnel
   */
  static async activate(id: number, projectId: number): Promise<void> {
    try {
      logger.log('PersonnelService.activate:', { id, projectId });

      const { error } = await supabase
        .from('personnel')
        .update({ is_active: true })
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        logger.error('PersonnelService.activate error:', error);
        throw new AppError(
          error.message,
          error.code || 'PERSONNEL_ACTIVATE_ERROR',
          ErrorSeverity.ERROR,
          'Personel aktif yapılırken hata oluştu'
        );
      }

      logger.log('PersonnelService.activate: Activated personnel:', id);
    } catch (error) {
      logger.error('PersonnelService.activate exception:', error);
      throw error;
    }
  }

  /**
   * Get active personnel count
   */
  static async getActiveCount(projectId: number): Promise<number> {
    try {
      const personnel = await this.getAll({
        projectId,
        isActive: true,
      });
      return personnel.length;
    } catch (error) {
      logger.error('PersonnelService.getActiveCount exception:', error);
      throw error;
    }
  }
}

export default PersonnelService;
