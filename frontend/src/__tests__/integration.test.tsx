import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { FileProvider } from '../contexts/FileContext';

// Mock the API services
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'member',
          organizationId: 1,
          organizationName: 'Test Organization',
          status: 'active'
        }
      }
    })),
    register: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        userId: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    })),
    getAuthData: jest.fn(() => ({ token: null, user: null, refreshToken: null })),
    clearAuthData: jest.fn(),
    verifyToken: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'member',
          organizationId: 1,
          organizationName: 'Test Organization',
          status: 'active'
        }
      }
    })),
  },
}));

jest.mock('../services/fileService', () => ({
  fileService: {
    getFiles: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      }
    })),
    getFolders: jest.fn(() => Promise.resolve({
      success: true,
      data: []
    })),
    getFileStats: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        totalFiles: 0,
        totalSize: 0,
        typeStats: [],
        recentUploads: 0
      }
    })),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <FileProvider>
        {children}
      </FileProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('redirects to login page by default', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      expect(screen.getByText('Task Insight')).toBeInTheDocument();
      expect(screen.getByText('Document Management System')).toBeInTheDocument();
    });

    it('handles successful login and redirects to dashboard', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Fill out login form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');

      // Submit form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles successful registration and switches to login', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to registration form
      const createAccountTab = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountTab);

      const joinOrgOption = screen.getByText('Join Organization');
      await user.click(joinOrgOption);

      // Fill out registration form
      await user.type(screen.getByLabelText('Invitation Code'), 'TEST123');
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'password123');

      // Submit form
      const registerButton = screen.getByRole('button', { name: /join organization/i });
      await user.click(registerButton);

      // Should switch back to login form after successful registration
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Flow', () => {
    it('navigates between login and create account tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should start on login tab
      expect(screen.getByLabelText('Email')).toBeInTheDocument();

      // Switch to create account tab
      const createAccountTab = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountTab);

      expect(screen.getByText('How would you like to create your account?')).toBeInTheDocument();

      // Switch back to login tab
      const loginTab = screen.getByRole('button', { name: /login/i });
      await user.click(loginTab);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('navigates between registration options', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to create account options
      const createAccountTab = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountTab);

      // Select join organization option
      const joinOrgOption = screen.getByText('Join Organization');
      await user.click(joinOrgOption);

      expect(screen.getByLabelText('Invitation Code')).toBeInTheDocument();

      // Go back to options
      const backButton = screen.getByRole('button', { name: /back to options/i });
      await user.click(backButton);

      expect(screen.getByText('How would you like to create your account?')).toBeInTheDocument();

      // Select admin option
      const adminOption = screen.getByText('Task Insight Admin');
      await user.click(adminOption);

      expect(screen.getByLabelText('Admin Email')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates email format in login form', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Enter invalid email
      await user.type(screen.getByLabelText('Email'), 'invalid-email');
      await user.type(screen.getByLabelText('Password'), 'password123');

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Should show validation error
      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
        expect(emailInput.validity.valid).toBe(false);
      });
    });

    it('validates password length in registration form', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to registration form
      const createAccountTab = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountTab);

      const joinOrgOption = screen.getByText('Join Organization');
      await user.click(joinOrgOption);

      // Fill out form with short password
      await user.type(screen.getByLabelText('Invitation Code'), 'TEST123');
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), '123');
      await user.type(screen.getByLabelText('Confirm Password'), '123');

      const registerButton = screen.getByRole('button', { name: /join organization/i });
      await user.click(registerButton);

      // Should show error for short password
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during login', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Fill out login form
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/logging in/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during registration', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Navigate to registration form
      const createAccountTab = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountTab);

      const joinOrgOption = screen.getByText('Join Organization');
      await user.click(joinOrgOption);

      // Fill out registration form
      await user.type(screen.getByLabelText('Invitation Code'), 'TEST123');
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.type(screen.getByLabelText('Confirm Password'), 'password123');

      const registerButton = screen.getByRole('button', { name: /join organization/i });
      await user.click(registerButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/registering/i)).toBeInTheDocument();
      });
    });
  });
});
