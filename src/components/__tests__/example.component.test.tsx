/**
 * Bu dosya, Component testlerinin nasıl yazılacağına dair bir örnektir.
 * Gerçek componentler için testler yazarken bu şablonu kullanabilirsiniz.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock için örnek component (gerçek componentinizi import edeceksiniz)
const ExampleButton = ({ onClick, label }: { onClick: () => void; label: string }) => {
  return <button onClick={onClick}>{label}</button>;
};

// Component'leri render etmek için yardımcı fonksiyon
// Router, Theme Provider vs. gibi wrapper'ları buraya ekleyebilirsiniz
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Example Component Test Suite', () => {
  describe('ExampleButton', () => {
    it('should render with correct label', () => {
      renderWithProviders(<ExampleButton onClick={() => {}} label="Click Me" />);

      const button = screen.getByText('Click Me');
      expect(button).toBeInTheDocument();
    });

    it('should call onClick handler when clicked', () => {
      const handleClick = jest.fn();
      renderWithProviders(<ExampleButton onClick={handleClick} label="Click Me" />);

      const button = screen.getByText('Click Me');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', () => {
      const handleClick = jest.fn();
      renderWithProviders(<ExampleButton onClick={handleClick} label="Click Me" />);

      const button = screen.getByText('Click Me');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * Form component testi örneği
   */
  describe('Form Component Example', () => {
    const ExampleForm = () => {
      const [value, setValue] = React.useState('');
      const [submitted, setSubmitted] = React.useState(false);

      return (
        <form onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter text"
          />
          <button type="submit">Submit</button>
          {submitted && <div>Form submitted with: {value}</div>}
        </form>
      );
    };

    it('should handle form input and submission', async () => {
      renderWithProviders(<ExampleForm />);

      const input = screen.getByPlaceholderText('Enter text');
      const submitButton = screen.getByText('Submit');

      // Type into input
      fireEvent.change(input, { target: { value: 'Test Value' } });
      expect(input).toHaveValue('Test Value');

      // Submit form
      fireEvent.click(submitButton);

      // Check if submission message appears
      await waitFor(() => {
        expect(screen.getByText('Form submitted with: Test Value')).toBeInTheDocument();
      });
    });
  });

  /**
   * Async component testi örneği
   */
  describe('Async Component Example', () => {
    const AsyncDataComponent = () => {
      const [data, setData] = React.useState<string | null>(null);
      const [loading, setLoading] = React.useState(false);

      const fetchData = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        setData('Fetched Data');
        setLoading(false);
      };

      return (
        <div>
          <button onClick={fetchData}>Fetch Data</button>
          {loading && <div>Loading...</div>}
          {data && <div data-testid="data-display">{data}</div>}
        </div>
      );
    };

    it('should show loading state and then display data', async () => {
      renderWithProviders(<AsyncDataComponent />);

      const fetchButton = screen.getByText('Fetch Data');

      // Initially no loading or data
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('data-display')).not.toBeInTheDocument();

      // Click to fetch data
      fireEvent.click(fetchButton);

      // Should show loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for data to appear
      await waitFor(() => {
        expect(screen.getByTestId('data-display')).toBeInTheDocument();
      });

      expect(screen.getByText('Fetched Data')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});

/**
 * Component test yazma best practices:
 *
 * 1. Test etmeniz gerekenler:
 *    - Component render oluyor mu?
 *    - Props doğru şekilde kullanılıyor mu?
 *    - User interactions doğru çalışıyor mu?
 *    - Conditional rendering doğru mu?
 *    - State değişimleri doğru mu?
 *
 * 2. Mock edilmesi gerekenler:
 *    - API çağrıları (supabase)
 *    - Router (react-router-dom)
 *    - localStorage/sessionStorage
 *    - External libraries
 *
 * 3. Test yazarken kullanılacak query'ler (öncelik sırasına göre):
 *    - getByRole: En iyi accessibility için
 *    - getByLabelText: Form elementleri için
 *    - getByPlaceholderText: Input elementleri için
 *    - getByText: Text içeriği için
 *    - getByTestId: Son çare olarak (data-testid attribute)
 *
 * 4. Önemli noktalar:
 *    - Her test birbirinden bağımsız olmalı
 *    - Mock'ları her testten önce temizleyin (beforeEach)
 *    - Async işlemlerde waitFor kullanın
 *    - User perspective'den test edin (implementation details değil)
 */

export {};
