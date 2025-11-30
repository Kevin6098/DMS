import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading, isPlatformOwner, isOrganizationAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated (but only after loading is complete)
  useEffect(() => {
    // Only redirect if we're sure the user is authenticated and not loading
      if (!isLoading && isAuthenticated) {
        // Check if user is admin (platform owner or organization admin)
        if (isPlatformOwner() || isOrganizationAdmin()) {
          console.log('User is authenticated admin, redirecting to admin panel');
          navigate('/admin', { replace: true });
        } else {
          console.log('User is authenticated, redirecting to dashboard');
          navigate('/dashboard/my-drive', { replace: true });
        }
      }
  }, [isAuthenticated, isLoading, navigate, isPlatformOwner, isOrganizationAdmin]);

  const showTab = (tab: string, event?: React.MouseEvent) => {
    if (event) event.preventDefault();
    setActiveTab(tab);
  };

  const selectOption = (option: string) => {
    if (option === 'member') {
      setActiveTab('register');
    } else if (option === 'admin') {
      setActiveTab('admin');
    }
  };

  const goBackToOptions = () => {
    setActiveTab('create-account-options');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
      const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
      
      console.log('🔐 [LOGIN] Starting login process...');
      console.log('🔐 [LOGIN] Email:', email);
      console.log('🔐 [LOGIN] Password provided:', password ? '***' : 'MISSING');
      
      if (!email || !password) {
        console.error('❌ [LOGIN] Missing email or password');
        toast.error('Please fill in all fields');
        return;
      }

      console.log('🔐 [LOGIN] Calling login function...');
      const success = await login(email, password);
      console.log('🔐 [LOGIN] Login result:', success);
      
      if (success) {
        console.log('✅ [LOGIN] Login successful, navigating to dashboard');
        navigate('/dashboard/my-drive');
      } else {
        console.error('❌ [LOGIN] Login failed');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Login error:', error);
      console.error('❌ [LOGIN] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const email = (document.getElementById('admin-email') as HTMLInputElement)?.value;
      const password = (document.getElementById('admin-password') as HTMLInputElement)?.value;
      
      console.log('🔐 [ADMIN LOGIN] Starting admin login process...');
      console.log('🔐 [ADMIN LOGIN] Email:', email);
      console.log('🔐 [ADMIN LOGIN] Password provided:', password ? '***' : 'MISSING');
      
      if (!email || !password) {
        console.error('❌ [ADMIN LOGIN] Missing email or password');
        toast.error('Please fill in all fields');
        return;
      }

      console.log('🔐 [ADMIN LOGIN] Calling login function with admin flag...');
      const success = await login(email, password, true);
      console.log('🔐 [ADMIN LOGIN] Login result:', success);
      
      if (success) {
        console.log('✅ [ADMIN LOGIN] Login successful, navigating to admin panel');
        navigate('/admin');
      } else {
        console.error('❌ [ADMIN LOGIN] Login failed');
      }
    } catch (error) {
      console.error('❌ [ADMIN LOGIN] Admin login error:', error);
      console.error('❌ [ADMIN LOGIN] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const invitationCode = (document.getElementById('invitation-code') as HTMLInputElement)?.value;
      const firstName = (document.getElementById('register-firstname') as HTMLInputElement)?.value;
      const lastName = (document.getElementById('register-lastname') as HTMLInputElement)?.value;
      const email = (document.getElementById('register-email') as HTMLInputElement)?.value;
      const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
      const confirmPassword = (document.getElementById('register-confirm') as HTMLInputElement)?.value;
      
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        toast.error('Please fill in all fields');
        return;
      }
      
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (!password || password.trim() === '') {
        toast.error('Password is required');
        return;
      }

      if (!invitationCode || invitationCode.trim() === '') {
        toast.error('Invitation code is required');
        return;
      }

      const success = await register({
        firstName,
        lastName,
        email,
        password,
        invitationCode: invitationCode.trim() || undefined,
      });

      if (success) {
        setActiveTab('login');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo-vertical-white.png" alt="Task Insight" className="auth-logo" />
        </div>
        
        <div className="auth-tabs">
          <button 
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} 
            onClick={(e) => showTab('login', e)}
          >
            Login
          </button>
          <button 
            className={`tab-btn ${activeTab === 'create-account-options' ? 'active' : ''}`} 
            onClick={(e) => showTab('create-account-options', e)}
          >
            Create Account
          </button>
        </div>
        
        {/* Login Form */}
        <div id="login-form" className={`auth-form ${activeTab === 'login' ? 'active' : ''}`}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input 
                type="email" 
                id="login-email" 
                required 
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input 
                type="password" 
                id="login-password" 
                required 
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        
        {/* Create Account Options */}
        <div id="create-account-options" className={`auth-form create-account-options ${activeTab === 'create-account-options' ? 'active' : ''}`}>
          <div className="options-header">
            <h3>How would you like to create your account?</h3>
            <p>Choose the option that applies to your situation</p>
          </div>
          
          <div className="options-container">
            <div className="option-card" onClick={() => selectOption('member')}>
              <div className="option-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="option-content">
                <h4>Join Organization</h4>
                <p>I have an invitation code from my organization admin</p>
                <div className="option-features">
                  <span className="feature-tag">Invitation Required</span>
                  <span className="feature-tag">Team Member</span>
                </div>
              </div>
            </div>
            
            <div className="option-card" onClick={() => selectOption('admin')}>
              <div className="option-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="option-content">
                <h4>Task Insight Admin</h4>
                <p>I am a Task Insight administrator and want to manage organizations</p>
                <div className="option-features">
                  <span className="feature-tag">Admin Only</span>
                  <span className="feature-tag">Full Control</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Register Form */}
        <div id="register-form" className={`auth-form ${activeTab === 'register' ? 'active' : ''}`}>
          <div className="form-header">
            <button className="back-btn" onClick={goBackToOptions}>
              <i className="fas fa-arrow-left"></i>
              Back to options
            </button>
            <h3>Join Organization</h3>
          </div>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="invitation-code">Invitation Code</label>
              <input type="text" id="invitation-code" placeholder="Enter invitation code" required />
              <small className="form-help">Ask your organization admin for an invitation code</small>
            </div>
            <div className="form-group">
              <label htmlFor="register-firstname">First Name</label>
              <input 
                type="text" 
                id="register-firstname" 
                required 
                placeholder="Enter your first name"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-lastname">Last Name</label>
              <input 
                type="text" 
                id="register-lastname" 
                required 
                placeholder="Enter your last name"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Email</label>
              <input 
                type="email" 
                id="register-email" 
                required 
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input 
                type="password" 
                id="register-password" 
                required 
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-confirm">Confirm Password</label>
              <input 
                type="password" 
                id="register-confirm" 
                required 
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Registering...
                </>
              ) : (
                'Join Organization'
              )}
            </button>
          </form>
        </div>
        
        {/* Admin Form */}
        <div id="admin-form" className={`auth-form ${activeTab === 'admin' ? 'active' : ''}`}>
          <div className="form-header">
            <button className="back-btn" onClick={goBackToOptions}>
              <i className="fas fa-arrow-left"></i>
              Back to options
            </button>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-shield-alt" style={{ color: '#141464' }}></i>
              Task Insight Admin Access
            </h3>
          </div>
          <div style={{ background: '#e0e0f0', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #141464' }}>
            <p style={{ fontSize: '13px', color: '#5f6368', margin: 0 }}>
              <strong style={{ color: '#141464' }}>Admin Only:</strong> Only Task Insight administrators can create organizations. 
              Please sign in with your admin credentials to access the Task Insight management panel.
            </p>
          </div>
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input 
                type="email" 
                id="admin-email" 
                required 
                placeholder="Enter admin email"
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Admin Password</label>
              <input 
                type="password" 
                id="admin-password" 
                required 
                placeholder="Enter admin password"
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In to Task Insight Admin
                </>
              )}
            </button>
          </form>
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#5f6368' }}>
            <p style={{ margin: 0 }}>Don't have admin access? Contact your Task Insight administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
