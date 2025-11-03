# Task Insight DMS - Document Management System

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A comprehensive Document Management System built with **Express.js**, **MySQL**, and **React** with TypeScript. Features include file management, organization management, user authentication, role-based access control, and an admin panel for platform owners.

---

## 🎯 Features

### Core Functionality
- ✅ **User Authentication**: JWT-based authentication with role-based access control
- ✅ **File Management**: Upload, download, rename, delete, and organize files
- ✅ **Folder Organization**: Hierarchical folder structure with nested folders
- ✅ **File Sharing**: Share files with customizable permissions and expiration dates
- ✅ **Search & Filter**: Advanced search with filters by type, date, and size
- ✅ **Storage Management**: Organization-level storage quotas and usage tracking

### Admin Features
- ✅ **Platform Dashboard**: Comprehensive statistics and system health monitoring
- ✅ **Organization Management**: Create, edit, and manage multiple organizations
- ✅ **User Management**: Add, edit, deactivate, and manage users across organizations
- ✅ **Invitation System**: Generate and manage invitation codes for user registration
- ✅ **Storage Analytics**: Detailed storage usage reports and analytics
- ✅ **Audit Logs**: Complete audit trail of all system activities

### Security
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-Based Access Control**: Platform Owner, Org Admin, and Member roles
- ✅ **Password Hashing**: Bcrypt password encryption
- ✅ **Rate Limiting**: API rate limiting to prevent abuse
- ✅ **Input Validation**: Comprehensive input validation and sanitization
- ✅ **CORS Protection**: Configured CORS for security
- ✅ **SQL Injection Prevention**: Parameterized queries throughout

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- React Router for routing
- Axios for API calls
- React Hot Toast for notifications
- CSS3 with responsive design

**Backend:**
- Node.js with Express.js
- MySQL 8.0+ database
- JWT for authentication
- Multer for file uploads
- Bcrypt for password hashing
- Helmet for security headers

**Infrastructure:**
- PM2 for process management
- Nginx as reverse proxy
- Let's Encrypt SSL certificates
- Automated backups

---

## 📁 Project Structure

```
DMS/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── contexts/        # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── FileContext.tsx
│   │   ├── services/        # API service layer
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── fileService.ts
│   │   │   ├── organizationService.ts
│   │   │   └── adminService.ts
│   │   ├── styles/          # CSS stylesheets
│   │   └── __tests__/       # Frontend tests
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # Express.js backend
│   ├── config/              # Configuration files
│   │   └── database.js
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── organizations.js
│   │   ├── users.js
│   │   ├── admin.js
│   │   └── audit.js
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   ├── tests/               # Backend tests
│   │   ├── auth.test.js
│   │   ├── files.test.js
│   │   └── admin.test.js
│   ├── uploads/             # File storage
│   ├── logs/                # Application logs
│   ├── server.js            # Entry point
│   └── package.json
│
├── prototype/               # HTML/CSS prototypes
│   ├── index.html
│   ├── dashboard.html
│   ├── admin-panel.html
│   └── styles/
│
├── docs/                    # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   ├── ADMIN_GUIDE.md
│   └── DEPLOYMENT_GUIDE.md
│
├── setup_database.sql       # Database schema
├── DATABASE_SETUP.md        # Database setup instructions
├── DEVELOPMENT_TODO.md      # Development checklist
└── README.md                # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or 18.x LTS
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/task-insight-dms.git
cd task-insight-dms
```

2. **Set up the database**
```bash
# Create database
mysql -u root -p < setup_database.sql

# Or follow the detailed guide
# See DATABASE_SETUP.md
```

3. **Install backend dependencies**
```bash
cd backend
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
nano .env
```

4. **Install frontend dependencies**
```bash
cd ../frontend
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with your API URL
nano .env.local
```

5. **Start the backend server**
```bash
cd ../backend
npm start

# Or with PM2 for production
pm2 start server.js --name taskinsight-api
```

6. **Start the frontend development server**
```bash
cd ../frontend
npm start
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_insight
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,gif,mp4

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENV=development
REACT_APP_MAX_FILE_SIZE=10485760
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test

# Run specific test file
npm test auth.test.js

# Run with coverage
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test Login.test.tsx
```

---

## 📚 Documentation

Comprehensive documentation is available in the following files:

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference with endpoints, request/response examples
- **[Database Documentation](DATABASE_DOCUMENTATION.md)** - Database schema, relationships, and optimization
- **[User Guide](USER_GUIDE.md)** - End-user documentation with screenshots and tutorials
- **[Admin Guide](ADMIN_GUIDE.md)** - Administrator guide for platform and organization management
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Development TODO](DEVELOPMENT_TODO.md)** - Development checklist and project status

---

## 🚀 Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build

# Build folder will contain optimized production files
```

**Backend:**
```bash
cd backend

# Install production dependencies only
npm ci --production

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Deployment Options

1. **Traditional VPS** - Deploy to DigitalOcean, AWS EC2, or similar
2. **Frontend Hosting** - Netlify, Vercel, or AWS S3 + CloudFront
3. **Backend Hosting** - Heroku, AWS Elastic Beanstalk, or similar
4. **Database** - AWS RDS, DigitalOcean Managed Databases, or self-hosted MySQL

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🔐 Default Admin Access

For first-time setup, create a platform owner account:

```sql
-- Connect to MySQL
mysql -u root -p task_insight

-- Create platform owner (replace with your details)
INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES (
  'admin@taskinsight.com',
  '$2b$12$your_hashed_password_here',
  'Admin',
  'User',
  'platform_owner',
  'active'
);
```

Or use the registration flow with the first invitation code marked as platform owner.

---

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB + storage for files
- **OS**: Ubuntu 20.04+ or CentOS 8+

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **OS**: Ubuntu 22.04 LTS
- **MySQL**: 8.0+ on separate server

---

## 🛠️ Built With

- [React](https://reactjs.org/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Express.js](https://expressjs.com/) - Backend framework
- [MySQL](https://www.mysql.com/) - Database
- [JWT](https://jwt.io/) - Authentication
- [Multer](https://github.com/expressjs/multer) - File upload
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Password hashing
- [PM2](https://pm2.keymetrics.io/) - Process manager
- [Nginx](https://nginx.org/) - Reverse proxy

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/refresh` - Refresh access token

### Files
- `GET /api/files` - Get files (paginated)
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file
- `PUT /api/files/:id/rename` - Rename file
- `POST /api/files/:id/share` - Share file
- `GET /api/files/stats` - Get file statistics

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/organizations` - List organizations
- `POST /api/admin/organizations` - Create organization
- `GET /api/admin/users` - List users
- `POST /api/admin/invitations` - Generate invitation codes
- `GET /api/admin/activity` - Audit logs

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## 📈 Roadmap

### Version 1.1 (Q2 2024)
- [ ] Real-time notifications with WebSocket
- [ ] Two-factor authentication
- [ ] Mobile apps (iOS/Android)
- [ ] Document preview for more file types
- [ ] Advanced search with Elasticsearch

### Version 1.2 (Q3 2024)
- [ ] Cloud storage integration (AWS S3, Azure Blob)
- [ ] File versioning UI
- [ ] Collaborative editing
- [ ] Video/image processing
- [ ] OCR for documents

### Version 2.0 (Q4 2024)
- [ ] Single Sign-On (SSO)
- [ ] LDAP/Active Directory integration
- [ ] Advanced compliance features
- [ ] Custom branding per organization
- [ ] Workflow automation

---

## 🐛 Known Issues

- None currently. Report issues on GitHub.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Task Insight Team** - *Initial work*

---

## 🙏 Acknowledgments

- React community for excellent documentation
- Express.js team for the robust framework
- MySQL team for reliable database
- All contributors and testers

---

## 📞 Support

For support, email support@taskinsight.com or create an issue on GitHub.

**Documentation:**
- User Guide: See [USER_GUIDE.md](USER_GUIDE.md)
- Admin Guide: See [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- API Docs: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Community:**
- GitHub: https://github.com/taskinsight/dms
- Forum: https://community.taskinsight.com
- Discord: https://discord.gg/taskinsight

---

## 📊 Project Status

**Status**: ✅ **Production Ready**

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Completion**: 100% ✨

All core features implemented and tested. Ready for production deployment!

---

**Made with ❤️ by the Task Insight Team**

