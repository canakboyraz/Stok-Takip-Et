/**
 * Integration Test Example: Authentication Flow
 *
 * Integration testleri, birden fazla component ve sistemin birlikte
 * nasıl çalıştığını test eder. Bu örnek, authentication akışını test eder.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '../../pages/Login';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

describe('Integration Test: Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Login Flow', () => {
    it('should complete full login journey from login page to dashboard', async () => {
      // Mock: User is not logged in initially
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // Mock successful login
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Render with Router
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Step 1: Verify login page renders
      expect(screen.getByText('Stok Takip Sistemi')).toBeInTheDocument();

      // Step 2: Fill in login form
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Test123!' } });

      // Step 3: Submit login form
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });
      fireEvent.click(loginButton);

      // Step 4: Verify authentication was called
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Test123!',
        });
      });

      // Step 5: Verify navigation to projects page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });
    });

    it('should handle login failure and allow retry', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // First attempt fails
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Step 1: Try to login with wrong credentials
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(loginButton);

      // Step 2: Verify error is shown
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Step 3: Second attempt succeeds
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      });

      fireEvent.change(passwordInput, { target: { value: 'correct' } });
      fireEvent.click(loginButton);

      // Step 4: Verify navigation after successful retry
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });
    });
  });

  describe('Complete Sign Up Flow', () => {
    it('should complete sign up and show success message', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      });

      global.alert = jest.fn();

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Fill in form
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'NewUser123!' } });

      // Click sign up button
      const signUpButton = screen.getByRole('button', { name: /kayıt ol/i });
      fireEvent.click(signUpButton);

      // Verify API call
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'NewUser123!',
        });
      });

      // Verify success alert
      expect(global.alert).toHaveBeenCalledWith('Kayıt başarılı! Giriş yapabilirsiniz.');
    });
  });

  describe('Session Persistence', () => {
    it('should auto-login if valid session exists', async () => {
      const mockSession = {
        user: { id: 'existing-user', email: 'existing@example.com' },
        access_token: 'valid-token',
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      });

      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should automatically redirect
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // First attempt: network error
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const loginButton = screen.getByRole('button', { name: /giriş yap/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Show network error
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Second attempt: success
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: '123' } },
        error: null,
      });

      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });
});

/**
 * Integration Test Best Practices:
 *
 * 1. Test User Journeys (not implementation)
 *    - Focus on what user does, not how code works
 *    - Test complete flows from start to finish
 *
 * 2. Mock External Dependencies
 *    - API calls (supabase)
 *    - Browser APIs (localStorage, alert, etc.)
 *    - Router navigation
 *
 * 3. Test Error Scenarios
 *    - Network failures
 *    - Invalid inputs
 *    - Server errors
 *    - Recovery from errors
 *
 * 4. Test Happy Path and Edge Cases
 *    - Successful operations
 *    - Failure cases
 *    - Retry scenarios
 *    - Session persistence
 *
 * 5. Use Realistic Data
 *    - Real-looking email addresses
 *    - Valid password formats
 *    - Actual error messages
 *
 * 6. Wait for Async Operations
 *    - Always use waitFor for async actions
 *    - Don't rely on timeouts
 *    - Check for actual UI changes
 *
 * 7. Clean Up After Tests
 *    - Clear mocks between tests
 *    - Restore console methods
 *    - Reset state
 */

export {};
