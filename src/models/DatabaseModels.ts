import { supabase } from '../lib/supabase';
import { Product, Category, StockMovement, Project } from '../types/database';

// Model sınıfları - Supabase için MVC yapısı

export class ProductModel {
  // Bir projeye ait tüm ürünleri getir
  static async getAllProducts(projectId: number): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories:category_id(name)')
      .eq('project_id', projectId)
      .order('name');
    
    if (error) {
      console.error('Ürünler yüklenirken hata:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // ID'ye göre ürün getir
  static async getProductById(id: number): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories:category_id(name)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Ürün detayları yüklenirken hata:', error);
      return null;
    }
    
    return data || null;
  }
  
  // Yeni ürün ekle
  static async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select('*')
      .single();
    
    if (error) {
      console.error('Ürün eklenirken hata:', error);
      throw error;
    }
    
    return data;
  }
  
  // Ürün güncelle
  static async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Ürün güncellenirken hata:', error);
      throw error;
    }
    
    return data;
  }
  
  // Ürün sil
  static async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Ürün silinirken hata:', error);
      throw error;
    }
  }
  
  // Stoğu azalan ürünleri getir
  static async getLowStockProducts(projectId: number, limit: number = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories:category_id(name)')
      .eq('project_id', projectId)
      .lt('stock_quantity', 10) // Örnek olarak 10'dan az kalan stoklar
      .order('stock_quantity')
      .limit(limit);
    
    if (error) {
      console.error('Stoğu azalan ürünler yüklenirken hata:', error);
      throw error;
    }
    
    return data || [];
  }
}

export class CategoryModel {
  // Bir projeye ait tüm kategorileri getir
  static async getAllCategories(projectId: number): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('project_id', projectId)
      .order('name');
    
    if (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Kategori ekle
  static async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select('*')
      .single();
    
    if (error) {
      console.error('Kategori eklenirken hata:', error);
      throw error;
    }
    
    return data;
  }
  
  // Kategori güncelle
  static async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Kategori güncellenirken hata:', error);
      throw error;
    }
    
    return data;
  }
  
  // Kategori sil
  static async deleteCategory(id: number): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Kategori silinirken hata:', error);
      throw error;
    }
  }
}

export class StockMovementModel {
  // Stok hareketlerini getir
  static async getStockMovements(projectId: number, limit: number = 50): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, products(*)')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Stok hareketleri yüklenirken hata:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Stok hareketi ekle
  static async addStockMovement(movement: Omit<StockMovement, 'id'>): Promise<StockMovement> {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select('*')
      .single();
    
    if (error) {
      console.error('Stok hareketi eklenirken hata:', error);
      throw error;
    }
    
    return data;
  }
  
  // Ürüne göre stok hareketlerini getir
  static async getMovementsByProduct(projectId: number, productId: number): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('project_id', projectId)
      .eq('product_id', productId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Ürün stok hareketleri yüklenirken hata:', error);
      throw error;
    }
    
    return data || [];
  }
}

export class ProjectModel {
  // Kullanıcıya ait projeleri getir
  static async getUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Projeler yüklenirken hata:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Proje detaylarını getir
  static async getProjectById(id: number): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Proje detayları yüklenirken hata:', error);
      return null;
    }
    
    return data || null;
  }
  
  // Yeni proje ekle
  static async addProject(project: Omit<Project, 'id'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select('*')
      .single();
    
    if (error) {
      console.error('Proje eklenirken hata:', error);
      throw error;
    }
    
    return data;
  }
  
  // Proje güncelle
  static async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Proje güncellenirken hata:', error);
      throw error;
    }
    
    return data;
  }
} 