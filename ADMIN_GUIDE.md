# Task Insight DMS - Administrator Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Admin Roles & Permissions](#admin-roles--permissions)
3. [Getting Started](#getting-started)
4. [Dashboard Management](#dashboard-management)
5. [Organization Management](#organization-management)
6. [User Management](#user-management)
7. [Invitation System](#invitation-system)
8. [Storage Management](#storage-management)
9. [Security & Compliance](#security--compliance)
10. [Audit & Monitoring](#audit--monitoring)
11. [System Configuration](#system-configuration)
12. [Backup & Recovery](#backup--recovery)
13. [Troubleshooting](#troubleshooting)
14. [Best Practices](#best-practices)

---

## Introduction

Welcome to the **Task Insight DMS Administrator Guide**. This guide is designed for platform owners and organization administrators who manage the system, users, and organizational settings.

### Administrator Responsibilities

As an administrator, you are responsible for:
- Managing organizations and users
- Monitoring system health and performance
- Ensuring data security and compliance
- Managing storage allocation
- Reviewing audit logs
- Handling user support requests
- Configuring system settings

---

## Admin Roles & Permissions

### Platform Owner

**Full System Access** - Highest level of administrative control

**Permissions**:
- ✅ Manage all organizations
- ✅ Create and delete organizations
- ✅ Manage all users across organizations
- ✅ View all files and data
- ✅ Configure system-wide settings
- ✅ View comprehensive audit logs
- ✅ Generate invitation codes for any organization
- ✅ Manage storage quotas
- ✅ Access system analytics
- ✅ Perform backups and maintenance

**Use Cases**:
- System-wide administration
- Platform maintenance
- Security oversight
- Billing and subscription management

---

### Organization Administrator

**Organization-Level Access** - Manages a specific organization

**Permissions**:
- ✅ Manage users within their organization
- ✅ View organization files and folders
- ✅ Generate invitation codes for their organization
- ✅ View organization analytics
- ✅ Configure organization settings
- ✅ View organization audit logs
- ❌ Cannot access other organizations
- ❌ Cannot change storage quotas
- ❌ Cannot delete the organization

**Use Cases**:
- User management within organization
- Organization settings configuration
- User support and training

---

### Member (Standard User)

**Basic Access** - Standard file management capabilities

**Permissions**:
- ✅ Upload, download, and manage own files
- ✅ Create and manage folders
- ✅ Share files with others
- ✅ View organization files (if shared)
- ❌ Cannot access admin panel
- ❌ Cannot manage other users
- ❌ Cannot view system analytics

---

## Getting Started

### Accessing the Admin Panel

#### For Platform Owners:

1. Navigate to the login page
2. Click **"Task Insight Admin"** option
3. Enter admin credentials:
   - Admin email address
   - Admin password
4. Click **"Sign In as Admin"**
5. You'll be redirected to the admin dashboard

#### For Organization Administrators:

1. Login with standard credentials
2. Navigate to your organization settings
3. Access admin features from your account menu

---

### Admin Dashboard Overview

The admin dashboard provides a comprehensive overview of the system:

#### Statistics Cards

- **Total Users**: Number of registered users
- **Total Organizations**: Number of organizations
- **Total Files**: Number of files uploaded
- **Total Storage**: Total storage consumed
- **Active Users**: Currently active users
- **New Users This Month**: Recent registrations

#### Recent Activity

Real-time feed of system activities:
- User registrations
- File uploads
- Organization changes
- Security events
- System alerts

#### System Health

Monitor system status:
- Server uptime
- Database health
- Storage capacity
- API response time
- Error rates

---

## Organization Management

### Creating a New Organization

1. **Navigate to Organizations Tab**
   - Click **"Organizations"** in the sidebar
   - Click **"Add Organization"** button

2. **Fill in Organization Details**
   ```
   Required Fields:
   - Organization Name *
   - Contact Email *
   - Status *
   - Storage Quota *
   
   Optional Fields:
   - Description
   - Contact Phone
   - Address
   - Website
   ```

3. **Configure Settings**
   - **Storage Quota**: Allocate storage space (in GB)
   - **Status**: Active, Inactive, or Suspended
   - **User Limit**: Maximum number of users (optional)
   - **Features**: Enable/disable specific features

4. **Save Organization**
   - Click **"Create Organization"**
   - Organization is created immediately
   - Generate invitation codes for users

---

### Viewing Organizations

#### Organization List

The organizations table displays:
- Organization name
- Contact email
- Status badge (Active/Inactive/Suspended)
- User count
- Storage usage (used/quota)
- Creation date

#### Filtering & Search

**Filter by**:
- Status (Active, Inactive, Suspended)
- Storage usage (Under quota, Near limit, Over limit)
- Creation date range

**Search by**:
- Organization name
- Contact email

**Sort by**:
- Name (A-Z, Z-A)
- Creation date (Newest, Oldest)
- Storage usage (Highest, Lowest)
- User count (Most, Least)

---

### Editing Organizations

1. **Select Organization**
   - Click on organization name
   - Or click three-dot menu → **"Edit"**

2. **Update Information**
   - Modify any organization details
   - Adjust storage quota
   - Change contact information
   - Update status

3. **Save Changes**
   - Click **"Save Changes"**
   - Changes take effect immediately
   - Users are notified of significant changes

---

### Managing Storage Quotas

#### Viewing Storage Usage

```
Organization: ABC Corporation
├── Storage Quota: 100 GB
├── Used Storage: 75 GB (75%)
├── Available: 25 GB
└── Trend: ↑ 5 GB this month
```

#### Increasing Storage Quota

1. Open organization details
2. Click **"Edit Storage Quota"**
3. Enter new quota amount
4. Add reason for change (optional)
5. Click **"Update Quota"**

#### Storage Alerts

Configure alerts when organizations reach:
- 80% of quota (Warning)
- 90% of quota (Critical)
- 100% of quota (Full - uploads blocked)

---

### Organization Status Management

#### Active
- Organization is fully operational
- Users can login and use all features
- File uploads and sharing enabled

#### Inactive
- Organization is temporarily disabled
- Users cannot login
- Data is preserved
- Can be reactivated

#### Suspended
- Organization is suspended due to policy violation or non-payment
- Users cannot login
- Data is preserved for 30 days
- Requires platform owner approval to reactivate

---

### Deleting Organizations

⚠️ **Warning**: This action is permanent and cannot be undone.

**Before deleting**:
1. Export all organization data
2. Notify users
3. Review compliance requirements
4. Document deletion reason

**Deletion Process**:
1. Click organization → **"Delete"**
2. Enter confirmation code
3. Specify deletion reason
4. Confirm deletion
5. All data is permanently removed

**What gets deleted**:
- All users in the organization
- All files and folders
- All sharing links
- All audit logs related to organization
- All settings and configurations

---

## User Management

### Viewing Users

The user management table shows:
- User name (First + Last)
- Email address
- Organization
- Role (Platform Owner, Org Admin, Member)
- Status (Active, Inactive, Suspended)
- Last login date
- Creation date

---

### Adding Users Manually

1. **Click "Add User"** button
2. **Fill in user details**:
   ```
   - First Name *
   - Last Name *
   - Email Address *
   - Organization *
   - Role *
   - Initial Password (auto-generated or custom)
   ```
3. **Set Permissions**
   - Assign role
   - Set storage limit (optional)
   - Enable/disable specific features

4. **Send Invitation**
   - Check "Send welcome email"
   - User receives credentials and setup instructions
   - Click **"Create User"**

---

### Bulk User Operations

#### Bulk Import

1. Download CSV template
2. Fill in user data:
   ```csv
   first_name,last_name,email,organization_id,role
   John,Doe,john@example.com,1,member
   Jane,Smith,jane@example.com,1,member
   ```
3. Upload CSV file
4. Review import preview
5. Confirm import
6. Users are created and notified

#### Bulk Actions

Select multiple users to:
- Change status (Activate/Deactivate)
- Change role
- Move to different organization
- Send notification
- Export user data

---

### Editing User Information

1. Click user name or three-dot menu → **"Edit"**
2. **Modifiable Fields**:
   - First and last name
   - Email address
   - Phone number
   - Role
   - Organization assignment
   - Status
   - Password (reset)

3. **Save Changes**
   - User is notified of changes
   - Audit log is created

---

### User Status Management

#### Active
- User can login and use system
- All features enabled
- Files accessible

#### Inactive
- User cannot login
- Account suspended temporarily
- Data preserved
- Can be reactivated

#### Suspended
- Account locked due to security concerns
- Cannot login until platform owner reviews
- Requires admin intervention

---

### Resetting User Passwords

**Admin-Initiated Reset**:

1. Open user details
2. Click **"Reset Password"**
3. Choose option:
   - **Auto-generate**: System creates secure password
   - **Custom**: Admin sets specific password
   - **Email reset link**: User sets own password

4. Select notification method
5. Confirm reset

**User Data After Reset**:
- All files and folders remain intact
- Sharing links still active
- User settings preserved

---

### Deactivating Users

**Reasons to Deactivate**:
- Employee left organization
- Account compromised
- Policy violation
- User request
- Temporary leave

**Deactivation Process**:
1. Select user
2. Click **"Deactivate"**
3. Choose reason from dropdown
4. Add notes (optional)
5. Decide file handling:
   - Transfer files to another user
   - Keep files in account
   - Delete files after X days

6. Confirm deactivation

**What Happens**:
- User cannot login
- Active sessions terminated
- Shared links remain active (optionally disable)
- Files preserved (optionally reassign)

---

### Deleting Users

⚠️ **Permanent Action**

**Pre-Deletion Checklist**:
- ✅ Export user data
- ✅ Transfer important files
- ✅ Revoke all shares
- ✅ Document deletion reason
- ✅ Notify stakeholders

**Deletion Options**:
1. **Soft Delete** (Recommended)
   - User marked as deleted
   - Data preserved for 30 days
   - Recoverable

2. **Hard Delete** (Permanent)
   - User completely removed
   - All data deleted immediately
   - Cannot be recovered

---

## Invitation System

### Generating Invitation Codes

1. **Navigate to Invitations Tab**
2. **Click "Generate Codes"**
3. **Configure Settings**:
   ```
   - Organization: Select target organization *
   - Role: Member or Org Admin *
   - Number of Codes: 1-100 *
   - Expiration: 7, 30, 90 days, or custom *
   - Max Uses per Code: 1 (single-use) or multiple
   ```

4. **Generate Codes**
   - Click **"Generate"**
   - Codes created instantly
   - Copy codes or export to CSV

---

### Invitation Code Format

Codes are automatically generated with:
- **Length**: 9 characters
- **Format**: ABC-123-XYZ
- **Characters**: Uppercase letters and numbers
- **Uniqueness**: Guaranteed unique
- **Security**: Cryptographically random

---

### Managing Invitation Codes

#### View All Codes

Table displays:
- Code value
- Organization
- Role
- Status (Unused, Used, Expired)
- Created date
- Expiration date
- Used by (if applicable)
- Used date (if applicable)

#### Filter Codes
- By organization
- By status
- By expiration date
- By role

#### Code Actions
- **Copy**: Copy code to clipboard
- **Revoke**: Invalidate unused code
- **Extend**: Extend expiration date
- **View Usage**: See who used code

---

### Monitoring Code Usage

**Usage Statistics**:
- Total codes generated
- Codes used
- Codes pending
- Codes expired
- Usage rate

**Usage Trends**:
- Codes used per day/week/month
- Peak registration periods
- Organization-wise breakdown

---

### Revoking Invitation Codes

**When to Revoke**:
- Code leaked or compromised
- Organization deactivated
- Policy changes
- Security concerns

**Revocation Process**:
1. Find code in list
2. Click three-dot menu → **"Revoke"**
3. Add reason for revocation
4. Confirm action
5. Code immediately invalidated

---

## Storage Management

### Overview

Monitor storage across the entire platform:

```
Platform Storage Dashboard
├── Total Allocated: 5 TB
├── Total Used: 3.2 TB (64%)
├── Total Available: 1.8 TB
└── Top Organizations by Usage:
    ├── ABC Corp: 800 GB
    ├── XYZ Inc: 650 GB
    └── Tech Solutions: 500 GB
```

---

### Storage Analytics

#### Organization Breakdown

View storage by organization:
- Total allocated quota
- Current usage
- Available space
- Usage percentage
- Trend (increasing/decreasing)

#### File Type Analysis

See storage distribution by file type:
- Documents (PDF, DOC, etc.)
- Images (JPG, PNG, etc.)
- Videos (MP4, AVI, etc.)
- Archives (ZIP, RAR, etc.)
- Other

#### Storage Trends

Track storage over time:
- Daily/weekly/monthly growth
- Seasonal patterns
- Projection of future needs

---

### Managing Storage Capacity

#### Increasing Organization Quotas

1. Review organization's current usage
2. Verify legitimate need for increase
3. Check platform capacity
4. Update quota:
   - Click organization → **"Edit Storage"**
   - Enter new quota
   - Add justification
   - Save changes

#### Handling Storage Limits

**When Organization Reaches Limit**:
1. Organization users cannot upload new files
2. Automatic alert sent to:
   - Organization admins
   - Platform owner
3. Options:
   - Increase quota
   - Have organization delete files
   - Archive old files

---

### Storage Cleanup

#### Finding Large Files

1. Go to **Storage Analytics**
2. Click **"Large Files Report"**
3. View files sorted by size
4. Filter by organization
5. Identify deletion candidates

#### Identifying Duplicates

1. Run **"Duplicate Detection"**
2. System scans file checksums
3. View potential duplicates
4. Review and confirm deletions

#### Archived Files

Configure automatic archiving:
- Files not accessed for X days
- Move to cold storage
- Reduces active storage
- Can be restored when needed

---

## Security & Compliance

### Security Dashboard

Monitor security metrics:
- Failed login attempts
- Suspicious activities
- Password strength compliance
- Share link usage
- Data access patterns

---

### Access Control

#### Role-Based Access Control (RBAC)

Ensure proper permission assignment:
- Platform Owners: Minimal number
- Org Admins: Only trusted individuals
- Members: Standard users

#### Review Permissions Regularly

Monthly checklist:
- ✅ Review platform owners
- ✅ Check org admin assignments
- ✅ Verify user access levels
- ✅ Remove inactive accounts
- ✅ Update role assignments

---

### Authentication Security

#### Password Policies

Configure requirements:
- Minimum length
- Complexity requirements
- Password expiration
- Password history
- Account lockout settings

#### Two-Factor Authentication (2FA)

*Coming Soon*
- Enable 2FA for admins
- Optionally require for all users
- Support for authenticator apps
- SMS backup option

---

### Data Protection

#### Encryption

- **At Rest**: AES-256 encryption
- **In Transit**: TLS 1.3
- **Database**: Encrypted backups
- **Files**: Individual file encryption

#### Compliance Features

**GDPR Compliance**:
- Data export functionality
- Right to be forgotten (user deletion)
- Audit trails
- Consent management

**HIPAA Compliance** (Enterprise):
- Enhanced audit logging
- Access controls
- Encryption standards
- Business Associate Agreement

---

### Security Incidents

#### Incident Response

1. **Detection**
   - Monitor audit logs
   - Review security alerts
   - User reports

2. **Assessment**
   - Determine severity
   - Identify affected data
   - Document incident

3. **Containment**
   - Lock affected accounts
   - Revoke compromised tokens
   - Disable suspect features

4. **Resolution**
   - Fix security vulnerability
   - Restore normal operations
   - Notify affected users

5. **Post-Incident**
   - Update security policies
   - Improve monitoring
   - Train staff

---

## Audit & Monitoring

### Audit Logs

#### Viewing Audit Logs

1. Navigate to **"Audit Logs"** tab
2. View comprehensive activity log:
   - User ID and name
   - Action performed
   - Resource affected
   - IP address
   - User agent
   - Timestamp
   - Result (success/failure)

#### Filtering Audit Logs

**Filter by**:
- Action type (login, upload, delete, etc.)
- User
- Organization
- Date range
- Result (success/failure)
- IP address

**Search by**:
- User email
- Resource name
- Description keywords

---

### Logged Activities

**Authentication Events**:
- User login/logout
- Failed login attempts
- Password changes
- Password resets
- Account lockouts

**File Operations**:
- File uploads
- File downloads
- File deletions
- File sharing
- Share link access

**Administrative Actions**:
- User creation/deletion
- Organization changes
- Role assignments
- Storage quota changes
- System configuration updates

**Security Events**:
- Suspicious activities
- Policy violations
- Access denials
- Security alerts

---

### Exporting Audit Logs

1. Configure export parameters:
   - Date range
   - Filters
   - Format (CSV, JSON, PDF)

2. Click **"Export Logs"**
3. Wait for generation
4. Download file

**Use Cases**:
- Compliance audits
- Security investigations
- Performance analysis
- User behavior tracking

---

### Real-Time Monitoring

#### Activity Stream

Live feed of system activities:
- Recent logins
- File uploads in progress
- Current active users
- System events

#### System Health Metrics

Monitor in real-time:
- Server CPU usage
- Memory usage
- Database performance
- Storage capacity
- API response times
- Error rates

#### Alerts & Notifications

Configure alerts for:
- Storage threshold reached
- Failed login attempts exceed limit
- Unusual activity detected
- System errors
- Performance degradation

---

## System Configuration

### General Settings

#### Platform Information

- Platform name
- Company logo
- Contact information
- Support email
- Terms of service URL
- Privacy policy URL

#### Regional Settings

- Default language
- Date format
- Time format
- Timezone
- Currency (for billing)

---

### Email Configuration

#### SMTP Settings

```
- SMTP Server: smtp.gmail.com
- SMTP Port: 587
- Security: TLS/SSL
- Username: noreply@taskinsight.com
- Password: ••••••••
- From Name: Task Insight DMS
- From Email: noreply@taskinsight.com
```

#### Email Templates

Customize templates for:
- Welcome email
- Password reset
- Invitation email
- Storage alerts
- Share notifications
- System announcements

---

### File Upload Settings

#### Global Settings

- Maximum file size
- Allowed file types
- Virus scanning
- Duplicate detection
- Automatic file optimization

#### Organization-Specific

Allow organizations to override:
- File size limits
- Allowed file types
- Upload restrictions

---

### Security Settings

#### Session Management

- Session timeout duration
- Concurrent session limit
- Session refresh interval
- Remember me duration

#### Rate Limiting

- Login attempts limit
- API rate limits
- File upload limits
- Password reset attempts

---

### Feature Flags

Enable/disable features:
- File sharing
- Public share links
- File versioning
- Folder sharing
- Real-time collaboration
- Mobile apps
- API access

---

## Backup & Recovery

### Backup Strategy

#### Automated Backups

**Daily Full Backups**:
- Complete database backup
- All file storage
- System configuration
- Scheduled at 2 AM UTC
- Retained for 30 days

**Incremental Backups**:
- Every 6 hours
- Only changed data
- Quick recovery
- Retained for 7 days

**Weekly Archives**:
- Complete system snapshot
- Retained for 1 year
- Compliance requirement

---

### Manual Backups

#### Creating Manual Backup

1. Go to **"System"** → **"Backups"**
2. Click **"Create Backup"**
3. Select backup type:
   - Full system
   - Database only
   - Files only
   - Configuration only

4. Add description
5. Click **"Start Backup"**
6. Wait for completion
7. Download backup file

---

### Backup Storage

**Primary Storage**: On-server backups
**Secondary Storage**: Cloud storage (S3, Azure)
**Tertiary Storage**: Offline/cold storage

**Locations**:
- `/backups/daily/`
- `/backups/weekly/`
- `/backups/manual/`

---

### Restore Procedures

#### Full System Restore

1. Stop all services
2. Access backup files
3. Run restore script:
   ```bash
   ./restore.sh --backup=backup_20240115.tar.gz
   ```
4. Verify database integrity
5. Restart services
6. Test system functionality

#### Selective Restore

Restore specific items:
- **Single Organization**
- **Single User**
- **Specific Files**
- **Configuration Only**

---

### Disaster Recovery

#### Recovery Time Objective (RTO)

Target: **4 hours**

#### Recovery Point Objective (RPO)

Target: **1 hour** (maximum data loss)

#### Disaster Recovery Plan

1. **Incident Declared**
2. **Assess Damage**
3. **Activate DR Site**
4. **Restore from Backup**
5. **Verify Data Integrity**
6. **Resume Operations**
7. **Post-Mortem Analysis**

---

## Troubleshooting

### Common Admin Issues

#### Users Cannot Login

**Possible Causes**:
- Account deactivated
- Password expired
- Organization suspended
- System maintenance
- Database connection issues

**Solutions**:
1. Check user status
2. Verify organization status
3. Check system health
4. Review audit logs
5. Reset user password
6. Contact technical support

---

#### File Uploads Failing

**Causes**:
- Storage quota exceeded
- File size limit exceeded
- Unsupported file type
- Server disk full
- Permission issues

**Solutions**:
1. Check storage quota
2. Verify file size limits
3. Check allowed file types
4. Monitor server disk space
5. Review error logs
6. Adjust settings if needed

---

#### Slow System Performance

**Causes**:
- High concurrent users
- Large file transfers
- Database queries
- Insufficient resources
- Network issues

**Solutions**:
1. Monitor server resources
2. Check active users
3. Review slow query log
4. Optimize database
5. Scale resources
6. Implement caching

---

### Error Log Analysis

#### Accessing Logs

```bash
# Application logs
/var/log/taskinsight/app.log

# Error logs
/var/log/taskinsight/error.log

# Access logs
/var/log/taskinsight/access.log

# Audit logs
/var/log/taskinsight/audit.log
```

#### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check authentication |
| 403 | Forbidden | Verify permissions |
| 404 | Not Found | Check resource exists |
| 500 | Server Error | Check server logs |
| 503 | Service Unavailable | Check service status |

---

## Best Practices

### User Management

1. **Regular Audits**: Review user access quarterly
2. **Principle of Least Privilege**: Give minimum required access
3. **Onboarding Process**: Standardized user setup
4. **Offboarding Process**: Immediate account deactivation
5. **Documentation**: Maintain user records

### Security

1. **Password Policy**: Enforce strong passwords
2. **Regular Reviews**: Monthly security audits
3. **Access Monitoring**: Review audit logs weekly
4. **Incident Response**: Have documented procedures
5. **User Training**: Security awareness programs

### Storage Management

1. **Quota Planning**: Allocate based on actual needs
2. **Regular Cleanup**: Monthly storage reviews
3. **Archive Policy**: Move old files to cold storage
4. **Growth Monitoring**: Track storage trends
5. **Capacity Planning**: Plan for future growth

### Performance

1. **Monitor Regularly**: Daily health checks
2. **Optimize Database**: Weekly optimization
3. **Update Software**: Monthly updates
4. **Resource Scaling**: Scale before hitting limits
5. **Performance Testing**: Quarterly load tests

### Compliance

1. **Data Retention**: Define and enforce policies
2. **Audit Trails**: Maintain complete logs
3. **Data Protection**: Implement encryption
4. **User Privacy**: Respect privacy rights
5. **Regular Audits**: Quarterly compliance reviews

---

## Support & Resources

### Getting Help

**Technical Support**:
- Email: admin-support@taskinsight.com
- Priority Phone: +1 (555) 123-4567 ext. 100
- Response Time: < 2 hours for critical issues

**Documentation**:
- Admin Portal: https://admin.taskinsight.com
- Knowledge Base: https://docs.taskinsight.com
- API Docs: https://api.taskinsight.com/docs

**Training**:
- Admin Training Program: Available on request
- Webinars: Monthly admin webinars
- Certification: Admin certification program

---

## Appendix

### Useful Commands

```bash
# Check system status
systemctl status taskinsight

# View real-time logs
tail -f /var/log/taskinsight/app.log

# Database backup
mysqldump -u root -p task_insight > backup.sql

# Clear cache
redis-cli FLUSHALL

# Check disk space
df -h

# Monitor resources
htop
```

### Important Files

```
/etc/taskinsight/config.json      - Main configuration
/var/log/taskinsight/             - Log files
/var/lib/taskinsight/uploads/     - File storage
/var/backups/taskinsight/         - Backups
```

---

**Thank you for administering Task Insight DMS!**

Your role is crucial in ensuring a secure, efficient, and reliable document management system for all users.

---

**Document Version**: 1.0.0  
**Last Updated**: January 2024  
**For**: Platform Owners & Organization Administrators

