import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API service
jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getAuthData: jest.fn(() => ({ token: null, user: null, refreshToken: null })),
    clearAuthData: jest.fn(),
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
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    expect(screen.getByText('Task Insight')).toBeInTheDocument();
    expect(screen.getByText('Document Management System')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('switches to create account options when clicking create account tab', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const createAccountTab = screen.getByRole('button', { name: /create account/i });
    await user.click(createAccountTab);

    expect(screen.getByText('How would you like to create your account?')).toBeInTheDocument();
    expect(screen.getByText('Join Organization')).toBeInTheDocument();
    expect(screen.getByText('Task Insight Admin')).toBeInTheDocument();
  });

  it('shows registration form when selecting join organization option', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Navigate to create account options
    const createAccountTab = screen.getByRole('button', { name: /create account/i });
    await user.click(createAccountTab);

    // Select join organization option
    const joinOrgOption = screen.getByText('Join Organization');
    await user.click(joinOrgOption);

    expect(screen.getByText('Join Organization')).toBeInTheDocument();
    expect(screen.getByLabelText('Invitation Code')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows admin form when selecting admin option', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Navigate to create account options
    const createAccountTab = screen.getByRole('button', { name: /create account/i });
    await user.click(createAccountTab);

    // Select admin option
    const adminOption = screen.getByText('Task Insight Admin');
    await user.click(adminOption);

    expect(screen.getByText('Task Insight Admin Access')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Password')).toBeInTheDocument();
  });

  it('validates required fields in login form', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(loginButton);

    // Check that required validation is triggered
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('allows navigation back from registration form', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Navigate to registration form
    const createAccountTab = screen.getByRole('button', { name: /create account/i });
    await user.click(createAccountTab);

    const joinOrgOption = screen.getByText('Join Organization');
    await user.click(joinOrgOption);

    // Click back button
    const backButton = screen.getByRole('button', { name: /back to options/i });
    await user.click(backButton);

    expect(screen.getByText('How would you like to create your account?')).toBeInTheDocument();
  });

  it('validates password confirmation in registration form', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    // Navigate to registration form
    const createAccountTab = screen.getByRole('button', { name: /create account/i });
    await user.click(createAccountTab);

    const joinOrgOption = screen.getByText('Join Organization');
    await user.click(joinOrgOption);

    // Fill out form with mismatched passwords
    await user.type(screen.getByLabelText('Invitation Code'), 'TEST123');
    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'different123');

    const registerButton = screen.getByRole('button', { name: /join organization/i });
    await user.click(registerButton);

    // Should show error for password mismatch
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Login />
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
});
