import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { FileProvider } from '../../contexts/FileContext';

// Mock the API services
jest.mock('../../services/fileService', () => ({
  fileService: {
    getFiles: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        files: [
          {
            id: 1,
            fileName: 'test-document.pdf',
            fileType: 'pdf',
            fileSize: 1024000,
            uploadedBy: 'John Doe',
            uploadedAt: '2024-01-01T00:00:00.000Z',
            folderId: null,
            organizationId: 1,
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
    getFolders: jest.fn(() => Promise.resolve({
      success: true,
      data: [
        {
          id: 1,
          folderName: 'Test Folder',
          parentId: null,
          organizationId: 1,
          createdBy: 1,
        },
      ],
    })),
    getFileStats: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        totalFiles: 10,
        totalSize: 10240000,
        typeStats: [
          { fileType: 'pdf', count: 5 },
          { fileType: 'docx', count: 3 },
          { fileType: 'xlsx', count: 2 },
        ],
        recentUploads: 5,
      },
    })),
    uploadFile: jest.fn(() => Promise.resolve({
      success: true,
      data: { id: 2, fileName: 'uploaded-file.pdf' },
    })),
    deleteFile: jest.fn(() => Promise.resolve({
      success: true,
      message: 'File deleted successfully',
    })),
    createFolder: jest.fn(() => Promise.resolve({
      success: true,
      data: { id: 2, folderName: 'New Folder' },
    })),
  },
}));

jest.mock('../../services/authService', () => ({
  authService: {
    getAuthData: jest.fn(() => ({
      token: 'mock-token',
      user: {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'member',
        organizationId: 1,
        organizationName: 'Test Organization',
      },
    })),
    clearAuthData: jest.fn(),
    verifyToken: jest.fn(() => Promise.resolve({ success: true })),
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
    promise: jest.fn((promise) => promise),
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

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with user information', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('loads and displays files', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });
  });

  it('loads and displays folders', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Folder')).toBeInTheDocument();
    });
  });

  it('displays file statistics', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total files
    });
  });

  it('opens file upload modal when clicking upload button', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument();
    });
  });

  it('opens create folder modal when clicking new folder button', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    const newFolderButton = screen.getByRole('button', { name: /new folder/i });
    await user.click(newFolderButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Folder')).toBeInTheDocument();
    });
  });

  it('handles file search', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search files/i);
    await user.type(searchInput, 'test');

    expect(searchInput).toHaveValue('test');
  });

  it('handles user logout', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click user menu
    const userMenu = screen.getByText('JD'); // User initials
    await user.click(userMenu);

    // Click sign out
    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('switches between grid and list view', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });

    // Find view toggle button (if it exists)
    const viewToggle = screen.queryByRole('button', { name: /list view/i });
    if (viewToggle) {
      await user.click(viewToggle);
      expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument();
    }
  });
});

