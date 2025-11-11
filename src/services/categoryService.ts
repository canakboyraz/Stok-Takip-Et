/**
 * Category Service
 *
 * Handles all category-related API calls
 */

import { supabase } from '../lib/supabase';
import { Category } from '../types/database';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface CategoryCreateInput {
  name: string;
  project_id: number;
}

export interface CategoryUpdateInput {
  id: number;
  name: string;
}

/**
 * Category Service Class
 */
export class CategoryService {
  /**
   * Get all categories for a project
   */
  static async getAll(projectId: number): Promise<Category[]> {
    try {
      logger.log('CategoryService.getAll:', projectId);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) {
        logger.error('CategoryService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'CATEGORY_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Kategoriler yüklenirken hata oluştu'
        );
      }

      logger.log(`CategoryService.getAll: Fetched ${data.length} categories`);
      return data;
    } catch (error) {
      logger.error('CategoryService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single category by ID
   */
  static async getById(id: number, projectId: number): Promise<Category | null> {
    try {
      logger.log('CategoryService.getById:', { id, projectId });

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('CategoryService.getById error:', error);
        throw new AppError(
          error.message,
          error.code || 'CATEGORY_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Kategori yüklenirken hata oluştu'
        );
      }

      return data;
    } catch (error) {
      logger.error('CategoryService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  static async create(input: CategoryCreateInput): Promise<Category> {
    try {
      logger.log('CategoryService.create:', input);

      const { data, error } = await supabase
        .from('categories')
        .insert([input])
        .select()
        .single();

      if (error) {
        logger.error('CategoryService.create error:', error);
        throw new AppError(
          error.message,
          error.code || 'CATEGORY_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Kategori eklenirken hata oluştu'
        );
      }

      logger.log('CategoryService.create: Created category:', data.id);
      return data;
    } catch (error) {
      logger.error('CategoryService.create exception:', error);
      throw error;
    }
  }

  /**
   * Update existing category
   */
  static async update(input: CategoryUpdateInput): Promise<Category> {
    try {
      logger.log('CategoryService.update:', input);

      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('CategoryService.update error:', error);
        throw new AppError(
          error.message,
          error.code || 'CATEGORY_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Kategori güncellenirken hata oluştu'
        );
      }

      logger.log('CategoryService.update: Updated category:', data.id);
      return data;
    } catch (error) {
      logger.error('CategoryService.update exception:', error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  static async delete(id: number, projectId: number): Promise<void> {
    try {
      logger.log('CategoryService.delete:', { id, projectId });

      // Check if category has products
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .eq('project_id', projectId)
        .limit(1);

      if (checkError) {
        logger.error('CategoryService.delete check error:', checkError);
        throw new AppError(
          checkError.message,
          checkError.code || 'CATEGORY_CHECK_ERROR',
          ErrorSeverity.ERROR,
          'Kategori kontrol edilirken hata oluştu'
        );
      }

      if (products && products.length > 0) {
        throw new AppError(
          'Category has products',
          'CATEGORY_HAS_PRODUCTS',
          ErrorSeverity.WARNING,
          'Bu kategoriye ait ürünler var. Önce ürünleri silin veya başka kategoriye taşıyın.'
        );
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        logger.error('CategoryService.delete error:', error);
        throw new AppError(
          error.message,
          error.code || 'CATEGORY_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Kategori silinirken hata oluştu'
        );
      }

      logger.log('CategoryService.delete: Deleted category:', id);
    } catch (error) {
      logger.error('CategoryService.delete exception:', error);
      throw error;
    }
  }

  /**
   * Check if category name exists
   */
  static async nameExists(
    name: string,
    projectId: number,
    excludeId?: number
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('categories')
        .select('id')
        .eq('name', name)
        .eq('project_id', projectId);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('CategoryService.nameExists error:', error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      logger.error('CategoryService.nameExists exception:', error);
      return false;
    }
  }

  /**
   * Get category with product count
   */
  static async getWithProductCount(projectId: number): Promise<Array<Category & { product_count: number }>> {
    try {
      logger.log('CategoryService.getWithProductCount:', projectId);

      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products:products(count)
        `)
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) {
        logger.error('CategoryService.getWithProductCount error:', error);
        throw new AppError(
          error.message,
          error.code || 'CATEGORY_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Kategoriler yüklenirken hata oluştu'
        );
      }

      const categories = data.map((category: any) => ({
        ...category,
        product_count: category.products[0]?.count || 0,
      }));

      logger.log(`CategoryService.getWithProductCount: Fetched ${categories.length} categories`);
      return categories;
    } catch (error) {
      logger.error('CategoryService.getWithProductCount exception:', error);
      throw error;
    }
  }
}

export default CategoryService;
