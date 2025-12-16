# AlertHub - Alert & Incident Manager

AlertHub is a multi-user alert and incident management mobile application built with Expo and React Native. It allows teams to create, track, and manage alerts and incidents with a modern iOS 26 liquid glass interface design.

## Features

- **Alerts Management**: View, create, and manage alerts from manual creation or external systems
- **Alert Actions**: Take to Work, Inspect, Register Incident
- **Incidents Management**: Track incidents with severity, priority, and custom fields
- **Activity Feed**: View recent actions across the team
- **User Profile**: View user information and statistics
- **Multi-Organization Support**: Switch between organizations with org selector in header
- **Alert Grouping**: Group alerts by severity, status, or time period
- **Bilingual Support**: English and Russian languages

## Tech Stack

### Frontend
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: React Navigation 7 with bottom tabs
- **State Management**: React Query + Custom store with useSyncExternalStore
- **Styling**: iOS 26 liquid glass design with themed components

### Backend
- **Framework**: Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth with bcrypt

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (provided by Replit)
- Expo Go app (for mobile testing)

## Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-configured in Replit) |
| `SESSION_SECRET` | Secret key for session encryption |

## Installation

### Option 1: Local Installation

1. Clone the repository or fork the Replit project

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

### Option 2: Docker

1. Make sure Docker and Docker Compose are installed

2. Start the application:
```bash
docker-compose up
```

This will start:
- The application on ports 6000 (API) and 8081 (Expo)
- PostgreSQL database on port 5432

To stop the application:
```bash
docker-compose down
```

To reset the database:
```bash
docker-compose down -v
docker-compose up
```

## Running the Application

### Development Mode

Start both the Expo development server and Express backend:

```bash
npm run all:dev
```

This command runs:
- Expo development server on port 8081
- Express API server on port 6000

### Individual Commands

```bash
# Start only the Expo development server
npm run expo:dev

# Start only the Express backend server
npm run server:dev

# Push database schema changes
npm run db:push
```

## Testing the App

### Web Browser
After starting the development servers, the web version will be available in the Replit webview.

### Mobile Device (Expo Go)
1. Install the Expo Go app on your iOS or Android device
2. Scan the QR code displayed in the terminal or Replit URL bar menu
3. The app will load in Expo Go

## Project Structure

```
alerthub/
├── client/                 # Expo/React Native frontend
│   ├── components/         # Reusable UI components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── lib/                # Utilities, store, and API client
│   ├── hooks/              # Custom React hooks
│   └── constants/          # Theme and configuration
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database storage layer
│   ├── auth.ts             # Authentication middleware
│   └── db.ts               # Database connection and schema
├── shared/                 # Shared types and schemas
└── scripts/                # Build and deployment scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/:id` - Get alert by ID
- `POST /api/alerts` - Create new alert
- `PATCH /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### Incidents
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create new incident
- `PATCH /api/incidents/:id` - Update incident

### Organizations
- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create organization
- `POST /api/organizations/:id/members` - Add member to organization

### Activities
- `GET /api/activities` - Get activity feed

## Default Test Account

For development, you can register a new account through the app's registration screen.

## Troubleshooting

### Database Connection Issues
Ensure the `DATABASE_URL` environment variable is properly set. In Replit, this is automatically configured when you create a PostgreSQL database.

### Metro Bundler Issues
If you encounter Metro bundler issues, try:
```bash
npx expo start --clear
```

### Session Issues
Make sure `SESSION_SECRET` is set in your environment variables.

## License

MIT
