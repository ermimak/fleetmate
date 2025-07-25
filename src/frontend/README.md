# FleetMate Frontend

This is the frontend for the FleetMate application, built with vanilla JavaScript, HTML, and CSS.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Backend server running (default: http://localhost:3000)

## Setup

1. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the frontend directory with the following variables:

```env
# Frontend server port
PORT=3001

# Backend API URL
API_URL=http://localhost:3000
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the frontend server with hot-reload enabled.

### Production Mode

```bash
npm start
```

## Project Structure

```
src/frontend/
├── assets/           # Static assets (images, fonts, etc.)
├── js/               # JavaScript files
│   └── app.js        # Main application logic
├── styles/           # CSS files
│   └── main.css      # Main stylesheet
├── dashboard.html    # Dashboard page
├── index.html        # Main entry point
├── login.html        # Login page
├── new-request.html  # New request form
├── requests.html     # Requests list
└── server.js         # Development server
```

## API Integration

The frontend communicates with the backend REST API. The main API service is defined in `js/app.js`.

### Available Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `GET /api/requests` - Get user's requests
- `POST /api/requests` - Create a new request

## Browser Support

The application is designed to work in all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
