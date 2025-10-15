# Document Management System (DMS)

A clean, modern document management system inspired by Google Drive and OneDrive, built with vanilla HTML, CSS, and JavaScript.

## Features

### Authentication
- **Login/Register**: Clean authentication interface with form validation
- **Organization Creation**: Admin users can create new organizations
- **Invitation System**: Admin-generated invitation codes for member registration
- **Role-Based Access**: Admin and member roles with different permissions
- **Session Management**: Persistent user sessions using browser storage

### Dashboard
- **File Management**: Create folders, upload files, download, and delete
- **Search**: Real-time search functionality across all documents
- **View Modes**: Grid and list view options
- **Sorting**: Sort by name, date modified, or file size
- **Navigation**: Sidebar navigation for different views (My Drive, Shared, Recent, etc.)
- **User Settings**: Organization information and invitation management (admin only)
- **Invitation Management**: Generate and manage invitation codes for new members

### File Operations
- **Upload**: Drag and drop or click to upload files
- **Share**: Generate shareable links with permission settings
- **Version Control**: File versioning system (UI ready)
- **Approval Workflow**: Document approval process (UI ready)

## Project Structure

```
DMS/
├── index.html              # Login/Register page
├── dashboard.html          # Main dashboard interface
├── styles/
│   ├── main.css           # Base styles and common components
│   ├── auth.css           # Authentication page styles
│   └── dashboard.css      # Dashboard and file management styles
├── js/
│   ├── auth.js            # Authentication logic
│   └── dashboard.js       # Dashboard functionality
└── README.md              # Project documentation
```

## File Organization

### HTML Files
- **index.html**: Authentication interface with login/register tabs
- **dashboard.html**: Main application interface with file management

### CSS Files
- **main.css**: Global styles, buttons, forms, modals, and responsive design
- **auth.css**: Authentication-specific styling with modern gradient design
- **dashboard.css**: Dashboard layout, file grid, sidebar, and file management UI

### JavaScript Files
- **auth.js**: Handles login/register forms, validation, and session management
- **dashboard.js**: File operations, search, upload, sharing, and UI interactions

## Design Features

### Visual Design
- **Clean Interface**: Minimalist design inspired by Google Drive
- **Modern Typography**: Google Sans font family for consistency
- **Color Scheme**: Google Material Design colors (blues, grays)
- **Responsive**: Mobile-friendly responsive design
- **Icons**: Font Awesome icons for visual consistency

### User Experience
- **Intuitive Navigation**: Clear sidebar navigation
- **Drag & Drop**: Easy file upload with drag and drop support
- **Search**: Real-time search with instant results
- **Notifications**: Toast notifications for user feedback
- **Loading States**: Visual feedback during operations

## Getting Started

### For Organization Admins:
1. **Open index.html** in a web browser
2. **Click "Create Organization"** tab
3. **Fill in organization details** and admin information
4. **Note the generated invitation codes** displayed after creation
5. **Share invitation codes** with team members
6. **Access user settings** to generate more invitation codes as needed

### For Organization Members:
1. **Open index.html** in a web browser
2. **Click "Join with Invite"** tab
3. **Enter invitation code** provided by your admin
4. **Fill in personal details** and create account
5. **Access the dashboard** with your organization's files
6. **Upload and manage files** within your organization

### Dashboard Usage:
- **Upload files** using the upload button or drag & drop
- **Create folders** to organize your documents
- **Search and sort** your files as needed
- **Access user settings** (click user avatar → Settings) to view organization info
- **Manage invitations** (admin only) in user settings

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Future Enhancements

The current implementation provides a solid foundation with these areas ready for backend integration:

- **File Upload API**: Replace simulated uploads with real file handling
- **User Authentication**: Integrate with authentication service
- **Database Storage**: Connect to database for file metadata
- **Approval Workflow**: Implement document approval process
- **Version Control**: Add file versioning capabilities
- **Real-time Sharing**: Implement actual file sharing functionality

## Customization

The modular CSS structure makes it easy to customize:

- **Colors**: Update CSS custom properties in main.css
- **Typography**: Modify font imports and font-family declarations
- **Layout**: Adjust grid systems and spacing in dashboard.css
- **Components**: Extend button and form styles in main.css

## License

This project is open source and available under the MIT License.
