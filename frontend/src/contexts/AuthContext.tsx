import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../services/authService';
import toast from 'react-hot-toast';

// Auth Context Types
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, adminLogin?: boolean) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId?: number;
    invitationCode?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  hasRole: (role: string) => boolean;
  isPlatformOwner: () => boolean;
  isOrganizationAdmin: () => boolean;
  isMember: () => boolean;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token: storedToken, user: storedUser } = authService.getAuthData();
        
        if (storedToken && storedUser) {
          // In offline mode, use stored data without verification
          if (process.env.REACT_APP_OFFLINE_MODE === 'true') {
            console.log('Offline mode: Using stored auth data');
            setToken(storedToken);
            setUser(storedUser);
          } else {
            // Verify token is still valid
            try {
              const response = await authService.verifyToken();
              if (response.success && response.data) {
                setToken(storedToken);
                setUser(response.data.user);
              } else {
                // Token is invalid, clear auth data
                authService.clearAuthData();
              }
            } catch (error) {
              // If backend is not available, use stored data but mark as potentially stale
              console.warn('Backend not available, using stored auth data');
              setToken(storedToken);
              setUser(storedUser);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, adminLogin: boolean = false): Promise<boolean> => {
    try {
      console.log('🔐 [AUTH CONTEXT] Login called with:', { email, adminLogin });
      setIsLoading(true);
      
      console.log('🔐 [AUTH CONTEXT] Calling authService.login...');
      const response = await authService.login({ email, password, adminLogin });
      console.log('🔐 [AUTH CONTEXT] Response received:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });
      
      if (response.success && response.data) {
        const { token: newToken, user: userData, refreshToken } = response.data;
        console.log('🔐 [AUTH CONTEXT] Login successful, storing auth data');
        console.log('🔐 [AUTH CONTEXT] User data:', {
          id: userData.id,
          email: userData.email,
          role: userData.role
        });
        
        // Store auth data
        authService.setAuthData(newToken, userData, refreshToken);
        setToken(newToken);
        setUser(userData);
        
        toast.success('Login successful!');
        return true;
      }
      
      console.error('❌ [AUTH CONTEXT] Login failed - response not successful or no data');
      return false;
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Login error:', error);
      console.error('❌ [AUTH CONTEXT] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId?: number;
    invitationCode?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      
      if (response.success) {
        toast.success('Registration successful! Please login.');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data regardless of API call success
      authService.clearAuthData();
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const { refreshToken: storedRefreshToken } = authService.getAuthData();
      
      if (!storedRefreshToken) {
        return false;
      }

      const response = await authService.refreshToken(storedRefreshToken);
      
      if (response.success && response.data) {
        const { token: newToken } = response.data;
        
        // Update token in localStorage and state
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      return false;
    }
  };

  // Update user function
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Role checking functions
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const isPlatformOwner = (): boolean => {
    return hasRole('platform_owner');
  };

  const isOrganizationAdmin = (): boolean => {
    return hasRole('organization_admin');
  };

  const isMember = (): boolean => {
    return hasRole('member');
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    hasRole,
    isPlatformOwner,
    isOrganizationAdmin,
    isMember,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
