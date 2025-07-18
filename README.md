# FleetMate - Car Request and Approval System

FleetMate is a comprehensive car request and approval system built with NestJS backend, Angular frontend, PostgreSQL database, and Telegram bot integration.

## Features

- **Multi-step Approval Workflow**: Request → Eligibility Check → Approval → Car Assignment
- **Role-based Access Control**: User, Authority, Approver, Admin roles
- **Real-time Notifications**: WebSocket and Telegram notifications
- **Telegram Bot Integration**: Users can interact via Telegram bot
- **Car and Driver Management**: Complete fleet management system
- **Dashboard and Analytics**: Management dashboard with statistics

## Tech Stack

- **Backend**: NestJS (Node.js)
- **Frontend**: Angular (to be implemented)
- **Database**: PostgreSQL
- **Real-time**: WebSocket (Socket.IO)
- **Bot**: Telegram Bot API (Telegraf)
- **Authentication**: JWT
- **Validation**: class-validator
- **ORM**: TypeORM

## Project Structure

```
src/
├── auth/                 # Authentication module
├── users/                # User management
├── cars/                 # Car and driver management
├── requests/             # Car request and approval workflow
├── notifications/        # WebSocket and notification system
├── telegram/             # Telegram bot integration
├── config/               # Configuration files
└── main.ts              # Application entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fleetmate
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the database credentials and other configuration values

4. **Database Setup**
   ```bash
   # Create database
   createdb fleetmate_db
   
   # Run migrations (when implemented)
   yarn migration:run
   ```

5. **Start the application**
   ```bash
   # Development mode
   yarn start:dev
   
   # Production mode
   yarn build
   yarn start:prod
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/link-telegram` - Link Telegram account

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `GET /api/users/managers` - Get managers
- `GET /api/users/stats` - Get user statistics

### Car Requests
- `POST /api/requests` - Create new request
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get request by ID
- `PATCH /api/requests/:id` - Update request
- `POST /api/requests/:id/assign-car` - Assign car to request
- `PATCH /api/requests/:id/start-trip` - Start trip
- `PATCH /api/requests/:id/complete-trip` - Complete trip

### Approvals
- `POST /api/approvals` - Create approval
- `GET /api/approvals` - Get all approvals
- `PATCH /api/approvals/:id/approve` - Approve request
- `PATCH /api/approvals/:id/reject` - Reject request

### Cars & Drivers
- `POST /api/cars` - Add new car
- `GET /api/cars` - Get all cars
- `GET /api/cars/available` - Get available cars
- `POST /api/drivers` - Add new driver
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/available` - Get available drivers

### Notifications
- `POST /api/notifications/send` - Send notification
- `POST /api/notifications/broadcast` - Broadcast notification
- `GET /api/notifications/test-connection` - Test WebSocket connection

### Telegram
- `POST /api/telegram/webhook` - Telegram webhook
- `POST /api/telegram/send-message` - Send Telegram message
- `POST /api/telegram/broadcast` - Broadcast via Telegram

## User Roles

1. **User**: Can create car requests
2. **Authority**: Can review eligibility of requests
3. **Approver**: Can approve/reject requests
4. **Admin**: Full system access

## Workflow

1. **Request Creation**: User creates a car request
2. **Eligibility Check**: Authority reviews request eligibility
3. **Final Approval**: Approver makes final decision
4. **Car Assignment**: Admin assigns car and driver
5. **Trip Management**: Track trip start/completion
6. **Notifications**: Real-time updates via WebSocket and Telegram

## Telegram Bot Commands

- `/start` - Start bot interaction
- `/help` - Show help information
- `/link` - Link Telegram account to FleetMate
- `/myrequests` - Show user's requests
- `/newrequest` - Create new request (simplified)
- `/approvals` - Show pending approvals (for approvers)

## Development

### Running Tests
```bash
yarn test
```

### Building for Production
```bash
yarn build
```

### Database Migrations
```bash
# Generate migration
yarn migration:generate

# Run migrations
yarn migration:run

# Revert migration
yarn migration:revert
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `DB_NAME` | Database name | fleetmate_db |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRATION` | JWT expiration time | 24h |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | - |
| `PORT` | Application port | 3000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:4200 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
