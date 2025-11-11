import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Categories from '../Categories';
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

// Mock window.confirm and window.alert
global.confirm = jest.fn(() => true);
global.alert = jest.fn();

describe('Categories Page', () => {
  const mockCategories = [
    { id: 1, name: 'Elektronik', project_id: 1, created_at: '2025-01-01' },
    { id: 2, name: 'Gıda', project_id: 1, created_at: '2025-01-02' },
    { id: 3, name: 'Giyim', project_id: 1, created_at: '2025-01-03' },
  ];

  const renderCategories = () => {
    return render(
      <BrowserRouter>
        <Categories />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'currentProjectId') return '1';
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering and Data Fetching', () => {
    it('should render categories page title', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      expect(screen.getByText(/kategoriler/i)).toBeInTheDocument();
    });

    it('should fetch and display categories on mount', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
        expect(screen.getByText('Gıda')).toBeInTheDocument();
        expect(screen.getByText('Giyim')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching', () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue(
            new Promise(() => {}) // Never resolves to keep loading
          ),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching categories:',
          expect.objectContaining({ message: 'Fetch error' })
        );
      });
    });

    it('should handle missing project ID', async () => {
      Storage.prototype.getItem = jest.fn(() => null);

      const mockSelect = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('No project ID found in localStorage');
      });

      // Should not attempt to fetch
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe('Add Category Dialog', () => {
    beforeEach(() => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
    });

    it('should open add category dialog when clicking add button', async () => {
      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/kategori ekle/i)).toBeInTheDocument();
    });

    it('should close dialog when clicking cancel', async () => {
      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /iptal/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should update input value when typing', async () => {
      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      const input = screen.getByLabelText(/kategori adı/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test Kategori' } });

      expect(input.value).toBe('Test Kategori');
    });
  });

  describe('Add Category Functionality', () => {
    beforeEach(() => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [{ id: 4 }], error: null }),
        }),
      });

      (activityLogger.logActivity as jest.Mock).mockResolvedValue(true);
    });

    it('should successfully add a new category', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 4 }], error: null }),
      });

      // Setup mocks for initial fetch
      let callCount = 0;
      const mockSelect = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) {
          // Initial fetch and after save
          return {
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
            }),
          };
        } else {
          // Check for existing category
          return {
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      const input = screen.getByLabelText(/kategori adı/i);
      fireEvent.change(input, { target: { value: 'mobilya' } });

      const saveButton = screen.getByRole('button', { name: /kaydet/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Mobilya', // Should be capitalized
            project_id: 1,
          })
        );
      });

      expect(activityLogger.logActivity).toHaveBeenCalled();
    });

    it('should not add category with empty name', async () => {
      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      const saveButton = screen.getByRole('button', { name: /kaydet/i });
      fireEvent.click(saveButton);

      expect(global.alert).toHaveBeenCalledWith('Kategori adı boş olamaz');
    });

    it('should capitalize first letter when adding category', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 4 }], error: null }),
      });

      let callCount = 0;
      const mockSelect = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 3) {
          return {
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
            }),
          };
        } else {
          return {
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      const input = screen.getByLabelText(/kategori adı/i);
      fireEvent.change(input, { target: { value: 'lowercase text' } });

      const saveButton = screen.getByRole('button', { name: /kaydet/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Lowercase text', // First letter capitalized
          })
        );
      });
    });
  });

  describe('Edit Category', () => {
    it('should open edit dialog with existing category data', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/düzenle/i);
      fireEvent.click(editButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const input = screen.getByLabelText(/kategori adı/i) as HTMLInputElement;
      expect(input.value).toBe('Elektronik');
    });
  });

  describe('Delete Category', () => {
    it('should show delete confirmation dialog', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/sil/i);
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle category insert error', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      });

      let callCount = 0;
      const mockSelect = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
            }),
          };
        } else {
          return {
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /yeni kategori/i });
      fireEvent.click(addButton);

      const input = screen.getByLabelText(/kategori adı/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      const saveButton = screen.getByRole('button', { name: /kaydet/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for action buttons', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      renderCategories();

      await waitFor(() => {
        expect(screen.getByText('Elektronik')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/düzenle/i);
      const deleteButtons = screen.getAllByLabelText(/sil/i);

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });
});
