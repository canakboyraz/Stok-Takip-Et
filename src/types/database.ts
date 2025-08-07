export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  price: number;
  stock_quantity: number;
  min_stock_level?: number;
  expiry_date: string | null;
  brand?: string | null;
  reception_date?: string | null;
  project_id: number;
  unit_price?: number | null;
  code?: string | null;
  categories?: Category;
  category_name?: string;
}

export interface ExtendedProduct extends Product {
  category_name?: string;
  in_stock?: number;
  price_with_tax?: number;
  min_stock_indicator?: 'normal' | 'warning' | 'danger';
  unit: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  user_id: string;
  notes?: string;
  is_bulk?: boolean;
  bulk_id?: number;
  products?: Product;
  project_id: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
  project_id: number;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
  project_id: number;
  user_id: string;
}

export interface Personnel {
  id: number;
  full_name: string;
  position: string;
  salary: number;
  hire_date: string;
  birth_date: string;
  location: string;
  notes?: string | null;
  created_at: string;
  project_id: number;
  user_id: string;
}

export interface Timesheet {
  id: number;
  personnel_id: number;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  hours?: number;
  notes?: string | null;
  created_at: string;
  project_id: number;
  user_id: string;
  personnel?: Personnel;
}

// Catering menü planlama için yeni arayüzler
export interface Recipe {
  id: number;
  name: string;
  description: string;
  preparation_time: number; // Dakika cinsinden
  cooking_time: number; // Dakika cinsinden
  serving_size: number;
  ingredients: RecipeIngredient[];
  instructions: string;
  cost_per_serving: number;
  category: 'starter' | 'main' | 'dessert' | 'beverage' | 'side';
  created_at: string;
  project_id: number;
  user_id: string;
  image_url?: string;
}

export interface RecipeIngredient {
  id?: number;
  recipe_id: number;
  product_id: number;
  quantity: number;
  unit: string;
  product?: Product;
}

export interface Menu {
  id: number;
  name: string;
  date: string;
  description?: string;
  menu_items: MenuItem[];
  status: 'draft' | 'planned' | 'active' | 'completed';
  created_at: string;
  project_id: number;
  user_id: string;
  event_type?: string;
  guest_count?: number;
  location?: string;
  notes?: string;
  price_per_person?: number;
}

export interface MenuItem {
  recipe_id: number;
  quantity: number;
  recipe?: Recipe;
}

// Müşteri ve Etkinlik yönetimi
export interface Customer {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  created_at: string;
  project_id: number;
  user_id: string;
  type: 'individual' | 'company' | 'institution';
}

export interface Event {
  id: number;
  customer_id: number;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  guest_count: number;
  menu_id?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  advance_payment?: number;
  balance_due?: number;
  notes?: string;
  created_at: string;
  project_id: number;
  user_id: string;
  customer?: Customer;
  menu?: Menu;
}

// Raporlama arayüzleri
export interface ReportConfig {
  id: number;
  name: string;
  type: 'inventory' | 'financial' | 'personnel' | 'customer' | 'event' | 'custom';
  filters: ReportFilter[];
  columns: string[];
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  created_at: string;
  project_id: number;
  user_id: string;
  is_favorite: boolean;
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients?: string[];
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
} 