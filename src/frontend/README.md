# FleetMate Frontend

A comprehensive web application for fleet management built with modern web technologies and a clean, responsive design.

## 🚀 Features

### Core Functionality
- **🔐 Authentication System**: Secure JWT-based login with role-based access control
- **📊 Dashboard**: Real-time overview of fleet operations and statistics
- **🚗 Fleet Management**: Complete vehicle lifecycle management
- **📋 Request Management**: Streamlined vehicle request workflow
- **👥 User Management**: Comprehensive user administration (Admin only)
- **✅ Approval System**: Efficient request approval workflow
- **📈 Reports & Analytics**: Detailed insights and data export capabilities

### User Experience
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🎨 Modern UI**: Clean, intuitive interface with consistent design system
- **⚡ Fast Performance**: Optimized loading and smooth interactions
- **♿ Accessibility**: WCAG compliant design for all users

## 🛠 Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Custom CSS with CSS Grid, Flexbox, and CSS Custom Properties
- **Server**: Node.js with Express for development
- **API**: RESTful API integration with JWT authentication
- **Build**: Modern development server with hot reload and API proxy

## 🏗 Architecture

### Project Structure
```
src/frontend/
├── js/
│   └── app.js                 # Main application logic and API service
├── styles/
│   └── main.css              # Complete design system and components
├── pages/                    # Additional page templates (if needed)
├── components/               # Reusable UI components
├── assets/                   # Static assets (images, icons, etc.)
├── server.js                # Development server with API proxy
├── package.json             # Dependencies and npm scripts
└── HTML Pages:
    ├── login.html           # Authentication page
    ├── dashboard.html       # Main dashboard
    ├── my-requests.html     # User's personal requests
    ├── new-request.html     # Create new vehicle request
    ├── approvals.html       # Approval interface (Approvers)
    ├── manage-requests.html # Request management (Admin/Authority)
    ├── fleet-management.html # Vehicle and driver management
    ├── user-management.html # User administration (Admin only)
    └── reports.html         # Analytics and reporting
```

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ and npm
- FleetMate backend running on port 5000
- Modern web browser

### Quick Start

1. **Navigate to frontend directory**:
   ```bash
   cd src/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   ```
   http://localhost:3001
   ```

### Default Login Credentials
Use the credentials created through your backend seeding process.

## 👤 User Roles & Permissions

### 🟢 USER
- ✅ Create and submit vehicle requests
- ✅ View own request history and status
- ✅ Cancel pending requests
- ✅ Access personal dashboard

### 🟡 APPROVER
- ✅ All USER permissions
- ✅ Review and approve/reject requests
- ✅ View pending approvals dashboard
- ✅ Add approval comments and reasons

### 🟠 AUTHORITY
- ✅ All APPROVER permissions
- ✅ Manage all requests in the system
- ✅ Assign vehicles and drivers to requests
- ✅ Manage fleet operations
- ✅ View comprehensive reports
- ✅ Start and complete trips

### 🔴 ADMIN
- ✅ All AUTHORITY permissions
- ✅ Complete user management (CRUD operations)
- ✅ System configuration and settings
- ✅ Full access to all features and data

## 🔌 API Integration

### Authentication
```javascript
// Login
POST /api/auth/login
// Get current user
GET /api/users/me
```

### User Management (Admin only)
```javascript
// List users with filters
GET /api/users?role=admin&status=active
// Create user
POST /api/users
// Update user
PATCH /api/users/:id
// Delete user
DELETE /api/users/:id
// User statistics
GET /api/users/stats
```

### Request Management
```javascript
// User's requests
GET /api/requests/my-requests
// All requests (with filters)
GET /api/requests?status=pending&priority=high
// Create request
POST /api/requests
// Update status
PATCH /api/requests/:id/status
// Assign vehicle
PATCH /api/requests/:id/assign-car
// Pending approvals
GET /api/requests/pending-approvals
// Statistics
GET /api/requests/stats
```

### Fleet Management
```javascript
// List vehicles
GET /api/cars?status=available&type=sedan
// Add vehicle
POST /api/cars
// Update vehicle
PATCH /api/cars/:id
// Fleet statistics
GET /api/cars/stats
// Assign driver
PATCH /api/cars/:id/assign-driver/:driverId
```

## 🎨 Design System

### Color Palette
- **Primary**: `#2563eb` (Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)
- **Surface**: `#ffffff` (White)
- **Background**: `#f8fafc` (Light Gray)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Scale**: Consistent spacing and sizing

### Components
- **Buttons**: Multiple variants with consistent styling
- **Forms**: Accessible form controls with validation
- **Cards**: Content containers with shadows and borders
- **Tables**: Responsive data tables with sorting
- **Modals**: Overlay dialogs for actions
- **Badges**: Status indicators with semantic colors

## 🔧 Development

### Code Organization

**Main Application (`js/app.js`)**:
- `ApiService`: Centralized API communication
- `State Management`: Application state handling
- `Page Initialization`: Route-specific setup
- `Event Handlers`: User interaction management
- `Utility Functions`: Shared helper functions

### Adding New Features

1. **New Page**:
   ```javascript
   // Add HTML template
   // Add initialization function
   async function initNewPage() {
     // Page-specific logic
   }
   
   // Add to router in initializeApp()
   case 'new-page':
     await initNewPage();
     break;
   ```

2. **New API Endpoint**:
   ```javascript
   // Add to ApiService class
   async newEndpoint(data) {
     return await this.request('/new-endpoint', {
       method: 'POST',
       body: data
     });
   }
   ```

3. **New Component**:
   ```css
   /* Add to main.css */
   .new-component {
     /* Component styles */
   }
   ```

### Development Server Features
- **Hot Reload**: Automatic browser refresh on file changes
- **API Proxy**: Seamless backend integration
- **Error Handling**: Comprehensive error reporting
- **CORS Support**: Proper cross-origin handling

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Collapsible sidebar navigation
- Touch-friendly button sizes
- Optimized table layouts
- Responsive grid systems

## 🔒 Security Features

- **JWT Token Management**: Secure token storage and refresh
- **Role-based UI**: Dynamic interface based on permissions
- **Input Validation**: Client-side validation with server verification
- **XSS Protection**: Sanitized content rendering
- **CSRF Protection**: Secure form submissions

## 📊 Performance

### Optimizations
- **Lazy Loading**: On-demand resource loading
- **Efficient API Calls**: Minimal data transfer
- **Caching Strategy**: Smart caching for static resources
- **Bundle Size**: Minimal JavaScript footprint

### Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 100KB (gzipped)

## 🧪 Testing

### Manual Testing Checklist
- [ ] Authentication flow works correctly
- [ ] Role-based access control functions properly
- [ ] All CRUD operations work as expected
- [ ] Responsive design works on all screen sizes
- [ ] Error handling displays appropriate messages
- [ ] Navigation and routing work correctly

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build

# Serve static files
npm run serve
```

### Environment Configuration
```javascript
// config.js
const config = {
  API_BASE_URL: process.env.API_BASE_URL || '/api',
  TOKEN_KEY: 'authToken',
  USER_KEY: 'userData'
};
```

## 🐛 Troubleshooting

### Common Issues

**Login Issues**:
- Check backend server is running on port 5000
- Verify API proxy configuration
- Check browser console for errors

**Permission Errors**:
- Verify user role in localStorage
- Check JWT token validity
- Confirm backend role guards

**UI Issues**:
- Clear browser cache
- Check CSS loading
- Verify responsive breakpoints

## 📚 Browser Support

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile Safari**: iOS 13+
- **Chrome Mobile**: Android 8+

## 🤝 Contributing

1. **Code Style**: Follow existing patterns and conventions
2. **Testing**: Test all new features across different roles
3. **Documentation**: Update README for new features
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Performance**: Maintain fast loading times

## 📄 License

This project is part of the FleetMate fleet management system. See the [LICENSE](LICENSE) file for details.
