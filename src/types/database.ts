export interface Product {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  user_id: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  created_at: string;
} 