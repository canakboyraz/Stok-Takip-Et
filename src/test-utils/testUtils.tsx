import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { ProjectProvider } from '../utils/projectContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that includes all necessary providers
 * for testing components in isolation
 */
const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <ProjectProvider>{children}</ProjectProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

/**
 * Custom render function that wraps component with all providers
 * Use this instead of @testing-library/react's render
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with custom version
export { customRender as render };

/**
 * Helper to wait for async operations
 */
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Create mock user for testing
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Create mock project for testing
 */
export const createMockProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Project',
  description: 'Test project description',
  created_at: '2024-01-01T00:00:00Z',
  owner_id: 'test-user-id',
  ...overrides,
});

/**
 * Create mock product for testing
 */
export const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  description: 'Test product description',
  unit: 'kg',
  current_stock: 100,
  minimum_stock: 10,
  unit_price: 10.5,
  category_id: 1,
  project_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * Create mock category for testing
 */
export const createMockCategory = (overrides = {}) => ({
  id: 1,
  name: 'Test Category',
  project_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
