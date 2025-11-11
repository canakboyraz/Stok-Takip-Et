/**
 * Stock Movement Service
 *
 * Handles all stock movement-related API calls
 */

import { supabase } from '../lib/supabase';
import { StockMovement } from '../types/database';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface StockMovementFilters {
  projectId: number;
  productId?: number;
  type?: 'in' | 'out';
  startDate?: string;
  endDate?: string;
  isBulk?: boolean;
  bulkId?: string;
}

export interface StockMovementCreateInput {
  product_id: number;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  notes?: string;
  user_id: string;
  project_id: number;
  is_bulk?: boolean;
  bulk_id?: string;
}

export interface BulkMovement {
  id: number;
  date: string;
  notes?: string;
  type: 'in' | 'out';
  user_id: string;
  project_id: number;
  can_be_reversed?: boolean;
  operation_type?: string;
}

/**
 * Stock Movement Service Class
 */
export class StockMovementService {
  /**
   * Get all stock movements with filters
   */
  static async getAll(filters: StockMovementFilters): Promise<StockMovement[]> {
    try {
      logger.log('StockMovementService.getAll:', filters);

      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            id,
            name,
            unit,
            price,
            stock_quantity
          )
        `)
        .eq('project_id', filters.projectId);

      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      if (filters.isBulk !== undefined) {
        query = query.eq('is_bulk', filters.isBulk);
      }

      if (filters.bulkId) {
        query = query.eq('bulk_id', filters.bulkId);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        logger.error('StockMovementService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'STOCK_MOVEMENT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Stok hareketleri yüklenirken hata oluştu'
        );
      }

      logger.log(`StockMovementService.getAll: Fetched ${data.length} movements`);
      return data;
    } catch (error) {
      logger.error('StockMovementService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single stock movement by ID
   */
  static async getById(id: number): Promise<StockMovement | null> {
    try {
      logger.log('StockMovementService.getById:', id);

      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            id,
            name,
            unit,
            price
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('StockMovementService.getById error:', error);
        throw new AppError(
          error.message,
          error.code || 'STOCK_MOVEMENT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Stok hareketi yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('StockMovementService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new stock movement
   */
  static async create(input: StockMovementCreateInput): Promise<StockMovement> {
    try {
      logger.log('StockMovementService.create:', input);

      const { data, error } = await supabase
        .from('stock_movements')
        .insert([input])
        .select()
        .single();

      if (error) {
        logger.error('StockMovementService.create error:', error);
        throw new AppError(
          error.message,
          error.code || 'STOCK_MOVEMENT_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Stok hareketi eklenirken hata oluştu'
        );
      }

      logger.log('StockMovementService.create: Created movement:', data.id);
      return data;
    } catch (error) {
      logger.error('StockMovementService.create exception:', error);
      throw error;
    }
  }

  /**
   * Get bulk movements
   */
  static async getBulkMovements(projectId: number): Promise<BulkMovement[]> {
    try {
      logger.log('StockMovementService.getBulkMovements:', projectId);

      const { data, error } = await supabase
        .from('bulk_movements')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) {
        logger.error('StockMovementService.getBulkMovements error:', error);
        throw new AppError(
          error.message,
          error.code || 'BULK_MOVEMENT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Toplu hareketler yüklenirken hata oluştu'
        );
      }

      logger.log(`StockMovementService.getBulkMovements: Fetched ${data.length} bulk movements`);
      return data;
    } catch (error) {
      logger.error('StockMovementService.getBulkMovements exception:', error);
      throw error;
    }
  }

  /**
   * Reverse a bulk movement
   */
  static async reverseBulkMovement(bulkId: number, projectId: number): Promise<void> {
    try {
      logger.log('StockMovementService.reverseBulkMovement:', { bulkId, projectId });

      // Check if bulk movement can be reversed
      const { data: bulkMovement, error: bulkError } = await supabase
        .from('bulk_movements')
        .select('*')
        .eq('id', bulkId)
        .eq('project_id', projectId)
        .single();

      if (bulkError) {
        logger.error('StockMovementService.reverseBulkMovement bulk check error:', bulkError);
        throw new AppError(
          bulkError.message,
          bulkError.code || 'BULK_MOVEMENT_CHECK_ERROR',
          ErrorSeverity.ERROR,
          'Toplu hareket kontrol edilirken hata oluştu'
        );
      }

      if (!bulkMovement.can_be_reversed) {
        throw new AppError(
          'Bulk movement cannot be reversed',
          'BULK_MOVEMENT_NOT_REVERSIBLE',
          ErrorSeverity.WARNING,
          'Bu toplu hareket geri alınamaz'
        );
      }

      // Get all movements in this bulk
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('bulk_id', bulkId.toString())
        .eq('project_id', projectId);

      if (movementsError) {
        logger.error('StockMovementService.reverseBulkMovement movements error:', movementsError);
        throw new AppError(
          movementsError.message,
          movementsError.code || 'MOVEMENTS_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Hareketler yüklenirken hata oluştu'
        );
      }

      // Reverse each movement
      for (const movement of movements) {
        const reverseType = movement.type === 'in' ? 'out' : 'in';
        const stockChange = movement.type === 'in' ? -movement.quantity : movement.quantity;

        // Update product stock
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: supabase.raw(`stock_quantity + ${stockChange}`),
          })
          .eq('id', movement.product_id)
          .eq('project_id', projectId);

        if (updateError) {
          logger.error('StockMovementService.reverseBulkMovement update error:', updateError);
          throw new AppError(
            updateError.message,
            updateError.code || 'STOCK_UPDATE_ERROR',
            ErrorSeverity.ERROR,
            'Stok güncellenirken hata oluştu'
          );
        }

        // Create reverse movement
        const { error: reverseError } = await supabase
          .from('stock_movements')
          .insert([
            {
              product_id: movement.product_id,
              type: reverseType,
              quantity: movement.quantity,
              date: new Date().toISOString(),
              notes: `Geri alma: ${movement.notes || ''}`,
              user_id: movement.user_id,
              project_id: projectId,
              is_bulk: true,
              bulk_id: `reverse_${bulkId}`,
            },
          ]);

        if (reverseError) {
          logger.error('StockMovementService.reverseBulkMovement reverse error:', reverseError);
          throw new AppError(
            reverseError.message,
            reverseError.code || 'REVERSE_MOVEMENT_ERROR',
            ErrorSeverity.ERROR,
            'Geri alma hareketi oluşturulurken hata oluştu'
          );
        }
      }

      // Mark bulk movement as reversed
      const { error: markError } = await supabase
        .from('bulk_movements')
        .update({ can_be_reversed: false })
        .eq('id', bulkId);

      if (markError) {
        logger.error('StockMovementService.reverseBulkMovement mark error:', markError);
      }

      logger.log('StockMovementService.reverseBulkMovement: Successfully reversed bulk movement');
    } catch (error) {
      logger.error('StockMovementService.reverseBulkMovement exception:', error);
      throw error;
    }
  }

  /**
   * Get movements by bulk ID
   */
  static async getByBulkId(bulkId: string, projectId: number): Promise<StockMovement[]> {
    try {
      logger.log('StockMovementService.getByBulkId:', { bulkId, projectId });

      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (
            id,
            name,
            unit,
            price
          )
        `)
        .eq('bulk_id', bulkId)
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) {
        logger.error('StockMovementService.getByBulkId error:', error);
        throw new AppError(
          error.message,
          error.code || 'STOCK_MOVEMENT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Toplu hareket detayları yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('StockMovementService.getByBulkId exception:', error);
      throw error;
    }
  }
}

export default StockMovementService;
