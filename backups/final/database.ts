export interface Product {
  id: number;
  name: string;
  category_id: number;
  price: number;
  unit_price: number;
  stock_quantity: number;
  expiry_date: string | null;
  created_at: string;
  category_name?: string;
  min_stock_level: number;
  code: string;
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
} 