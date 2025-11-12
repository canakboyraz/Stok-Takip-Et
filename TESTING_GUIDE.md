# 🧪 Testing Guide

## Overview

This project uses **Jest** and **React Testing Library** for testing. Tests are located next to the source files with `.test.ts` or `.test.tsx` extensions.

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test Login.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should handle login"
```

---

## 📁 Test Structure

```
src/
├── test-utils/
│   ├── testUtils.tsx          # Custom render with providers
│   └── supabaseMock.ts        # Supabase client mocks
├── setupTests.ts              # Global test setup
├── utils/
│   └── validation.test.ts     # Utility function tests
└── pages/
    └── Login.test.tsx         # Component tests
```

---

## 🛠️ Test Utilities

### Custom Render Function

Use the custom `render` from `test-utils` instead of `@testing-library/react`:

```typescript
import { render, screen } from '../test-utils/testUtils';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Data Helpers

```typescript
import {
  createMockUser,
  createMockProject,
  createMockProduct,
} from '../test-utils/testUtils';

const user = createMockUser({ email: 'custom@example.com' });
const project = createMockProject({ name: 'My Project' });
const product = createMockProduct({ name: 'Test Product', current_stock: 50 });
```

### Supabase Mocking

```typescript
import { createMockSupabaseClient } from '../test-utils/supabaseMock';

// Mock the entire supabase module
jest.mock('../lib/supabase', () => ({
  supabase: createMockSupabaseClient(),
}));
```

---

## ✅ Writing Tests

### Unit Test Example (Utility Functions)

```typescript
// src/utils/myUtil.test.ts
import { formatPrice } from './myUtil';

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(10.5)).toBe('₺10.50');
    expect(formatPrice(1000)).toBe('₺1,000.00');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('₺0.00');
  });
});
```

### Component Test Example

```typescript
// src/components/Button.test.tsx
import { render, screen } from '../test-utils/testUtils';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick handler', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click Me</Button>);

    await user.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Test Example

```typescript
// src/pages/Products.test.tsx
import { render, screen, waitFor } from '../test-utils/testUtils';
import userEvent from '@testing-library/user-event';
import Products from './Products';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

describe('Products Page Integration', () => {
  beforeEach(() => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Product 1', current_stock: 100 },
          { id: 2, name: 'Product 2', current_stock: 50 },
        ],
        error: null,
      }),
    });
  });

  it('should display products list', async () => {
    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('should add new product', async () => {
    const user = userEvent.setup();

    render(<Products />);

    await user.click(screen.getByText('Add Product'));
    await user.type(screen.getByLabelText('Name'), 'New Product');
    await user.type(screen.getByLabelText('Stock'), '100');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(screen.getByText('Product added')).toBeInTheDocument();
    });
  });
});
```

---

## 🎯 Best Practices

### 1. Test User Behavior, Not Implementation

❌ **Bad**:
```typescript
expect(component.state.isOpen).toBe(true);
```

✅ **Good**:
```typescript
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### 2. Use Accessible Queries

Order of priority:
1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` (last resort)

✅ **Good**:
```typescript
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByText('Welcome');
```

### 3. Test Async Operations

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### 4. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

### 5. Use userEvent Instead of fireEvent

❌ **Bad**:
```typescript
fireEvent.click(button);
```

✅ **Good**:
```typescript
const user = userEvent.setup();
await user.click(button);
```

---

## 🔍 Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Statements | 80% | - |
| Branches | 75% | - |
| Functions | 80% | - |
| Lines | 80% | - |

### Check Coverage

```bash
npm test -- --coverage --watchAll=false
```

### View Coverage Report

Open `coverage/lcov-report/index.html` in your browser.

---

## 📝 Test Checklist

### Component Tests

- [ ] Renders without crashing
- [ ] Displays correct content
- [ ] Handles user interactions (clicks, typing)
- [ ] Shows loading states
- [ ] Displays error messages
- [ ] Navigates correctly
- [ ] Calls API with correct parameters
- [ ] Updates state properly

### Utility Function Tests

- [ ] Returns correct output for valid input
- [ ] Handles edge cases (null, undefined, empty)
- [ ] Validates input properly
- [ ] Throws errors when expected

### Integration Tests

- [ ] Multiple components work together
- [ ] Data flows correctly
- [ ] API calls succeed
- [ ] Error handling works end-to-end

---

## 🐛 Debugging Tests

### 1. See Rendered Output

```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Prints entire DOM
screen.debug(screen.getByRole('button')); // Prints specific element
```

### 2. Check Component State

```typescript
import { prettyDOM } from '@testing-library/react';

console.log(prettyDOM(container, 99999)); // Full output
```

### 3. Use logRoles

```typescript
import { logRoles } from '@testing-library/react';

logRoles(container); // Shows all available roles
```

### 4. Enable Verbose Logging

```bash
npm test -- --verbose
```

---

## 🚨 Common Issues

### Issue: "Not wrapped in act(...)"

**Solution**: Use `await` with user events and `waitFor` for async updates:

```typescript
await user.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### Issue: "Unable to find element"

**Solution**:
1. Use `screen.debug()` to see what's rendered
2. Check if element is in document: `screen.getByText('text', { timeout: 3000 })`
3. Use `findBy` queries for async elements

```typescript
const element = await screen.findByText('Async Content');
```

### Issue: "Multiple elements with the same text"

**Solution**: Use more specific queries:

```typescript
screen.getByRole('button', { name: 'Submit' });
screen.getAllByRole('button')[0]; // Get first if multiple expected
```

### Issue: "Mock not being called"

**Solution**: Ensure mock is set up before component renders:

```typescript
const mockFn = jest.fn();
(supabase.from as jest.Mock).mockReturnValue({
  select: mockFn,
});

render(<Component />); // Now renders with mock
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Playground](https://testing-playground.com/)

---

## 🎓 Examples

### Testing Forms

```typescript
it('should submit form with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<ProductForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Product Name'), 'New Product');
  await user.type(screen.getByLabelText('Stock'), '100');
  await user.type(screen.getByLabelText('Price'), '10.50');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'New Product',
      stock: 100,
      price: 10.5,
    });
  });
});
```

### Testing Navigation

```typescript
it('should navigate to products page', async () => {
  const user = userEvent.setup();

  render(<App />);

  await user.click(screen.getByRole('link', { name: /products/i }));

  expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('should display error message on API failure', async () => {
  (supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    }),
  });

  render(<Products />);

  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
```

---

## 🏃 CI/CD Integration

Tests automatically run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test -- --coverage --watchAll=false

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

**Last Updated**: 2025-11-11
**Maintainer**: Development Team
