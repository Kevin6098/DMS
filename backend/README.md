# DMS Backend API

A comprehensive Document Management System backend built with Express.js, MySQL, and JWT authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **File Management**: Upload, download, organize, and share files
- **Organization Management**: Multi-tenant organization support
- **User Management**: Complete user lifecycle management
- **Admin Panel**: Platform owner dashboard with analytics
- **Audit Logging**: Comprehensive activity tracking
- **Security**: Rate limiting, CORS, helmet security headers
- **File Storage**: Local file storage with configurable limits
- **Search & Filtering**: Advanced search and filtering capabilities

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with mysql2 driver
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: Helmet, CORS, bcrypt
- **Validation**: express-validator
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=dms_database
   DB_USER=root
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up the database**
   - Create MySQL database
   - Run the SQL schema from `../database_schema.sql`

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📁 Project Structure

```
backend/
├── config/           # Database and app configuration
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Data models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
├── tests/           # Test files
├── uploads/         # File upload directory
├── server.js        # Main server file
└── package.json     # Dependencies and scripts
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change password
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats/overview` - User statistics

### Organizations
- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/:id/users` - Get organization users
- `GET /api/organizations/stats/overview` - Organization statistics

### Files
- `GET /api/files` - Get all files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:fileId` - Get file by ID
- `GET /api/files/:fileId/download` - Download file
- `PUT /api/files/:fileId` - Update file
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/files/folders/list` - Get folders
- `POST /api/files/folders` - Create folder
- `GET /api/files/stats/overview` - File statistics

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/activity/timeline` - Activity timeline
- `POST /api/admin/invitations/generate` - Generate invitation
- `GET /api/admin/invitations` - Get invitations
- `DELETE /api/admin/invitations/:id` - Delete invitation
- `GET /api/admin/storage/analytics` - Storage analytics
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings

### Audit Logs
- `GET /api/audit` - Get audit logs
- `GET /api/audit/:id` - Get audit log by ID
- `GET /api/audit/stats/overview` - Audit statistics
- `GET /api/audit/export/csv` - Export audit logs
- `GET /api/audit/filters/options` - Get filter options

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### User Roles

1. **Platform Owner**: Full access to all features
2. **Organization Admin**: Manage users and files in their organization
3. **Member**: Basic file operations within their organization

## 📊 Database Schema

The system uses the following main tables:
- `users` - User accounts
- `organizations` - Organizations/tenants
- `files` - File metadata
- `folders` - Folder structure
- `invitations` - User invitations
- `audit_logs` - Activity tracking

## 🧪 Testing

Run tests with:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npx prettier --write .
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_NAME` | Database name | dms_database |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | 24h |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MAX_FILE_SIZE` | Max file size in bytes | 10485760 |
| `ALLOWED_FILE_TYPES` | Allowed file extensions | pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4,avi,mov |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |

## 🚀 Deployment

### Production Setup

1. **Set production environment variables**
2. **Use a process manager like PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js --name dms-backend
   ```

3. **Set up reverse proxy with Nginx**
4. **Configure SSL certificates**
5. **Set up database backups**
6. **Configure monitoring and logging**

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Security headers
- **Input Validation**: express-validator for request validation
- **SQL Injection Protection**: Parameterized queries
- **File Type Validation**: Restricted file uploads
- **Storage Quotas**: Organization-level storage limits

## 📈 Performance

- **Connection Pooling**: MySQL connection pool for better performance
- **Compression**: Gzip compression for responses
- **Pagination**: Efficient data pagination
- **Indexing**: Database indexes for fast queries
- **Caching**: Response caching where appropriate

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## 📚 API Documentation

For detailed API documentation, refer to the individual route files in the `routes/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the test files for usage examples
- Open an issue on the repository

---

**Built with ❤️ for efficient document management**
