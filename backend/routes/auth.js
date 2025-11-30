const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');

const router = express.Router();

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, organizationId, invitationCode } = req.body;

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.success && existingUser.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate invitation code if provided
    let orgId = organizationId;
    if (invitationCode) {
      const invitationResult = await executeQuery(
        'SELECT * FROM invitations WHERE code = ? AND status = "active" AND (expires_at IS NULL OR expires_at > NOW())',
        [invitationCode]
      );

      if (!invitationResult.success || invitationResult.data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired invitation code'
        });
      }

      orgId = invitationResult.data[0].organization_id;
    }

    // Ensure organization ID is set
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID or invitation code is required'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await executeQuery(
      'INSERT INTO users (email, password_hash, first_name, last_name, organization_id, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, orgId, 'member', 'active']
    );

    if (!userResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    // Mark invitation as used (after user is created so we can set used_by)
    if (invitationCode) {
      await executeQuery(
        'UPDATE invitations SET status = "used", used_at = NOW(), used_by = ? WHERE code = ?',
        [userResult.data.insertId, invitationCode]
      );
    }

    // Log user creation
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [userResult.data.insertId, orgId, 'CREATE', 'USER', userResult.data.insertId, JSON.stringify({ email, organizationId: orgId })]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: userResult.data.insertId,
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password, adminLogin } = req.body;

    // Find user
    const userResult = await executeQuery(
      'SELECT u.*, o.name as organization_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.email = ?',
      [email]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.data[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check admin login requirement
    if (adminLogin && !['organization_admin', 'platform_owner'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Generate JWT tokens
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        organizationId: user.organization_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Log login
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.organization_id, 'LOGIN', 'USER', user.id, JSON.stringify({ email, adminLogin: !!adminLogin })]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organizationId: user.organization_id,
          organizationName: user.organization_name,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const userResult = await executeQuery(
      'SELECT id, email, role, organization_id, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const user = userResult.data[0];

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        organizationId: user.organization_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout user
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Log logout
    await executeQuery(
      'INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.user.organization_id, 'LOGOUT', 'USER', req.user.id, JSON.stringify({ email: req.user.email })]
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userResult = await executeQuery(
      'SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status, u.created_at, u.last_login, o.name as organization_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = ?',
      [req.user.id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: userResult.data[0]
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
});


module.exports = router;
