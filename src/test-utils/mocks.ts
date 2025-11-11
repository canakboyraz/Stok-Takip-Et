import { User } from '@supabase/supabase-js';

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
};

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

// Mock product data
export const mockProduct = {
  id: 1,
  name: 'Test Product',
  category: 'Test Category',
  unit: 'kg',
  price: 10.5,
  stock_quantity: 100,
  project_id: 1,
  created_at: new Date().toISOString(),
};

// Mock category data
export const mockCategory = {
  id: 1,
  name: 'Test Category',
  project_id: 1,
  created_at: new Date().toISOString(),
};

// Helper to create mock Supabase response
export const createMockResponse = <T>(data: T, error: any = null) => {
  return Promise.resolve({ data, error });
};

// Helper to create mock error response
export const createMockError = (message: string, code?: string) => {
  return {
    message,
    code: code || 'UNKNOWN_ERROR',
    details: '',
    hint: '',
  };
};
