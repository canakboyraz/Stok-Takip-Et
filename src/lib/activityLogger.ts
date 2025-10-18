import { supabase } from './supabase';

export type ActivityType = 
  // Stok işlemleri
  | 'stock_add'
  | 'stock_remove'
  | 'stock_update'
  | 'stock_transfer'
  | 'stock_adjustment'
  | 'stock_bulk_update'
  | 'stock_bulk_out'
  
  // Ürün işlemleri
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'product_template_create'
  | 'product_template_update'
  | 'product_template_delete'
  
  // Kategori işlemleri
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  
  // Tarif işlemleri
  | 'recipe_create'
  | 'recipe_update'
  | 'recipe_delete'
  
  // Menü işlemleri
  | 'menu_create'
  | 'menu_update'
  | 'menu_delete'
  | 'menu_consumption'
  | 'menu_consumption_undo'
  
  // Personel işlemleri
  | 'personnel_create'
  | 'personnel_update'
  | 'personnel_delete'
  
  // Gider işlemleri
  | 'expense_create'
  | 'expense_update'
  | 'expense_delete'
  
  // Sistem işlemleri
  | 'user_login'
  | 'user_logout'
  | 'system_backup'
  | 'data_export'
  | 'data_import'
  
  // Proje işlemleri
  | 'project_create'
  | 'project_update'
  | 'project_delete'
  | 'project_permission_change';

export type EntityType = 
  | 'product'
  | 'product_template'
  | 'category'
  | 'recipe'
  | 'menu'
  | 'stock_movement'
  | 'bulk_movement'
  | 'personnel'
  | 'expense'
  | 'project'
  | 'user_permission'
  | 'system';

/**
 * Etkinlik kaydı ekleyen fonksiyon
 */
export const logActivity = async (
  activityType: ActivityType,
  description: string,
  entityType: EntityType,
  entityId: number | null = null
): Promise<boolean> => {
  try {
    console.group('🔍 Activity Logger');
    console.log('📝 logActivity called:', { activityType, description, entityType, entityId });
    
    // Mevcut kullanıcı bilgisini al
    console.log('👤 Fetching current user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
      console.groupEnd();
      return false;
    }
    
    if (!userData || !userData.user) {
      console.error('❌ Etkinlik kaydı eklenemiyor: Kullanıcı bulunamadı');
      console.groupEnd();
      return false;
    }
    
    console.log('✅ User found:', userData.user.email);

    // Mevcut proje ID'sini al
    console.log('🏢 Getting current project ID...');
    const projectId = localStorage.getItem('currentProjectId');
    if (!projectId) {
      console.error('❌ Etkinlik kaydı eklenemiyor: Proje ID bulunamadı');
      console.groupEnd();
      return false;
    }
    console.log('✅ Project ID:', projectId);

    // IP adresini al (production ortamında değiştirilmeli)
    const ipAddress = '127.0.0.1'; // Geliştirme için varsayılan değer

    // Etkinlik kaydı verisini oluştur
    const activityData = {
      user_id: userData.user.id,
      project_id: parseInt(projectId),
      action_type: activityType,
      action_description: description,
      entity_type: entityType,
      entity_id: entityId, // Now using bigint column type
      user_email: userData.user.email,
      ip_address: ipAddress
    };

    console.log('📋 Activity data to be inserted:', activityData);
    console.log('📋 Activity data JSON:', JSON.stringify(activityData, null, 2));
    
    // Etkinlik kaydını ekle
    console.log('💾 Inserting activity record...');
    const { data, error } = await supabase.from('activities').insert(activityData).select();

    if (error) {
      console.error('❌ Error inserting activity record:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error hint:', error.hint);
      console.groupEnd();
      return false;
    }

    console.log('✅ Activity record inserted successfully:', data);
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('❌ Unexpected error in logActivity:', error);
    console.groupEnd();
    return false;
  }
};

/**
 * ActivityType için Türkçe açıklamalar
 */
export const getActivityTypeLabel = (type: ActivityType): string => {
  const labels: Record<ActivityType, string> = {
    stock_add: 'Stok Girişi',
    stock_remove: 'Stok Çıkışı',
    stock_update: 'Stok Güncelleme',
    stock_transfer: 'Stok Transferi',
    stock_adjustment: 'Stok Düzeltme',
    stock_bulk_update: 'Toplu Stok Güncelleme',
    stock_bulk_out: 'Toplu Stok Çıkışı',
    
    product_create: 'Ürün Ekleme',
    product_update: 'Ürün Güncelleme',
    product_delete: 'Ürün Silme',
    product_template_create: 'Ürün Şablonu Ekleme',
    product_template_update: 'Ürün Şablonu Güncelleme',
    product_template_delete: 'Ürün Şablonu Silme',
    
    category_create: 'Kategori Ekleme',
    category_update: 'Kategori Güncelleme',
    category_delete: 'Kategori Silme',
    
    recipe_create: 'Tarif Ekleme',
    recipe_update: 'Tarif Güncelleme',
    recipe_delete: 'Tarif Silme',
    
    menu_create: 'Menü Ekleme',
    menu_update: 'Menü Güncelleme',
    menu_delete: 'Menü Silme',
    menu_consumption: 'Menü Tüketimi',
    menu_consumption_undo: 'Menü Tüketimi Geri Alma',
    
    personnel_create: 'Personel Ekleme',
    personnel_update: 'Personel Güncelleme',
    personnel_delete: 'Personel Silme',
    
    expense_create: 'Gider Ekleme',
    expense_update: 'Gider Güncelleme',
    expense_delete: 'Gider Silme',
    
    user_login: 'Kullanıcı Girişi',
    user_logout: 'Kullanıcı Çıkışı',
    system_backup: 'Sistem Yedeği',
    data_export: 'Veri Dışa Aktarma',
    data_import: 'Veri İçe Aktarma',
    
    project_create: 'Proje Oluşturma',
    project_update: 'Proje Güncelleme',
    project_delete: 'Proje Silme',
    project_permission_change: 'Proje İzni Değişikliği'
  };
  
  return labels[type] || 'Bilinmeyen İşlem';
};

/**
 * EntityType için Türkçe açıklamalar
 */
export const getEntityTypeLabel = (type: EntityType): string => {
  const labels: Record<EntityType, string> = {
    product: 'Ürün',
    product_template: 'Ürün Şablonu',
    category: 'Kategori',
    recipe: 'Tarif',
    menu: 'Menü',
    stock_movement: 'Stok Hareketi',
    bulk_movement: 'Toplu İşlem',
    personnel: 'Personel',
    expense: 'Gider',
    project: 'Proje',
    user_permission: 'Kullanıcı İzni',
    system: 'Sistem'
  };
  
  return labels[type] || 'Bilinmeyen Varlık Tipi';
}; 