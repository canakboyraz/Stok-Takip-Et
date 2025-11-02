/**
 * Recipe Service
 *
 * Handles all recipe-related API calls
 */

import { supabase } from '../lib/supabase';
import { Recipe } from '../types/database';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface RecipeFilters {
  projectId: number;
  category?: string;
  searchQuery?: string;
}

export interface RecipeIngredient {
  product_id: number;
  quantity: number;
  unit: string;
}

export interface RecipeCreateInput {
  name: string;
  description?: string;
  category: string;
  serving_size: number;
  preparation_time?: number;
  cooking_time?: number;
  instructions?: string;
  project_id: number;
}

export interface RecipeUpdateInput extends Partial<RecipeCreateInput> {
  id: number;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit: string;
    product_name: string;
    product_price: number;
  }>;
}

/**
 * Recipe Service Class
 */
export class RecipeService {
  /**
   * Get all recipes with filters
   */
  static async getAll(filters: RecipeFilters): Promise<Recipe[]> {
    try {
      logger.log('RecipeService.getAll:', filters);

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('project_id', filters.projectId);

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.searchQuery) {
        query = query.ilike('name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        logger.error('RecipeService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'RECIPE_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Tarifler yüklenirken hata oluştu'
        );
      }

      logger.log(`RecipeService.getAll: Fetched ${data.length} recipes`);
      return data;
    } catch (error) {
      logger.error('RecipeService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single recipe by ID with ingredients
   */
  static async getById(id: number, projectId: number): Promise<RecipeWithIngredients | null> {
    try {
      logger.log('RecipeService.getById:', { id, projectId });

      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (recipeError) {
        if (recipeError.code === 'PGRST116') {
          return null;
        }
        logger.error('RecipeService.getById error:', recipeError);
        throw new AppError(
          recipeError.message,
          recipeError.code || 'RECIPE_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Tarif yüklenirken hata oluştu'
        );
      }

      // Get ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          id,
          product_id,
          quantity,
          unit,
          products (
            name,
            price
          )
        `)
        .eq('recipe_id', id);

      if (ingredientsError) {
        logger.error('RecipeService.getById ingredients error:', ingredientsError);
        throw new AppError(
          ingredientsError.message,
          ingredientsError.code || 'INGREDIENTS_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Tarif malzemeleri yüklenirken hata oluştu'
        );
      }

      const mappedIngredients = ingredients.map((ing: any) => ({
        id: ing.id,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit: ing.unit,
        product_name: ing.products?.name || 'Unknown',
        product_price: ing.products?.price || 0,
      }));

      return {
        ...recipe,
        ingredients: mappedIngredients,
      };
    } catch (error) {
      logger.error('RecipeService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new recipe with ingredients
   */
  static async create(
    recipe: RecipeCreateInput,
    ingredients: RecipeIngredient[]
  ): Promise<Recipe> {
    try {
      logger.log('RecipeService.create:', { recipe, ingredientsCount: ingredients.length });

      // Create recipe
      const { data: createdRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert([recipe])
        .select()
        .single();

      if (recipeError) {
        logger.error('RecipeService.create recipe error:', recipeError);
        throw new AppError(
          recipeError.message,
          recipeError.code || 'RECIPE_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Tarif eklenirken hata oluştu'
        );
      }

      // Create ingredients
      if (ingredients.length > 0) {
        const ingredientsData = ingredients.map((ing) => ({
          recipe_id: createdRecipe.id,
          product_id: ing.product_id,
          quantity: ing.quantity,
          unit: ing.unit,
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) {
          // Rollback: delete the recipe
          await supabase.from('recipes').delete().eq('id', createdRecipe.id);

          logger.error('RecipeService.create ingredients error:', ingredientsError);
          throw new AppError(
            ingredientsError.message,
            ingredientsError.code || 'INGREDIENTS_CREATE_ERROR',
            ErrorSeverity.ERROR,
            'Tarif malzemeleri eklenirken hata oluştu'
          );
        }
      }

      logger.log('RecipeService.create: Created recipe:', createdRecipe.id);
      return createdRecipe;
    } catch (error) {
      logger.error('RecipeService.create exception:', error);
      throw error;
    }
  }

  /**
   * Update existing recipe and ingredients
   */
  static async update(
    recipeData: RecipeUpdateInput,
    ingredients?: RecipeIngredient[]
  ): Promise<Recipe> {
    try {
      logger.log('RecipeService.update:', { recipeData, ingredientsCount: ingredients?.length });

      const { id, ...updateData } = recipeData;

      // Update recipe
      const { data: updatedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (recipeError) {
        logger.error('RecipeService.update recipe error:', recipeError);
        throw new AppError(
          recipeError.message,
          recipeError.code || 'RECIPE_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Tarif güncellenirken hata oluştu'
        );
      }

      // Update ingredients if provided
      if (ingredients !== undefined) {
        // Delete existing ingredients
        const { error: deleteError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', id);

        if (deleteError) {
          logger.error('RecipeService.update delete ingredients error:', deleteError);
          throw new AppError(
            deleteError.message,
            deleteError.code || 'INGREDIENTS_DELETE_ERROR',
            ErrorSeverity.ERROR,
            'Eski malzemeler silinirken hata oluştu'
          );
        }

        // Insert new ingredients
        if (ingredients.length > 0) {
          const ingredientsData = ingredients.map((ing) => ({
            recipe_id: id,
            product_id: ing.product_id,
            quantity: ing.quantity,
            unit: ing.unit,
          }));

          const { error: insertError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsData);

          if (insertError) {
            logger.error('RecipeService.update insert ingredients error:', insertError);
            throw new AppError(
              insertError.message,
              insertError.code || 'INGREDIENTS_INSERT_ERROR',
              ErrorSeverity.ERROR,
              'Yeni malzemeler eklenirken hata oluştu'
            );
          }
        }
      }

      logger.log('RecipeService.update: Updated recipe:', updatedRecipe.id);
      return updatedRecipe;
    } catch (error) {
      logger.error('RecipeService.update exception:', error);
      throw error;
    }
  }

  /**
   * Delete recipe and its ingredients
   */
  static async delete(id: number, projectId: number): Promise<void> {
    try {
      logger.log('RecipeService.delete:', { id, projectId });

      // Check if recipe is used in any menus
      const { data: menuItems, error: checkError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('recipe_id', id)
        .limit(1);

      if (checkError) {
        logger.error('RecipeService.delete check error:', checkError);
        throw new AppError(
          checkError.message,
          checkError.code || 'RECIPE_CHECK_ERROR',
          ErrorSeverity.ERROR,
          'Tarif kontrol edilirken hata oluştu'
        );
      }

      if (menuItems && menuItems.length > 0) {
        throw new AppError(
          'Recipe is used in menus',
          'RECIPE_IN_USE',
          ErrorSeverity.WARNING,
          'Bu tarif menülerde kullanılıyor. Önce menülerden kaldırın.'
        );
      }

      // Delete ingredients first (foreign key constraint)
      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (ingredientsError) {
        logger.error('RecipeService.delete ingredients error:', ingredientsError);
        throw new AppError(
          ingredientsError.message,
          ingredientsError.code || 'INGREDIENTS_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Tarif malzemeleri silinirken hata oluştu'
        );
      }

      // Delete recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (recipeError) {
        logger.error('RecipeService.delete recipe error:', recipeError);
        throw new AppError(
          recipeError.message,
          recipeError.code || 'RECIPE_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Tarif silinirken hata oluştu'
        );
      }

      logger.log('RecipeService.delete: Deleted recipe:', id);
    } catch (error) {
      logger.error('RecipeService.delete exception:', error);
      throw error;
    }
  }

  /**
   * Get recipe ingredients
   */
  static async getIngredients(recipeId: number): Promise<Array<{
    id: number;
    product_id: number;
    quantity: number;
    unit: string;
    product_name: string;
    product_price: number;
  }>> {
    try {
      logger.log('RecipeService.getIngredients:', recipeId);

      const { data, error } = await supabase
        .from('recipe_ingredients')
        .select(`
          id,
          product_id,
          quantity,
          unit,
          products (
            name,
            price
          )
        `)
        .eq('recipe_id', recipeId);

      if (error) {
        logger.error('RecipeService.getIngredients error:', error);
        throw new AppError(
          error.message,
          error.code || 'INGREDIENTS_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Tarif malzemeleri yüklenirken hata oluştu'
        );
      }

      const ingredients = data.map((ing: any) => ({
        id: ing.id,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit: ing.unit,
        product_name: ing.products?.name || 'Unknown',
        product_price: ing.products?.price || 0,
      }));

      return ingredients;
    } catch (error) {
      logger.error('RecipeService.getIngredients exception:', error);
      throw error;
    }
  }

  /**
   * Calculate recipe cost
   */
  static async calculateCost(recipeId: number): Promise<number> {
    try {
      const ingredients = await this.getIngredients(recipeId);

      const totalCost = ingredients.reduce(
        (sum, ing) => sum + ing.quantity * ing.product_price,
        0
      );

      return totalCost;
    } catch (error) {
      logger.error('RecipeService.calculateCost exception:', error);
      throw error;
    }
  }
}

export default RecipeService;
