// Authentication JavaScript

function showTab(tabName, event) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected form
    document.getElementById(tabName + '-form').classList.add('active');
    
    // Add active class to selected tab
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

function showCreateAccountOptions(event) {
    console.log('showCreateAccountOptions called'); // Debug log
    
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show create account options
    const createAccountOptions = document.getElementById('create-account-options');
    console.log('create-account-options element:', createAccountOptions); // Debug log
    if (createAccountOptions) {
        createAccountOptions.classList.add('active');
        console.log('Added active class to create-account-options'); // Debug log
    }
    
    // Add active class to create account tab
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find the button by onclick attribute
        const createAccountBtn = document.querySelector('button[onclick*="showCreateAccountOptions"]');
        if (createAccountBtn) {
            createAccountBtn.classList.add('active');
        }
    }
}

function selectOption(optionType) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    if (optionType === 'member') {
        document.getElementById('register-form').classList.add('active');
    } else if (optionType === 'admin') {
        document.getElementById('admin-form').classList.add('active');
    }
}

function goBackToOptions() {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show create account options
    document.getElementById('create-account-options').classList.add('active');
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Clear loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        // For demo purposes, accept any valid email format
        if (email && password) {
            // Store user session
            sessionStorage.setItem('user', JSON.stringify({
                email: email,
                name: email.split('@')[0],
                loginTime: new Date().toISOString()
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError('Please enter valid credentials');
        }
    }, 1500);
}

function handleRegister(event) {
    event.preventDefault();
    
    const invitationCode = document.getElementById('invitation-code').value;
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Validate invitation code
    if (!validateInvitationCode(invitationCode)) {
        showError('Invalid invitation code. Please check with your admin.');
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Clear loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        
        // For demo purposes, accept any valid input
        if (name && email && password && invitationCode) {
            const orgData = getOrganizationByInviteCode(invitationCode);
            
            // Store user session
            sessionStorage.setItem('user', JSON.stringify({
                email: email,
                name: name,
                organizationId: orgData.id,
                organizationName: orgData.name,
                role: 'member',
                loginTime: new Date().toISOString()
            }));
            
            // Mark invitation as used
            markInvitationAsUsed(invitationCode, email);
            
            // Show success message
            showSuccess('Account created successfully! Redirecting...');
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showError('Please fill in all fields');
        }
    }, 1500);
}

function handleAdminLoginClick() {
    console.log('Admin login button clicked');
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitBtn = document.querySelector('#admin-login-form button');
    
    console.log('Email:', email, 'Password:', password);
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        console.log('Timeout completed, checking credentials');
        // For demo, accept any credentials
        if (email && password) {
            console.log('Credentials valid, storing session and redirecting');
            // Store admin session
            sessionStorage.setItem('adminUser', JSON.stringify({
                email: email,
                name: 'Platform Owner',
                role: 'platform_owner',
                loginTime: new Date().toISOString()
            }));
            
            console.log('Session stored, redirecting to admin-panel.html');
            // Redirect to admin panel
            window.location.href = 'admin-panel.html';
        } else {
            console.log('Invalid credentials');
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Admin Panel';
            submitBtn.disabled = false;
            showError('Please enter valid credentials');
        }
    }, 1000);
}

function showError(message) {
    // Remove existing messages
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.remove();
    });
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert after the form
    const activeForm = document.querySelector('.auth-form.active');
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    // Remove existing messages
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.remove();
    });
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert after the form
    const activeForm = document.querySelector('.auth-form.active');
    activeForm.insertBefore(successDiv, activeForm.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Helper functions for invitation codes and organizations
function generateInvitationCodes(orgId, count) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = orgId.substring(0, 4).toUpperCase() + '-' + 
                    Math.random().toString(36).substr(2, 6).toUpperCase();
        codes.push(code);
    }
    return codes;
}

function validateInvitationCode(code) {
    // Check if code exists in any organization
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('organization_')) {
            const orgData = JSON.parse(localStorage.getItem(key));
            if (orgData.invitationCodes && orgData.invitationCodes.includes(code)) {
                return true;
            }
        }
    }
    return false;
}

function getOrganizationByInviteCode(code) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('organization_')) {
            const orgData = JSON.parse(localStorage.getItem(key));
            if (orgData.invitationCodes && orgData.invitationCodes.includes(code)) {
                return {
                    id: orgData.id,
                    name: orgData.name
                };
            }
        }
    }
    return null;
}

function markInvitationAsUsed(code, email) {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('organization_')) {
            const orgData = JSON.parse(localStorage.getItem(key));
            if (orgData.invitationCodes && orgData.invitationCodes.includes(code)) {
                // Remove the used invitation code
                orgData.invitationCodes = orgData.invitationCodes.filter(c => c !== code);
                localStorage.setItem(key, JSON.stringify(orgData));
                break;
            }
        }
    }
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const user = sessionStorage.getItem('user');
    if (user) {
        window.location.href = 'dashboard.html';
    }
});
