/**
 * Product Service
 *
 * Handles all product-related API calls
 * Centralizes Supabase queries for products
 */

import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface ProductFilters {
  projectId: number;
  categoryId?: number;
  searchTerm?: string;
  minStock?: number;
  showZeroStock?: boolean;
}

export interface ProductCreateInput {
  name: string;
  code?: string;
  category_id: number;
  price: number;
  unit_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  brand?: string;
  expiry_date?: string;
  reception_date?: string;
  project_id: number;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: number;
}

/**
 * Product Service Class
 */
export class ProductService {
  /**
   * Get all products with filters
   */
  static async getAll(filters: ProductFilters): Promise<Product[]> {
    try {
      logger.log('ProductService.getAll:', filters);

      let query = supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('project_id', filters.projectId);

      // Apply category filter
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Apply search filter
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,code.ilike.%${filters.searchTerm}%`);
      }

      // Apply stock filter
      if (!filters.showZeroStock) {
        query = query.gt('stock_quantity', 0);
      }

      if (filters.minStock !== undefined) {
        query = query.gte('stock_quantity', filters.minStock);
      }

      // Order by name
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('ProductService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Ürünler yüklenirken hata oluştu'
        );
      }

      // Map category name
      const products = data.map((product: any) => ({
        ...product,
        category_name: product.categories?.name || 'Kategorisiz',
      }));

      logger.log(`ProductService.getAll: Fetched ${products.length} products`);
      return products;
    } catch (error) {
      logger.error('ProductService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID
   */
  static async getById(id: number, projectId: number): Promise<Product | null> {
    try {
      logger.log('ProductService.getById:', { id, projectId });

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('ProductService.getById error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Ürün yüklenirken hata oluştu'
        );
      }

      const product = {
        ...data,
        category_name: data.categories?.name || 'Kategorisiz',
      };

      return product;
    } catch (error) {
      logger.error('ProductService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new product
   */
  static async create(input: ProductCreateInput): Promise<Product> {
    try {
      logger.log('ProductService.create:', input);

      const { data, error } = await supabase
        .from('products')
        .insert([input])
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .single();

      if (error) {
        logger.error('ProductService.create error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Ürün eklenirken hata oluştu'
        );
      }

      const product = {
        ...data,
        category_name: data.categories?.name || 'Kategorisiz',
      };

      logger.log('ProductService.create: Created product:', product.id);
      return product;
    } catch (error) {
      logger.error('ProductService.create exception:', error);
      throw error;
    }
  }

  /**
   * Update existing product
   */
  static async update(input: ProductUpdateInput): Promise<Product> {
    try {
      logger.log('ProductService.update:', input);

      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .single();

      if (error) {
        logger.error('ProductService.update error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Ürün güncellenirken hata oluştu'
        );
      }

      const product = {
        ...data,
        category_name: data.categories?.name || 'Kategorisiz',
      };

      logger.log('ProductService.update: Updated product:', product.id);
      return product;
    } catch (error) {
      logger.error('ProductService.update exception:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  static async delete(id: number, projectId: number): Promise<void> {
    try {
      logger.log('ProductService.delete:', { id, projectId });

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        logger.error('ProductService.delete error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Ürün silinirken hata oluştu'
        );
      }

      logger.log('ProductService.delete: Deleted product:', id);
    } catch (error) {
      logger.error('ProductService.delete exception:', error);
      throw error;
    }
  }

  /**
   * Update product stock quantity
   */
  static async updateStock(
    id: number,
    projectId: number,
    newQuantity: number
  ): Promise<Product> {
    try {
      logger.log('ProductService.updateStock:', { id, projectId, newQuantity });

      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', id)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) {
        logger.error('ProductService.updateStock error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_STOCK_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Stok güncellenirken hata oluştu'
        );
      }

      logger.log('ProductService.updateStock: Updated stock for product:', id);
      return data;
    } catch (error) {
      logger.error('ProductService.updateStock exception:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStock(projectId: number): Promise<Product[]> {
    try {
      logger.log('ProductService.getLowStock:', projectId);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .filter('stock_quantity', 'lte', 'min_stock_level')
        .order('stock_quantity', { ascending: true });

      if (error) {
        logger.error('ProductService.getLowStock error:', error);
        throw new AppError(
          error.message,
          error.code || 'PRODUCT_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Düşük stoklu ürünler yüklenirken hata oluştu'
        );
      }

      const products = data.map((product: any) => ({
        ...product,
        category_name: product.categories?.name || 'Kategorisiz',
      }));

      logger.log(`ProductService.getLowStock: Found ${products.length} low stock products`);
      return products;
    } catch (error) {
      logger.error('ProductService.getLowStock exception:', error);
      throw error;
    }
  }

  /**
   * Check if product code exists
   */
  static async codeExists(code: string, projectId: number, excludeId?: number): Promise<boolean> {
    try {
      let query = supabase
        .from('products')
        .select('id')
        .eq('code', code)
        .eq('project_id', projectId);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('ProductService.codeExists error:', error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      logger.error('ProductService.codeExists exception:', error);
      return false;
    }
  }
}

export default ProductService;
