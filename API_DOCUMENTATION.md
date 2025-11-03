# Task Insight DMS - API Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
   - [Authentication APIs](#authentication-apis)
   - [File Management APIs](#file-management-apis)
   - [Organization Management APIs](#organization-management-apis)
   - [User Management APIs](#user-management-apis)
   - [Admin APIs](#admin-apis)
   - [Audit Log APIs](#audit-log-apis)

---

## Introduction

The Task Insight DMS API is a RESTful API built with Express.js. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `http://localhost:5000/api` (Development)

**Production URL**: `https://your-domain.com/api`

---

## Authentication

Most API endpoints require authentication using JWT (JSON Web Tokens).

### Authentication Header

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration

- Access tokens expire after **24 hours**
- Refresh tokens expire after **7 days**

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## API Endpoints

### Authentication APIs

#### 1. User Registration

Register a new user with an invitation code.

**Endpoint**: `POST /auth/register`

**Authentication**: Not required

**Request Body**:
```json
{
  "invitationCode": "ABC123XYZ",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "organizationId": 1,
    "organizationName": "ABC Corporation"
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Invalid or expired invitation code"
}
```

---

#### 2. User Login

Authenticate a user and receive JWT tokens.

**Endpoint**: `POST /auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "invitationCode": "ABC123XYZ" // Optional
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "organizationId": 1,
      "organizationName": "ABC Corporation",
      "status": "active"
    }
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

#### 3. Refresh Token

Get a new access token using a refresh token.

**Endpoint**: `POST /auth/refresh`

**Authentication**: Not required

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 4. Verify Token

Verify if a token is valid and get user information.

**Endpoint**: `GET /auth/verify`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "organizationId": 1,
      "organizationName": "ABC Corporation"
    }
  }
}
```

---

#### 5. Logout

Invalidate the current session.

**Endpoint**: `POST /auth/logout`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### File Management APIs

#### 1. Get Files

Retrieve a paginated list of files.

**Endpoint**: `GET /files`

**Authentication**: Required

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `folderId` (number, optional) - Filter by folder
- `search` (string, optional) - Search query
- `fileType` (string, optional) - Filter by file type
- `sortBy` (string, optional) - Sort by field (name, date, size)
- `sortOrder` (string, optional) - Sort order (asc, desc)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 1,
        "fileName": "document.pdf",
        "fileType": "pdf",
        "fileSize": 1048576,
        "filePath": "/uploads/abc123.pdf",
        "folderId": null,
        "uploadedBy": 1,
        "uploaderName": "John Doe",
        "organizationId": 1,
        "uploadedAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

#### 2. Upload File

Upload a new file.

**Endpoint**: `POST /files/upload`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file` (file) - The file to upload
- `folderId` (number, optional) - Destination folder ID
- `description` (string, optional) - File description

**Success Response** (201):
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "fileName": "document.pdf",
    "fileType": "pdf",
    "fileSize": 1048576,
    "filePath": "/uploads/abc123.pdf",
    "folderId": null,
    "uploadedBy": 1,
    "organizationId": 1,
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 3. Download File

Download a file.

**Endpoint**: `GET /files/:id/download`

**Authentication**: Required

**Success Response**: File download stream

---

#### 4. Delete File

Delete a file (soft delete).

**Endpoint**: `DELETE /files/:id`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

#### 5. Rename File

Rename a file.

**Endpoint**: `PUT /files/:id/rename`

**Authentication**: Required

**Request Body**:
```json
{
  "fileName": "new-document-name.pdf"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "File renamed successfully",
  "data": {
    "id": 1,
    "fileName": "new-document-name.pdf"
  }
}
```

---

#### 6. Move File

Move a file to a different folder.

**Endpoint**: `PUT /files/:id/move`

**Authentication**: Required

**Request Body**:
```json
{
  "folderId": 5
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "File moved successfully"
}
```

---

#### 7. Share File

Create a share link for a file.

**Endpoint**: `POST /files/:id/share`

**Authentication**: Required

**Request Body**:
```json
{
  "permission": "view",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "shareLink": "https://example.com/share/abc123xyz",
    "shareToken": "abc123xyz",
    "permission": "view",
    "expiresAt": "2024-12-31T23:59:59.000Z"
  }
}
```

---

#### 8. Get File Stats

Get file statistics for the current user/organization.

**Endpoint**: `GET /files/stats`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "totalFiles": 150,
    "totalSize": 5368709120,
    "typeStats": [
      { "fileType": "pdf", "count": 50, "totalSize": 2147483648 },
      { "fileType": "docx", "count": 30, "totalSize": 1073741824 },
      { "fileType": "xlsx", "count": 20, "totalSize": 536870912 }
    ],
    "recentUploads": 15
  }
}
```

---

#### 9. Get Folders

Get all folders for the current organization.

**Endpoint**: `GET /files/folders`

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "folderName": "Documents",
      "parentId": null,
      "organizationId": 1,
      "createdBy": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "folderName": "Reports",
      "parentId": 1,
      "organizationId": 1,
      "createdBy": 1,
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

---

#### 10. Create Folder

Create a new folder.

**Endpoint**: `POST /files/folders`

**Authentication**: Required

**Request Body**:
```json
{
  "folderName": "New Folder",
  "parentId": null
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": {
    "id": 3,
    "folderName": "New Folder",
    "parentId": null,
    "organizationId": 1,
    "createdBy": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Admin APIs

#### 1. Get Dashboard Statistics

Get platform-wide statistics.

**Endpoint**: `GET /admin/stats`

**Authentication**: Required (Platform Owner)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "totalUsers": 500,
    "totalOrganizations": 50,
    "totalFiles": 10000,
    "totalStorage": 107374182400,
    "activeUsers": 450,
    "newUsersThisMonth": 25,
    "newOrganizationsThisMonth": 5,
    "storageUsagePercent": 75.5
  }
}
```

---

#### 2. Get Organizations

Get a list of all organizations.

**Endpoint**: `GET /admin/organizations`

**Authentication**: Required (Platform Owner)

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `status` (string, optional) - active, inactive

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "ABC Corporation",
        "contactEmail": "admin@abc.com",
        "status": "active",
        "storageQuota": 10737418240,
        "currentStorage": 5368709120,
        "userCount": 25,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

---

#### 3. Create Organization

Create a new organization.

**Endpoint**: `POST /admin/organizations`

**Authentication**: Required (Platform Owner)

**Request Body**:
```json
{
  "name": "New Company Inc.",
  "description": "Company description",
  "contactEmail": "contact@newcompany.com",
  "contactPhone": "+1234567890",
  "address": "123 Main St",
  "storageQuota": 10737418240,
  "status": "active"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": 51,
    "name": "New Company Inc.",
    "contactEmail": "contact@newcompany.com",
    "status": "active",
    "storageQuota": 10737418240,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 4. Update Organization

Update an organization.

**Endpoint**: `PUT /admin/organizations/:id`

**Authentication**: Required (Platform Owner)

**Request Body**:
```json
{
  "description": "Updated description",
  "storageQuota": 21474836480,
  "status": "active"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Organization updated successfully"
}
```

---

#### 5. Get Users

Get a list of all users.

**Endpoint**: `GET /admin/users`

**Authentication**: Required (Platform Owner)

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional)
- `organizationId` (number, optional)
- `role` (string, optional)
- `status` (string, optional)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "member",
        "status": "active",
        "organizationId": 1,
        "organizationName": "ABC Corporation",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastLogin": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 500,
      "pages": 50
    }
  }
}
```

---

#### 6. Update User Status

Update a user's status.

**Endpoint**: `PUT /admin/users/:id/status`

**Authentication**: Required (Platform Owner)

**Request Body**:
```json
{
  "status": "inactive"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

---

#### 7. Generate Invitation Codes

Generate invitation codes for an organization.

**Endpoint**: `POST /admin/invitations`

**Authentication**: Required (Platform Owner)

**Request Body**:
```json
{
  "organizationId": 1,
  "role": "member",
  "count": 10,
  "expiresIn": 30
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Invitation codes generated successfully",
  "data": {
    "codes": [
      "ABC123XYZ",
      "DEF456UVW",
      "GHI789RST"
    ],
    "count": 10,
    "expiresAt": "2024-02-14T23:59:59.000Z"
  }
}
```

---

#### 8. Get Invitation Codes

Get a list of invitation codes.

**Endpoint**: `GET /admin/invitations`

**Authentication**: Required (Platform Owner)

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `organizationId` (number, optional)
- `status` (string, optional) - unused, used, expired

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "code": "ABC123XYZ",
        "organizationId": 1,
        "organizationName": "ABC Corporation",
        "role": "member",
        "status": "unused",
        "usedBy": null,
        "usedAt": null,
        "expiresAt": "2024-02-14T23:59:59.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

#### 9. Get Storage Statistics

Get storage statistics across all organizations.

**Endpoint**: `GET /admin/storage`

**Authentication**: Required (Platform Owner)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "totalStorage": 1099511627776,
    "usedStorage": 536870912000,
    "availableStorage": 562640715776,
    "usagePercent": 48.8,
    "organizationBreakdown": [
      {
        "organizationId": 1,
        "organizationName": "ABC Corporation",
        "usedStorage": 107374182400,
        "storageQuota": 214748364800,
        "usagePercent": 50.0
      }
    ]
  }
}
```

---

#### 10. Get Recent Activity

Get recent activity logs.

**Endpoint**: `GET /admin/activity`

**Authentication**: Required (Platform Owner)

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `startDate` (string, optional) - ISO date
- `endDate` (string, optional) - ISO date
- `actionType` (string, optional)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 5,
      "userName": "John Doe",
      "action": "file_upload",
      "description": "Uploaded document.pdf",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP address
- **Authentication endpoints**: 5 requests per 15 minutes per IP address

When rate limit is exceeded, the API returns a `429 Too Many Requests` status.

---

## Pagination

Most list endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Pagination response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## Best Practices

1. **Always include error handling** in your API calls
2. **Store JWT tokens securely** (not in localStorage for sensitive apps)
3. **Refresh tokens before expiry** to maintain session
4. **Use pagination** for large data sets
5. **Implement retry logic** for failed requests
6. **Validate file sizes** before upload
7. **Use HTTPS** in production
8. **Handle rate limiting** gracefully

---

## Support

For API support or questions:
- Email: support@taskinsight.com
- Documentation: https://docs.taskinsight.com
- GitHub: https://github.com/taskinsight/dms

---

**Last Updated**: January 2024  
**API Version**: 1.0.0

