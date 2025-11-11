import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '../Login';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock window.alert
global.alert = jest.fn();

describe('Login Page', () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      renderLogin();

      expect(screen.getByText('Stok Takip Sistemi')).toBeInTheDocument();
      expect(screen.getByLabelText(/e-posta adresi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /kayıt ol/i })).toBeInTheDocument();
    });

    it('should render email input with correct attributes', () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toBeRequired();
    });

    it('should render password input with correct attributes', () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      renderLogin();

      const passwordInput = screen.getByLabelText(/şifre/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('name', 'password');
      expect(passwordInput).toBeRequired();
    });
  });

  describe('Session Check on Mount', () => {
    it('should redirect to projects if user is already logged in', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      renderLogin();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });
    });

    it('should not redirect if no session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      renderLogin();

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Input Handling', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    });

    it('should update email state when user types', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password state when user types', () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/şifre/i) as HTMLInputElement;

      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput.value).toBe('password123');
    });

    it('should handle empty inputs', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/şifre/i) as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    });

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });
    });

    it('should display error message when login fails', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid email or password' },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during login', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: 'user-123' } },
                  error: null,
                }),
              100
            )
          )
      );

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Check loading state
      expect(screen.getByText('Giriş Yapılıyor...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Giriş Yap')).toBeInTheDocument();
      });
    });

    it('should disable buttons during login', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: 'user-123' } },
                  error: null,
                }),
              100
            )
          )
      );

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });
      const signupButton = screen.getByRole('button', { name: /kayıt ol/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      expect(loginButton).toBeDisabled();
      expect(signupButton).toBeDisabled();

      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
        expect(signupButton).not.toBeDisabled();
      });
    });

    it('should handle form submission with Enter key', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('should clear error message when user retries login', async () => {
      // First attempt fails
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'First error' },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second attempt succeeds
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      fireEvent.change(passwordInput, { target: { value: 'correct' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sign Up Functionality', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    });

    it('should successfully sign up with valid credentials', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const signupButton = screen.getByRole('button', { name: /kayıt ol/i });

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
        });
      });

      expect(global.alert).toHaveBeenCalledWith('Kayıt başarılı! Giriş yapabilirsiniz.');
    });

    it('should display error message when sign up fails', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'User already exists' },
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const signupButton = screen.getByRole('button', { name: /kayıt ol/i });

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText('User already exists')).toBeInTheDocument();
      });
    });

    it('should show loading state during sign up', async () => {
      (supabase.auth.signUp as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: { id: 'user-123' } },
                  error: null,
                }),
              100
            )
          )
      );

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const signupButton = screen.getByRole('button', { name: /kayıt ol/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      // Both buttons should be disabled during sign up
      expect(signupButton).toBeDisabled();

      await waitFor(() => {
        expect(signupButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    });

    it('should handle network errors gracefully', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should not navigate if user data is missing', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    });

    it('should have proper form structure', () => {
      renderLogin();

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should have proper labels for inputs', () => {
      renderLogin();

      expect(screen.getByLabelText(/e-posta adresi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument();
    });

    it('should focus email input on load', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      expect(emailInput).toHaveAttribute('autoFocus');
    });
  });
});
