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
            setIsLoading(false);
            return;
          }
          
          // Verify token is still valid
          try {
            const response = await authService.verifyToken();
            if (response.success && response.data) {
              setToken(storedToken);
              setUser(response.data.user);
            } else {
              // Token is invalid, clear auth data
              console.log('Token verification failed, clearing auth data');
              authService.clearAuthData();
              setToken(null);
              setUser(null);
            }
          } catch (error: any) {
            // If backend is not available or verification fails, clear auth data to prevent loops
            console.warn('Token verification error:', error?.message || error);
            console.warn('Clearing auth data to prevent redirect loops');
            authService.clearAuthData();
            setToken(null);
            setUser(null);
          }
        } else {
          // No stored auth data
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.clearAuthData();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string, adminLogin: boolean = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password, adminLogin });
      
      if (response.success && response.data) {
        const { token: newToken, user: userData, refreshToken } = response.data;
        
        // Store auth data
        authService.setAuthData(newToken, userData, refreshToken);
        setToken(newToken);
        setUser(userData);
        
        toast.success('Login successful!');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
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
