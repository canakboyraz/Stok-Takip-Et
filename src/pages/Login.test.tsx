import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils/testUtils';
import Login from './Login';
import { supabase } from '../lib/supabase';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
  });

  it('should render login form', () => {
    render(<Login />);

    expect(screen.getByText('Stok Takip Sistemi')).toBeInTheDocument();
    expect(screen.getByLabelText(/e-posta adresi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /giriş yap/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /kayıt ol/i })
    ).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' },
      },
      error: null,
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/e-posta adresi/i);
    const passwordInput = screen.getByLabelText(/şifre/i);
    const loginButton = screen.getByRole('button', { name: /giriş yap/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });

  it('should show error message on login failure', async () => {
    const user = userEvent.setup();

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/e-posta adresi/i);
    const passwordInput = screen.getByLabelText(/şifre/i);
    const loginButton = screen.getByRole('button', { name: /giriş yap/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpass');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle signup flow', async () => {
    const user = userEvent.setup();
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: '123', email: 'newuser@example.com' } },
      error: null,
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/e-posta adresi/i);
    const passwordInput = screen.getByLabelText(/şifre/i);
    const signupButton = screen.getByRole('button', { name: /kayıt ol/i });

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'NewPassword123');
    await user.click(signupButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'NewPassword123',
      });
      expect(alertMock).toHaveBeenCalledWith(
        'Kayıt başarılı! Giriş yapabilirsiniz.'
      );
    });

    alertMock.mockRestore();
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();

    let resolveLogin: any;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockReturnValue(loginPromise);

    render(<Login />);

    const emailInput = screen.getByLabelText(/e-posta adresi/i);
    const passwordInput = screen.getByLabelText(/şifre/i);
    const loginButton = screen.getByRole('button', { name: /giriş yap/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.click(loginButton);

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText(/giriş yapılıyor/i)).toBeInTheDocument();
      expect(loginButton).toBeDisabled();
    });

    // Resolve the login
    resolveLogin({
      data: {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' },
      },
      error: null,
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });

  it('should redirect if already logged in', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          user: { id: '123', email: 'test@example.com' },
        },
      },
    });

    render(<Login />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/projects');
    });
  });

  it('should require email and password fields', () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(
      /e-posta adresi/i
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/şifre/i) as HTMLInputElement;

    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it('should have password field type', () => {
    render(<Login />);

    const passwordInput = screen.getByLabelText(/şifre/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });
});
