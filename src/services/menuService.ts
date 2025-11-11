/**
 * Menu Service
 *
 * Handles all menu-related API calls
 */

import { supabase } from '../lib/supabase';
import { Menu } from '../types/database';
import { AppError, ErrorSeverity } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export interface MenuFilters {
  projectId: number;
  startDate?: string;
  endDate?: string;
}

export interface MenuRecipe {
  recipe_id: number;
  quantity: number;
}

export interface MenuCreateInput {
  name: string;
  date: string;
  description?: string;
  project_id: number;
}

export interface MenuUpdateInput extends Partial<MenuCreateInput> {
  id: number;
}

export interface MenuWithRecipes extends Menu {
  recipes: Array<{
    id: number;
    recipe_id: number;
    quantity: number;
    recipe_name: string;
    recipe_category: string;
    recipe_serving_size: number;
  }>;
}

export interface ConsumptionItem {
  product_id: number;
  product_name: string;
  total_needed: number;
  unit: string;
  current_stock: number;
  sufficient: boolean;
  cost: number;
}

/**
 * Menu Service Class
 */
export class MenuService {
  /**
   * Get all menus with filters
   */
  static async getAll(filters: MenuFilters): Promise<Menu[]> {
    try {
      logger.log('MenuService.getAll:', filters);

      let query = supabase
        .from('menus')
        .select('*')
        .eq('project_id', filters.projectId);

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        logger.error('MenuService.getAll error:', error);
        throw new AppError(
          error.message,
          error.code || 'MENU_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Menüler yüklenirken hata oluştu'
        );
      }

      logger.log(`MenuService.getAll: Fetched ${data.length} menus`);
      return data;
    } catch (error) {
      logger.error('MenuService.getAll exception:', error);
      throw error;
    }
  }

  /**
   * Get single menu by ID with recipes
   */
  static async getById(id: number, projectId: number): Promise<MenuWithRecipes | null> {
    try {
      logger.log('MenuService.getById:', { id, projectId });

      const { data: menu, error: menuError } = await supabase
        .from('menus')
        .select('*')
        .eq('id', id)
        .eq('project_id', projectId)
        .single();

      if (menuError) {
        if (menuError.code === 'PGRST116') {
          return null;
        }
        logger.error('MenuService.getById error:', menuError);
        throw new AppError(
          menuError.message,
          menuError.code || 'MENU_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Menü yüklenirken hata oluştu'
        );
      }

      // Get menu recipes
      const { data: menuItems, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          id,
          recipe_id,
          quantity,
          recipes (
            name,
            category,
            serving_size
          )
        `)
        .eq('menu_id', id);

      if (itemsError) {
        logger.error('MenuService.getById items error:', itemsError);
        throw new AppError(
          itemsError.message,
          itemsError.code || 'MENU_ITEMS_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Menü tarifleri yüklenirken hata oluştu'
        );
      }

      const mappedRecipes = menuItems.map((item: any) => ({
        id: item.id,
        recipe_id: item.recipe_id,
        quantity: item.quantity,
        recipe_name: item.recipes?.name || 'Unknown',
        recipe_category: item.recipes?.category || '',
        recipe_serving_size: item.recipes?.serving_size || 1,
      }));

      return {
        ...menu,
        recipes: mappedRecipes,
      };
    } catch (error) {
      logger.error('MenuService.getById exception:', error);
      throw error;
    }
  }

  /**
   * Create new menu with recipes
   */
  static async create(menu: MenuCreateInput, recipes: MenuRecipe[]): Promise<Menu> {
    try {
      logger.log('MenuService.create:', { menu, recipesCount: recipes.length });

      // Create menu
      const { data: createdMenu, error: menuError } = await supabase
        .from('menus')
        .insert([menu])
        .select()
        .single();

      if (menuError) {
        logger.error('MenuService.create menu error:', menuError);
        throw new AppError(
          menuError.message,
          menuError.code || 'MENU_CREATE_ERROR',
          ErrorSeverity.ERROR,
          'Menü eklenirken hata oluştu'
        );
      }

      // Create menu items
      if (recipes.length > 0) {
        const menuItemsData = recipes.map((recipe) => ({
          menu_id: createdMenu.id,
          recipe_id: recipe.recipe_id,
          quantity: recipe.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('menu_items')
          .insert(menuItemsData);

        if (itemsError) {
          // Rollback: delete the menu
          await supabase.from('menus').delete().eq('id', createdMenu.id);

          logger.error('MenuService.create items error:', itemsError);
          throw new AppError(
            itemsError.message,
            itemsError.code || 'MENU_ITEMS_CREATE_ERROR',
            ErrorSeverity.ERROR,
            'Menü tarifleri eklenirken hata oluştu'
          );
        }
      }

      logger.log('MenuService.create: Created menu:', createdMenu.id);
      return createdMenu;
    } catch (error) {
      logger.error('MenuService.create exception:', error);
      throw error;
    }
  }

  /**
   * Update existing menu and recipes
   */
  static async update(menuData: MenuUpdateInput, recipes?: MenuRecipe[]): Promise<Menu> {
    try {
      logger.log('MenuService.update:', { menuData, recipesCount: recipes?.length });

      const { id, ...updateData } = menuData;

      // Update menu
      const { data: updatedMenu, error: menuError } = await supabase
        .from('menus')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (menuError) {
        logger.error('MenuService.update menu error:', menuError);
        throw new AppError(
          menuError.message,
          menuError.code || 'MENU_UPDATE_ERROR',
          ErrorSeverity.ERROR,
          'Menü güncellenirken hata oluştu'
        );
      }

      // Update recipes if provided
      if (recipes !== undefined) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('menu_items')
          .delete()
          .eq('menu_id', id);

        if (deleteError) {
          logger.error('MenuService.update delete items error:', deleteError);
          throw new AppError(
            deleteError.message,
            deleteError.code || 'MENU_ITEMS_DELETE_ERROR',
            ErrorSeverity.ERROR,
            'Eski menü tarifleri silinirken hata oluştu'
          );
        }

        // Insert new items
        if (recipes.length > 0) {
          const menuItemsData = recipes.map((recipe) => ({
            menu_id: id,
            recipe_id: recipe.recipe_id,
            quantity: recipe.quantity,
          }));

          const { error: insertError } = await supabase
            .from('menu_items')
            .insert(menuItemsData);

          if (insertError) {
            logger.error('MenuService.update insert items error:', insertError);
            throw new AppError(
              insertError.message,
              insertError.code || 'MENU_ITEMS_INSERT_ERROR',
              ErrorSeverity.ERROR,
              'Yeni menü tarifleri eklenirken hata oluştu'
            );
          }
        }
      }

      logger.log('MenuService.update: Updated menu:', updatedMenu.id);
      return updatedMenu;
    } catch (error) {
      logger.error('MenuService.update exception:', error);
      throw error;
    }
  }

  /**
   * Delete menu and its recipes
   */
  static async delete(id: number, projectId: number): Promise<void> {
    try {
      logger.log('MenuService.delete:', { id, projectId });

      // Delete menu items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('menu_items')
        .delete()
        .eq('menu_id', id);

      if (itemsError) {
        logger.error('MenuService.delete items error:', itemsError);
        throw new AppError(
          itemsError.message,
          itemsError.code || 'MENU_ITEMS_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Menü tarifleri silinirken hata oluştu'
        );
      }

      // Delete menu
      const { error: menuError } = await supabase
        .from('menus')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (menuError) {
        logger.error('MenuService.delete menu error:', menuError);
        throw new AppError(
          menuError.message,
          menuError.code || 'MENU_DELETE_ERROR',
          ErrorSeverity.ERROR,
          'Menü silinirken hata oluştu'
        );
      }

      logger.log('MenuService.delete: Deleted menu:', id);
    } catch (error) {
      logger.error('MenuService.delete exception:', error);
      throw error;
    }
  }

  /**
   * Get menu items (recipes)
   */
  static async getMenuItems(menuId: number): Promise<Array<{
    id: number;
    recipe_id: number;
    quantity: number;
    recipe_name: string;
    recipe_serving_size: number;
  }>> {
    try {
      logger.log('MenuService.getMenuItems:', menuId);

      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id,
          recipe_id,
          quantity,
          recipes (
            name,
            serving_size
          )
        `)
        .eq('menu_id', menuId);

      if (error) {
        logger.error('MenuService.getMenuItems error:', error);
        throw new AppError(
          error.message,
          error.code || 'MENU_ITEMS_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Menü tarifleri yüklenirken hata oluştu'
        );
      }

      const items = data.map((item: any) => ({
        id: item.id,
        recipe_id: item.recipe_id,
        quantity: item.quantity,
        recipe_name: item.recipes?.name || 'Unknown',
        recipe_serving_size: item.recipes?.serving_size || 1,
      }));

      return items;
    } catch (error) {
      logger.error('MenuService.getMenuItems exception:', error);
      throw error;
    }
  }

  /**
   * Calculate consumption for a menu
   */
  static async calculateConsumption(
    menuId: number,
    guestCount: number
  ): Promise<ConsumptionItem[]> {
    try {
      logger.log('MenuService.calculateConsumption:', { menuId, guestCount });

      // Get menu items with recipes
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('recipe_id, quantity')
        .eq('menu_id', menuId);

      if (menuError) {
        throw new AppError(
          menuError.message,
          menuError.code || 'MENU_ITEMS_FETCH_ERROR',
          ErrorSeverity.ERROR,
          'Menü tarifleri yüklenirken hata oluştu'
        );
      }

      const consumptionMap = new Map<number, ConsumptionItem>();

      // Process each recipe in the menu
      for (const menuItem of menuItems) {
        // Get recipe details
        const { data: recipe, error: recipeError } = await supabase
          .from('recipes')
          .select('serving_size')
          .eq('id', menuItem.recipe_id)
          .single();

        if (recipeError) continue;

        // Get recipe ingredients
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .select(`
            product_id,
            quantity,
            unit,
            products (
              name,
              price,
              stock_quantity
            )
          `)
          .eq('recipe_id', menuItem.recipe_id);

        if (ingredientsError) continue;

        const servingMultiplier = guestCount / recipe.serving_size;
        const recipeMultiplier = menuItem.quantity || 1;

        ingredients.forEach((ing: any) => {
          const totalNeeded = ing.quantity * recipeMultiplier * servingMultiplier;
          const productId = ing.product_id;

          if (consumptionMap.has(productId)) {
            const existing = consumptionMap.get(productId)!;
            existing.total_needed += totalNeeded;
            existing.cost += totalNeeded * ing.products.price;
            existing.sufficient = existing.current_stock >= existing.total_needed;
          } else {
            consumptionMap.set(productId, {
              product_id: productId,
              product_name: ing.products.name,
              total_needed: totalNeeded,
              unit: ing.unit,
              current_stock: ing.products.stock_quantity,
              sufficient: ing.products.stock_quantity >= totalNeeded,
              cost: totalNeeded * ing.products.price,
            });
          }
        });
      }

      return Array.from(consumptionMap.values());
    } catch (error) {
      logger.error('MenuService.calculateConsumption exception:', error);
      throw error;
    }
  }
}

export default MenuService;
