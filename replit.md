# AlertHub - Alert & Incident Manager App

## Overview
AlertHub is a multi-user alert and incident management mobile application built with Expo and React Native. It allows teams to create, track, and manage alerts and incidents with a modern iOS 26 liquid glass interface design.

## Current State
Frontend-backend integration complete. All major screens now use real API with PostgreSQL database. Email-based authentication working.

## Features
- **Alerts Management**: View, create, and manage alerts with real-time API integration
- **Alert Actions**: Take to Work, Inspect, Register Incident - all update the database
- **Incidents Management**: Track incidents with severity, priority
- **Activity Feed**: View recent actions across the team
- **User Profile**: View user information with language toggle
- **Status Page**: 30-day timeline with incident tracking
- **Email-based Authentication**: Login/logout with session management
- **Multi-project Support**: Project context shown in header

## Project Architecture

### Frontend (client/)
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: React Navigation 7 with bottom tabs
- **State Management**: React Query for API data, Auth context for user/project
- **Styling**: iOS 26 liquid glass design with themed components

### Backend (server/)
- **Framework**: Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with bcrypt password hashing
- **API**: RESTful endpoints for all CRUD operations

## API Endpoints
- `POST /api/auth/login` - Email-based login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/alerts` - List alerts (project-scoped)
- `POST /api/alerts` - Create alert
- `GET /api/alerts/:id` - Get alert details
- `PUT /api/alerts/:id` - Update alert
- `GET /api/alerts/:id/comments` - Get alert comments
- `POST /api/alerts/:id/comments` - Add comment
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `GET /api/activity` - Get activity feed
- `GET /api/status` - Get status page data

## File Structure
```
client/
├── components/      # Reusable UI components
│   ├── AlertCard.tsx
│   ├── IncidentCard.tsx
│   ├── SeverityBadge.tsx
│   ├── StatusChip.tsx
│   ├── HeaderTitle.tsx
│   └── CommentsSection.tsx
├── screens/         # Screen components
│   ├── AlertsScreen.tsx
│   ├── AlertDetailScreen.tsx
│   ├── IncidentsScreen.tsx
│   ├── IncidentDetailScreen.tsx
│   ├── ActivityScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── StatusScreen.tsx
│   ├── CreateAlertScreen.tsx
│   └── RegisterIncidentScreen.tsx
├── lib/             # Core libraries
│   ├── api.ts       # React Query hooks for API
│   ├── auth.tsx     # Authentication context
│   └── utils.ts     # Utility functions
└── constants/       # Theme and configuration
    └── theme.ts

server/
├── index.ts         # Express server entry
├── routes.ts        # API routes
├── storage.ts       # Database storage layer
├── auth.ts          # Authentication middleware
└── seed.ts          # Database seeding script

shared/
└── schema.ts        # Drizzle ORM schema (users, projects, alerts, etc.)
```

## Test Accounts
All use password: `password123`
- admin@alerthub.com (Admin role)
- operator@alerthub.com (Operator role)
- maria@alerthub.com (Manager role)
- viewer@alerthub.com (Viewer role)

## Development

### Running the App
```bash
npm run all:dev
```

This starts both the Expo development server (port 8081) and the Express server (port 5000).

### Database Commands
```bash
npm run db:push       # Push schema changes
npm run db:seed       # Seed test data
```

### Testing
- Web: Visit the web preview
- Mobile: Scan QR code with Expo Go app

## User Preferences
- Modern iOS liquid glass interface
- Severity-based color coding (critical=red, high=orange, medium=yellow, low=blue)
- Professional, clean design without emojis
- Bilingual support (English/Russian)

## Recent Changes
- December 2024: Initial frontend prototype with all screens and navigation
- December 2024: Backend implementation with PostgreSQL and Drizzle ORM
- December 2024: Email-based authentication system
- December 2024: Frontend-backend integration with React Query
- December 2024: Updated all screens to use real API (AlertsScreen, IncidentsScreen, AlertDetailScreen, CreateAlertScreen, RegisterIncidentScreen, StatusScreen, ActivityScreen, ProfileScreen)
- December 2024: Removed mock store, now using real database

## Pending Features
- Webhook ingestion endpoints for Alertmanager/Grafana/Zabbix
- Image upload for alerts (backend support needed)
- Invitation system for team management
- First-time user flow with project creation
