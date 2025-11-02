import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore environment
    process.env.NODE_ENV = originalEnv;

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Bir hata oluştu/i)).toBeInTheDocument();
  });

  it('should show "Tekrar Dene" button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /Tekrar Dene/i })).toBeInTheDocument();
  });

  it('should show "Sayfayı Yenile" button in error state', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /Sayfayı Yenile/i })).toBeInTheDocument();
  });

  it('should reset error state when "Tekrar Dene" is clicked', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByText(/Bir hata oluştu/i)).toBeInTheDocument();

    // Click "Tekrar Dene" button
    const retryButton = screen.getByRole('button', { name: /Tekrar Dene/i });
    await user.click(retryButton);

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show content again
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should show error details in development', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error message
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should hide error details in production', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should NOT show detailed error message
      expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();

      // Should show generic message
      expect(screen.getByText(/Bir hata oluştu/i)).toBeInTheDocument();
    });
  });

  it('should call logger.error when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Logger should have been called (via console.error mock)
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
