/**
 * Expense Service
 *
 * Handles all expense-related API calls
 */

import { supabase } from '../lib/supabase';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description?: string;
  date: string;
  project_id: number;
  created_at?: string;
  user_id?: string;
}

export interface ExpenseFilters {
  projectId: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseCreateInput {
  amount: number;
  category: string;
  description?: string;
  date: string;
  project_id: number;
  user_id?: string;
}

export interface ExpenseUpdateInput extends Partial<ExpenseCreateInput> {
  id: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

/**
 * Expense Service Class
 */
export class ExpenseService {
  /**
   * Get all expenses with filters
   */
  static async getAll(filters: ExpenseFilters): Promise<Expense[]> {
    try {
      logger.log('ExpenseService.getAll:', filters);

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('project_id', filters.projectId);

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        logger.error('ExpenseService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Giderler yüklenirken hata oluştu'
        );
      }

      logger.log(`ExpenseService.getAll: Fetched ${data.length} expenses`);
      return data;
    } catch (error) {
      logger.error('ExpenseService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single expense by ID
   */
  static async getById(id: number, projectId: number): Promise<Expense | null> {
    try {
      logger.log('ExpenseService.getById:', { id, projectId });

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('ExpenseService.getById error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Gider yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('ExpenseService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new expense
   */
  static async create(input: ExpenseCreateInput): Promise<Expense> {
    try {
      logger.log('ExpenseService.create:', input);

      const { data, error } = await supabase
        .from('expenses')
        .insert([input])
        .select()
        .single();

      if (error) {
        logger.error('ExpenseService.create error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Gider eklenirken hata oluştu'
        );
      }

      logger.log('ExpenseService.create: Created expense:', data.id);
      return data;
    } catch (error) {
      logger.error('ExpenseService.create exception:', error);
      throw error;
    }
  }

  /**
   * Update existing expense
   */
  static async update(input: ExpenseUpdateInput): Promise<Expense> {
    try {
      logger.log('ExpenseService.update:', input);

      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('ExpenseService.update error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Gider güncellenirken hata oluştu'
        );
      }

      logger.log('ExpenseService.update: Updated expense:', data.id);
      return data;
    } catch (error) {
      logger.error('ExpenseService.update exception:', error);
      throw error;
    }
  }

  /**
   * Delete expense
   */
  static async delete(id: number, projectId: number): Promise<void> {
    try {
      logger.log('ExpenseService.delete:', { id, projectId });

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        logger.error('ExpenseService.delete error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Gider silinirken hata oluştu'
        );
      }

      logger.log('ExpenseService.delete: Deleted expense:', id);
    } catch (error) {
      logger.error('ExpenseService.delete exception:', error);
      throw error;
    }
  }

  /**
   * Get expenses by date range
   */
  static async getByDateRange(
    projectId: number,
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    try {
      logger.log('ExpenseService.getByDateRange:', {
        projectId,
        startDate,
        endDate,
      });

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        logger.error('ExpenseService.getByDateRange error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Tarih aralığındaki giderler yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('ExpenseService.getByDateRange exception:', error);
      throw error;
    }
  }

  /**
   * Get total expenses by category
   */
  static async getTotalByCategory(projectId: number): Promise<CategoryTotal[]> {
    try {
      logger.log('ExpenseService.getTotalByCategory:', projectId);

      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('project_id', projectId);

      if (error) {
        logger.error('ExpenseService.getTotalByCategory error:', error);
        throw new AppError(
          error.message,
          error.code || 'EXPENSE_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Kategori bazlı giderler yüklenirken hata oluştu'
        );
      }

      // Aggregate by category
      const categoryMap = new Map<string, { total: number; count: number }>();

      data.forEach((expense) => {
        const category = expense.category || 'Diğer';
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category)!;
          existing.total += expense.amount;
          existing.count += 1;
        } else {
          categoryMap.set(category, { total: expense.amount, count: 1 });
        }
      });

      const result: CategoryTotal[] = Array.from(categoryMap.entries()).map(
        ([category, { total, count }]) => ({
          category,
          total,
          count,
        })
      );

      return result.sort((a, b) => b.total - a.total);
    } catch (error) {
      logger.error('ExpenseService.getTotalByCategory exception:', error);
      throw error;
    }
  }

  /**
   * Get total expenses for a date range
   */
  static async getTotalForDateRange(
    projectId: number,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const expenses = await this.getByDateRange(projectId, startDate, endDate);
      return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    } catch (error) {
      logger.error('ExpenseService.getTotalForDateRange exception:', error);
      throw error;
    }
  }
}

export default ExpenseService;
