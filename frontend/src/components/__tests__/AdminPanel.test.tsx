import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AdminPanel from '../AdminPanel';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API services
jest.mock('../../services/adminService', () => ({
  adminService: {
    getDashboardStats: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        totalUsers: 150,
        totalOrganizations: 25,
        totalFiles: 5000,
        totalStorage: 10737418240, // 10 GB
        activeUsers: 120,
        newUsersThisMonth: 15,
      },
    })),
    getRecentActivity: jest.fn(() => Promise.resolve({
      success: true,
      data: [
        {
          id: 1,
          action: 'User registered',
          description: 'John Doe registered',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ],
    })),
    getSystemHealth: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        status: 'healthy',
        uptime: 99.9,
        lastCheck: '2024-01-01T00:00:00.000Z',
      },
    })),
  },
}));

jest.mock('../../services/organizationService', () => ({
  organizationService: {
    getOrganizations: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        data: [
          {
            id: 1,
            organizationName: 'Test Organization',
            contactEmail: 'test@org.com',
            status: 'active',
            storageQuota: 10737418240,
            currentStorage: 5368709120,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      },
    })),
  },
}));

jest.mock('../../services/userService', () => ({
  userService: {
    getUsers: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        data: [
          {
            id: 1,
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'member',
            status: 'active',
            organizationName: 'Test Organization',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      },
    })),
  },
}));

jest.mock('../../services/authService', () => ({
  authService: {
    getAuthData: jest.fn(() => ({
      token: 'mock-token',
      user: {
        id: 1,
        email: 'admin@taskinsight.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'platform_owner',
      },
    })),
    clearAuthData: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin' }),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    promise: jest.fn((promise) => promise),
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

describe('AdminPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin panel with statistics', async () => {
    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total users
      expect(screen.getByText('25')).toBeInTheDocument(); // Total organizations
      expect(screen.getByText('5,000')).toBeInTheDocument(); // Total files
    });
  });

  it('displays admin user information', async () => {
    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('navigates to organizations view', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const organizationsLink = screen.getByText('Organizations');
    await user.click(organizationsLink);

    await waitFor(() => {
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });
  });

  it('navigates to users view', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const usersLink = screen.getByText('Users');
    await user.click(usersLink);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('displays system health status', async () => {
    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/healthy/i)).toBeInTheDocument();
    });
  });

  it('shows recent activity', async () => {
    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('User registered')).toBeInTheDocument();
      expect(screen.getByText('John Doe registered')).toBeInTheDocument();
    });
  });

  it('handles admin logout', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AdminPanel />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // Click user menu
    const userMenu = screen.getByText('AU'); // Admin User initials
    await user.click(userMenu);

    // Click sign out
    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});

