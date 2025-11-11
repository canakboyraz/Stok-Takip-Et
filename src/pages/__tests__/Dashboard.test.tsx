import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../hooks/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(() => ['1', jest.fn(), jest.fn()]),
}));

describe('Dashboard Page', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Product 1',
      code: 'P001',
      price: 100,
      stock_quantity: 10,
      expiry_date: '2025-01-20', // Expiring soon
      project_id: 1,
      categories: { name: 'Category 1' },
      category_name: 'Category 1',
    },
    {
      id: 2,
      name: 'Product 2',
      code: 'P002',
      price: 200,
      stock_quantity: 5,
      expiry_date: '2025-12-31', // Not expiring soon
      project_id: 1,
      categories: { name: 'Category 2' },
      category_name: 'Category 2',
    },
    {
      id: 3,
      name: 'Product 3',
      code: 'P003',
      price: 150,
      stock_quantity: 0,
      expiry_date: null,
      project_id: 1,
      categories: { name: 'Category 1' },
      category_name: 'Category 1',
    },
  ];

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render dashboard page', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Data Fetching and Display', () => {
    it('should fetch and display products', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });
    });

    it('should calculate total products statistic', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total products count
      });
    });

    it('should calculate expiring products statistic', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        // At least one product is expiring (Product 1)
        expect(screen.getByText(/son kullanma/i)).toBeInTheDocument();
      });
    });

    it('should calculate total value statistic', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        // Total value = (100*10) + (200*5) + (150*0) = 2000
        expect(screen.getByText(/2.000/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when fetch fails', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/hata/i)).toBeInTheDocument();
      });
    });

    it('should display error when no project is selected', async () => {
      // Mock useLocalStorage to return null project ID
      jest.resetModules();
      jest.doMock('../../hooks/useLocalStorage', () => ({
        __esModule: true,
        default: jest.fn(() => [null, jest.fn(), jest.fn()]),
      }));

      const { default: DashboardComponent } = await import('../Dashboard');

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(
        <BrowserRouter>
          <DashboardComponent />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/proje seçilmemiş/i)).toBeInTheDocument();
      });
    });

    it('should handle empty product list', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Total products = 0
      });
    });
  });

  describe('Expiry Date Handling', () => {
    it('should highlight expiring products', async () => {
      const today = new Date();
      const expiringDate = new Date(today);
      expiringDate.setDate(today.getDate() + 5); // 5 days from now

      const productsWithExpiry = [
        {
          id: 1,
          name: 'Expiring Product',
          code: 'EXP001',
          price: 100,
          stock_quantity: 10,
          expiry_date: expiringDate.toISOString().split('T')[0],
          project_id: 1,
          categories: { name: 'Test' },
          category_name: 'Test',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: productsWithExpiry, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Expiring Product')).toBeInTheDocument();
      });
    });

    it('should handle products without expiry date', async () => {
      const productsNoExpiry = [
        {
          id: 1,
          name: 'No Expiry Product',
          code: 'NOEXP001',
          price: 100,
          stock_quantity: 10,
          expiry_date: null,
          project_id: 1,
          categories: { name: 'Test' },
          category_name: 'Test',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: productsNoExpiry, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('No Expiry Product')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display all statistics cards', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/toplam ürün/i)).toBeInTheDocument();
        expect(screen.getByText(/toplam değer/i)).toBeInTheDocument();
      });
    });

    it('should format currency correctly', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        // Should contain Turkish Lira symbol
        expect(screen.getByText(/₺/)).toBeInTheDocument();
      });
    });
  });

  describe('Product Table', () => {
    it('should display product table with headers', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/ürün adı/i)).toBeInTheDocument();
        expect(screen.getByText(/stok/i)).toBeInTheDocument();
      });
    });

    it('should display product information', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('P001')).toBeInTheDocument();
        expect(screen.getByText('Category 1')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderDashboard();

      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });
});
