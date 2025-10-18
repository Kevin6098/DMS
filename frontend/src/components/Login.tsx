import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const showTab = (tab: string, event?: React.MouseEvent) => {
    if (event) event.preventDefault();
    setActiveTab(tab);
    setSelectedOption(null);
  };

  const selectOption = (option: string) => {
    setSelectedOption(option);
    if (option === 'member') {
      setActiveTab('register');
    } else if (option === 'admin') {
      setActiveTab('admin');
    }
  };

  const goBackToOptions = () => {
    setActiveTab('create-account-options');
    setSelectedOption(null);
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
    
    if (email && password) {
      // Simulate login
      localStorage.setItem('user', JSON.stringify({ email, name: 'John Doe', role: 'member' }));
      toast.success('Login successful!');
      navigate('/dashboard');
    }
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    const invitationCode = (document.getElementById('invitation-code') as HTMLInputElement)?.value;
    const name = (document.getElementById('register-name') as HTMLInputElement)?.value;
    const email = (document.getElementById('register-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
    const confirmPassword = (document.getElementById('register-confirm') as HTMLInputElement)?.value;
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (invitationCode && name && email && password) {
      // Simulate registration
      localStorage.setItem('user', JSON.stringify({ email, name, role: 'member' }));
      toast.success('Registration successful!');
      navigate('/dashboard');
    }
  };

  const handleAdminLogin = () => {
    const email = (document.getElementById('admin-email') as HTMLInputElement)?.value;
    const password = (document.getElementById('admin-password') as HTMLInputElement)?.value;
    
    if (email && password) {
      // Simulate admin login
      localStorage.setItem('adminUser', JSON.stringify({ email, name: 'Platform Owner', role: 'admin' }));
      toast.success('Admin login successful!');
      navigate('/admin');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <i className="fas fa-folder-open"></i>
          <h1>Task Insight</h1>
          <p>Document Management System</p>
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
              <input type="email" id="login-email" required />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input type="password" id="login-password" required />
            </div>
            <button type="submit" className="btn-primary">Sign In</button>
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
              <label htmlFor="register-name">Full Name</label>
              <input type="text" id="register-name" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Email</label>
              <input type="email" id="register-email" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input type="password" id="register-password" required />
            </div>
            <div className="form-group">
              <label htmlFor="register-confirm">Confirm Password</label>
              <input type="password" id="register-confirm" required />
            </div>
            <button type="submit" className="btn-primary">Join Organization</button>
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
              <i className="fas fa-shield-alt" style={{ color: '#ff6b35' }}></i>
              Task Insight Admin Access
            </h3>
          </div>
          <div style={{ background: '#fff3f0', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #ff6b35' }}>
            <p style={{ fontSize: '13px', color: '#5f6368', margin: 0 }}>
              <strong style={{ color: '#ff6b35' }}>Admin Only:</strong> Only Task Insight administrators can create organizations. 
              Please sign in with your admin credentials to access the Task Insight management panel.
            </p>
          </div>
          <form id="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input type="email" id="admin-email" defaultValue="owner@taskinsight.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="admin-password">Admin Password</label>
              <input type="password" id="admin-password" defaultValue="admin123" required />
            </div>
            <button type="button" className="btn-primary" onClick={handleAdminLogin}>
              <i className="fas fa-sign-in-alt"></i>
              Sign In to Task Insight Admin
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
