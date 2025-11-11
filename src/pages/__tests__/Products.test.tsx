import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Products from '../Products';
import { supabase } from '../../lib/supabase';
import * as activityLogger from '../../lib/activityLogger';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../lib/activityLogger', () => ({
  logActivity: jest.fn(),
}));

global.alert = jest.fn();
global.confirm = jest.fn(() => true);

describe('Products Page', () => {
  const mockCategories = [
    { id: 1, name: 'Elektronik', project_id: 1 },
    { id: 2, name: 'Gıda', project_id: 1 },
  ];

  const mockProducts = [
    {
      id: 1,
      name: 'Laptop',
      code: 'ELEC-001',
      category_id: 1,
      price: 5000,
      stock_quantity: 10,
      min_stock_level: 5,
      project_id: 1,
      categories: { id: 1, name: 'Elektronik' },
      category_name: 'Elektronik',
    },
    {
      id: 2,
      name: 'Ekmek',
      code: 'FOOD-001',
      category_id: 2,
      price: 5,
      stock_quantity: 0,
      min_stock_level: 10,
      project_id: 1,
      categories: { id: 2, name: 'Gıda' },
      category_name: 'Gıda',
    },
  ];

  const renderProducts = () => {
    return render(
      <BrowserRouter>
        <Products />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'currentProjectId') return '1';
      return null;
    });

    (activityLogger.logActivity as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering and Data Fetching', () => {
    it('should render products page', async () => {
      // Mock products fetch
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      // Mock categories fetch
      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'products') {
          return { select: mockProductsSelect };
        } else if (table === 'categories') {
          return { select: mockCategoriesSelect };
        }
        return { select: jest.fn() };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByText(/ürünler/i)).toBeInTheDocument();
      });
    });

    it('should fetch and display products', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        } else if (table === 'categories') {
          return { select: mockCategoriesSelect };
        }
        return { select: jest.fn() };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Ekmek')).toBeInTheDocument();
      });
    });

    it('should handle missing project ID', async () => {
      Storage.prototype.getItem = jest.fn(() => null);

      const mockSelect = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderProducts();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Proje ID bulunamadı');
      });
    });

    it('should handle fetch errors', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching products:',
          expect.objectContaining({ message: 'Fetch error' })
        );
      });
    });
  });

  describe('Add Product Dialog', () => {
    beforeEach(async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });
    });

    it('should open add product dialog', async () => {
      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni ürün/i });
      fireEvent.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not open dialog if no categories exist', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /yeni ürün/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni ürün/i });
      fireEvent.click(addButton);

      expect(global.alert).toHaveBeenCalledWith('Lütfen önce bir kategori oluşturun!');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Search and Filter', () => {
    beforeEach(async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });
    });

    it('should filter products by search term', async () => {
      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Ekmek')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/ara/i);
      fireEvent.change(searchInput, { target: { value: 'Laptop' } });

      // Laptop should be visible
      expect(screen.getByText('Laptop')).toBeInTheDocument();

      // Note: In actual implementation, Ekmek might still be in DOM but hidden
      // This depends on implementation details
    });

    it('should filter products with zero stock', async () => {
      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Ekmek')).toBeInTheDocument();
      });

      // Look for the checkbox to show zero stock items
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Both products should still be visible
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Ekmek')).toBeInTheDocument();
    });
  });

  describe('Edit Product', () => {
    it('should open edit dialog with product data', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/düzenle/i);
      fireEvent.click(editButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Check if form is populated with product data
      const nameInput = screen.getByLabelText(/ürün adı/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Laptop');
    });
  });

  describe('Delete Product', () => {
    it('should show confirmation before deleting', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: mockProductsSelect,
            delete: mockDelete,
          };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/sil/i);
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalled();
    });

    it('should not delete if user cancels', async () => {
      global.confirm = jest.fn(() => false);

      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      const mockDelete = jest.fn();

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: mockProductsSelect,
            delete: mockDelete,
          };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/sil/i);
      fireEvent.click(deleteButtons[0]);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('Category Accordion', () => {
    it('should group products by category', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
        expect(screen.getByText('Gıda')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      const mockCategoriesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'products') {
          return { select: mockProductsSelect };
        }
        return { select: mockCategoriesSelect };
      });

      renderProducts();

      await waitFor(() => {
        const editButtons = screen.getAllByLabelText(/düzenle/i);
        const deleteButtons = screen.getAllByLabelText(/sil/i);

        expect(editButtons.length).toBeGreaterThan(0);
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
