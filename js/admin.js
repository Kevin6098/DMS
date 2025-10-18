// Admin Panel JavaScript

// User Management Functions
function showAddUserModal() {
    document.getElementById('add-user-modal').classList.add('active');
}

function hideAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('active');
    document.getElementById('add-user-form').reset();
}

function showEditUserModal() {
    document.getElementById('edit-user-modal').classList.add('active');
}

function hideEditUserModal() {
    document.getElementById('edit-user-modal').classList.remove('active');
}

function showViewUserModal() {
    document.getElementById('view-user-modal').classList.add('active');
}

function hideViewUserModal() {
    document.getElementById('view-user-modal').classList.remove('active');
}

// User CRUD Operations
function createUser() {
    const name = document.getElementById('user-name').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-password').value;
    const confirmPassword = document.getElementById('user-confirm-password').value;
    const organization = document.getElementById('user-organization').value;
    const role = document.getElementById('user-role').value;
    const isActive = document.getElementById('user-active').checked;
    const sendEmail = document.getElementById('user-send-email').checked;

    // Validation
    if (!name || !email || !password || !organization || !role) {
        alert('Please fill in all required fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Simulate API call
    console.log('Creating user:', {
        name, email, organization, role, isActive, sendEmail
    });

    // Show success message
    alert(`User "${name}" created successfully!`);
    
    // Close modal and refresh table
    hideAddUserModal();
    // In real app, would refresh the user table here
}

function editUser(userId) {
    console.log('Editing user:', userId);
    showEditUserModal();
}

function editUserFromView() {
    hideViewUserModal();
    showEditUserModal();
}

function updateUser() {
    const name = document.getElementById('edit-user-name').value;
    const email = document.getElementById('edit-user-email').value;
    const organization = document.getElementById('edit-user-organization').value;
    const role = document.getElementById('edit-user-role').value;
    const isActive = document.getElementById('edit-user-active').checked;
    const newPassword = document.getElementById('edit-user-password').value;

    // Validation
    if (!name || !email || !organization || !role) {
        alert('Please fill in all required fields');
        return;
    }

    // Simulate API call
    console.log('Updating user:', {
        name, email, organization, role, isActive, newPassword
    });

    // Show success message
    alert(`User "${name}" updated successfully!`);
    
    // Close modal and refresh table
    hideEditUserModal();
    // In real app, would refresh the user table here
}

function viewUser(userId) {
    console.log('Viewing user:', userId);
    showViewUserModal();
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        // Simulate API call
        console.log('Deleting user:', userId);
        
        // Show success message
        alert('User deleted successfully!');
        
        // In real app, would remove the row from the table here
    }
}

// Export Users
function exportUsers() {
    console.log('Exporting users...');
    alert('Users exported to CSV successfully!');
    // In real app, would trigger CSV download
}

// Select All Checkbox
document.addEventListener('DOMContentLoaded', function() {
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateBulkActionsBar();
        });
    }

    // Individual checkbox listeners
    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckbox();
            updateBulkActionsBar();
        });
    });
});

function updateSelectAllCheckbox() {
    const selectAll = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
    
    selectAll.checked = checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

function updateBulkActionsBar() {
    const checkedCount = document.querySelectorAll('.user-checkbox:checked').length;
    console.log(`${checkedCount} users selected`);
    // In real app, would show/hide bulk actions bar here
}

// Filter Changes
document.addEventListener('DOMContentLoaded', function() {
    const orgFilter = document.getElementById('org-filter');
    const roleFilter = document.getElementById('role-filter');
    const statusFilter = document.getElementById('status-filter');

    if (orgFilter) {
        orgFilter.addEventListener('change', function() {
            console.log('Organization filter changed:', this.value);
            // In real app, would filter table here
        });
    }

    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            console.log('Role filter changed:', this.value);
            // In real app, would filter table here
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            console.log('Status filter changed:', this.value);
            // In real app, would filter table here
        });
    }
});

// Search Functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                console.log('Searching for:', this.value);
                // In real app, would filter table based on search
            }, 300);
        });
    }
});

// View Navigation
function showView(viewName) {
    console.log('Switching to view:', viewName);
    
    // Update active nav item
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    event.target.closest('.nav-item').classList.add('active');
    
    // In real app, would load different content based on view
    // For now, just show an alert for non-users views
    if (viewName !== 'users') {
        alert(`${viewName.charAt(0).toUpperCase() + viewName.slice(1)} view - Coming soon!`);
    }
}

// Toggle User Menu
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.getElementById('user-dropdown');
    
    if (dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Admin Logout
function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    }
}

// Organization Management Functions
function showAddOrganizationModal() {
    document.getElementById('add-organization-modal').classList.add('active');
}

function hideAddOrganizationModal() {
    document.getElementById('add-organization-modal').classList.remove('active');
    document.getElementById('add-organization-form').reset();
}

function showEditOrganizationModal() {
    document.getElementById('edit-organization-modal').classList.add('active');
}

function hideEditOrganizationModal() {
    document.getElementById('edit-organization-modal').classList.remove('active');
}

function showViewOrganizationModal() {
    document.getElementById('view-organization-modal').classList.add('active');
}

function hideViewOrganizationModal() {
    document.getElementById('view-organization-modal').classList.remove('active');
}

function editOrganizationFromView() {
    hideViewOrganizationModal();
    showEditOrganizationModal();
}

function createOrganization() {
    const orgName = document.getElementById('org-name').value;
    const orgDomain = document.getElementById('org-domain').value;
    const adminName = document.getElementById('admin-name').value;
    const adminEmail = document.getElementById('admin-email').value;
    const adminPassword = document.getElementById('admin-password').value;
    const adminConfirmPassword = document.getElementById('admin-confirm-password').value;
    const storageQuota = document.getElementById('storage-quota').value;
    const maxUsers = document.getElementById('max-users').value;
    const orgDescription = document.getElementById('org-description').value;
    const isActive = document.getElementById('org-active').checked;
    const sendWelcomeEmail = document.getElementById('send-welcome-email').checked;

    // Validation
    if (!orgName || !adminName || !adminEmail || !adminPassword || !storageQuota) {
        alert('Please fill in all required fields');
        return;
    }

    if (adminPassword !== adminConfirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Simulate API call
    console.log('Creating organization:', {
        orgName, orgDomain, adminName, adminEmail, storageQuota, maxUsers, orgDescription, isActive, sendWelcomeEmail
    });

    // Show success message
    alert(`Organization "${orgName}" created successfully!`);
    
    // Close modal and refresh table
    hideAddOrganizationModal();
    // In real app, would refresh the organization table here
}

function updateOrganization() {
    const orgName = document.getElementById('edit-org-name').value;
    const orgDomain = document.getElementById('edit-org-domain').value;
    const storageQuota = document.getElementById('edit-storage-quota').value;
    const maxUsers = document.getElementById('edit-max-users').value;
    const orgDescription = document.getElementById('edit-org-description').value;
    const isActive = document.getElementById('edit-org-active').checked;

    // Validation
    if (!orgName || !storageQuota) {
        alert('Please fill in all required fields');
        return;
    }

    // Simulate API call
    console.log('Updating organization:', {
        orgName, orgDomain, storageQuota, maxUsers, orgDescription, isActive
    });

    // Show success message
    alert(`Organization "${orgName}" updated successfully!`);
    
    // Close modal and refresh table
    hideEditOrganizationModal();
    // In real app, would refresh the organization table here
}

function editOrganization(id) {
    console.log('Editing organization:', id);
    showEditOrganizationModal();
}

function viewOrganization(id) {
    console.log('Viewing organization:', id);
    showViewOrganizationModal();
}

function deleteOrganization(id) {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
        // Simulate API call
        console.log('Deleting organization:', id);
        
        // Show success message
        alert('Organization deleted successfully!');
        
        // In real app, would remove the row from the table here
    }
}

function exportOrganizations() {
    console.log('Exporting organizations...');
    alert('Organizations exported to CSV successfully!');
    // In real app, would trigger CSV download
}

// Invitation Management Functions
function showGenerateInvitationsModal() {
    document.getElementById('generate-invitations-modal').classList.add('active');
}

function hideGenerateInvitationsModal() {
    document.getElementById('generate-invitations-modal').classList.remove('active');
    document.getElementById('generate-invitations-form').reset();
}

function generateInvitationCodes() {
    const organization = document.getElementById('invitation-org').value;
    const count = document.getElementById('invitation-count').value;
    const expiry = document.getElementById('invitation-expiry').value;
    const purpose = document.getElementById('invitation-purpose').value;

    // Validation
    if (!organization || !count) {
        alert('Please fill in all required fields');
        return;
    }

    // Simulate API call
    console.log('Generating invitation codes:', {
        organization, count, expiry, purpose
    });

    // Show success message with generated codes
    const codes = ['ORG-ABC123', 'ORG-DEF456', 'ORG-GHI789', 'ORG-JKL012', 'ORG-MNO345'];
    alert(`Generated ${count} invitation codes:\n${codes.slice(0, count).join('\n')}`);
    
    // Close modal
    hideGenerateInvitationsModal();
    // In real app, would refresh the invitations table here
}

function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`Copied code: ${code}`);
    }).catch(() => {
        alert(`Code: ${code}`);
    });
}

function revokeInvitation(id) {
    if (confirm('Are you sure you want to revoke this invitation?')) {
        console.log('Revoking invitation:', id);
        alert('Invitation revoked successfully!');
        // In real app, would update the invitation status
    }
}

function viewInvitationDetails(id) {
    console.log('Viewing invitation details:', id);
    alert(`Invitation Details:\nCode: ORG-ABC123\nOrganization: Acme Corporation\nGenerated: Jan 15, 2024\nExpires: Feb 15, 2024\nStatus: Unused`);
}

function deleteInvitation(id) {
    if (confirm('Are you sure you want to delete this invitation?')) {
        console.log('Deleting invitation:', id);
        alert('Invitation deleted successfully!');
        // In real app, would remove the invitation
    }
}

function exportInvitations() {
    console.log('Exporting invitations...');
    alert('Invitations exported to CSV successfully!');
    // In real app, would trigger CSV download
}

// Show User Settings
function showUserSettings() {
    alert('User settings - Coming soon!');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Escape key closes modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

