import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductNameComboBox from '../ProductNameComboBox';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('ProductNameComboBox Component', () => {
  const mockTemplates = [
    { id: 1, name: 'Laptop', category: 'elektronik', description: null, unit: 'adet' },
    { id: 2, name: 'Ekmek', category: 'gıda', description: null, unit: 'adet' },
    { id: 3, name: 'Tshirt', category: 'giyim', description: null, unit: 'adet' },
  ];

  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'currentProjectId') return '1';
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      expect(screen.getByLabelText(/ürün adı/i)).toBeInTheDocument();
    });

    it('should render with required attribute', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} required />);

      const input = screen.getByLabelText(/ürün adı/i);
      expect(input).toBeRequired();
    });

    it('should render with error state', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} error helperText="Bu alan zorunludur" />);

      expect(screen.getByText('Bu alan zorunludur')).toBeInTheDocument();
    });

    it('should render disabled state', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} disabled />);

      const input = screen.getByLabelText(/ürün adı/i);
      expect(input).toBeDisabled();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch product templates on mount', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('product_templates');
        expect(mockSelect).toHaveBeenCalledWith('*');
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle missing project ID', async () => {
      Storage.prototype.getItem = jest.fn(() => null);

      const mockSelect = jest.fn();

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('No project ID found in localStorage');
      });
    });

    it('should show loading state', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.click(input);

      // Should show loading text in dropdown
      await waitFor(() => {
        expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when user types', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const mockOnChange = jest.fn();

      render(<ProductNameComboBox value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.change(input, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should capitalize first letter when typing', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const mockOnChange = jest.fn();

      render(<ProductNameComboBox value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.change(input, { target: { value: 'laptop' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Laptop');
      });
    });

    it('should call onCategoryChange when matching template is found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const mockOnCategoryChange = jest.fn();

      render(
        <ProductNameComboBox
          value=""
          onChange={jest.fn()}
          onCategoryChange={mockOnCategoryChange}
        />
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.change(input, { target: { value: 'laptop' } });

      await waitFor(() => {
        expect(mockOnCategoryChange).toHaveBeenCalledWith('Elektronik');
      });
    });

    it('should not call onCategoryChange if callback is not provided', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const mockOnChange = jest.fn();

      render(<ProductNameComboBox value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.change(input, { target: { value: 'laptop' } });

      // Should not throw error
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Autocomplete Dropdown', () => {
    it('should show options when dropdown is opened', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Ekmek')).toBeInTheDocument();
        expect(screen.getByText('Tshirt')).toBeInTheDocument();
      });
    });

    it('should show category in dropdown options', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('(Elektronik)')).toBeInTheDocument();
        expect(screen.getByText('(Gıda)')).toBeInTheDocument();
      });
    });

    it('should show "no options" text when templates are empty', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox {...defaultProps} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText(/ürün şablonu bulunamadı/i)).toBeInTheDocument();
      });
    });
  });

  describe('Value Prop', () => {
    it('should display initial value', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      render(<ProductNameComboBox value="Laptop" onChange={jest.fn()} />);

      await waitFor(() => {
        const input = screen.getByLabelText(/ürün adı/i) as HTMLInputElement;
        expect(input.value).toBe('Laptop');
      });
    });

    it('should update when value prop changes', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const { rerender } = render(<ProductNameComboBox value="" onChange={jest.fn()} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      rerender(<ProductNameComboBox value="Ekmek" onChange={jest.fn()} />);

      await waitFor(() => {
        const input = screen.getByLabelText(/ürün adı/i) as HTMLInputElement;
        expect(input.value).toBe('Ekmek');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string input', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const mockOnChange = jest.fn();

      render(<ProductNameComboBox value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should handle special characters in input', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const mockOnChange = jest.fn();

      render(<ProductNameComboBox value="" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });

      const input = screen.getByLabelText(/ürün adı/i);
      fireEvent.change(input, { target: { value: 'test@123' } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });
});
