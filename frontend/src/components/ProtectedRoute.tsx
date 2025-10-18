import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Protected Route Props
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

// Protected Route Component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, isPlatformOwner, isOrganizationAdmin } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin access if required
  if (requireAdmin && !isPlatformOwner() && !isOrganizationAdmin()) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <i className="fas fa-lock"></i>
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
