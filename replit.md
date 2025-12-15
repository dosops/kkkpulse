# AlertHub - Alert & Incident Manager App

## Overview
AlertHub is a multi-user alert and incident management mobile application built with Expo and React Native. It allows teams to create, track, and manage alerts and incidents with a modern iOS 26 liquid glass interface design.

## Current State
Frontend prototype complete with mock data. Ready for user feedback before backend implementation.

## Features
- **Alerts Management**: View, create, and manage alerts from manual creation or external systems
- **Alert Actions**: Take to Work, Inspect, Register Incident
- **Incidents Management**: Track incidents with severity, priority, and custom fields
- **Activity Feed**: View recent actions across the team
- **User Profile**: View user information and statistics

## Project Architecture

### Frontend (client/)
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: React Navigation 7 with bottom tabs
- **State Management**: Custom store with useSyncExternalStore
- **Styling**: iOS 26 liquid glass design with themed components

### Backend (server/)
- **Framework**: Express with TypeScript
- **Database**: PostgreSQL (to be implemented)
- **ORM**: Drizzle ORM (to be implemented)

## File Structure
```
client/
├── components/      # Reusable UI components
│   ├── AlertCard.tsx
│   ├── IncidentCard.tsx
│   ├── SeverityBadge.tsx
│   ├── StatusChip.tsx
│   ├── PriorityBadge.tsx
│   ├── SeveritySelector.tsx
│   └── HeaderTitle.tsx
├── screens/         # Screen components
│   ├── AlertsScreen.tsx
│   ├── AlertDetailScreen.tsx
│   ├── IncidentsScreen.tsx
│   ├── IncidentDetailScreen.tsx
│   ├── ActivityScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── CreateAlertScreen.tsx
│   └── RegisterIncidentScreen.tsx
├── navigation/      # Navigation configuration
│   └── index.tsx
├── lib/             # Utilities and store
│   ├── store.ts     # Data store with mock data
│   └── utils.ts     # Utility functions
└── constants/       # Theme and configuration
    └── theme.ts

server/
├── index.ts         # Express server entry
└── routes.ts        # API routes (placeholder)
```

## Development

### Running the App
```bash
npm run all:dev
```

This starts both the Expo development server (port 8081) and the Express server (port 5000).

### Testing
- Web: Visit the web preview
- Mobile: Scan QR code with Expo Go app

## User Preferences
- Modern iOS liquid glass interface
- Severity-based color coding (critical=red, high=orange, medium=yellow, low=blue)
- Professional, clean design without emojis

## Recent Changes
- December 2024: Initial frontend prototype with all screens and navigation
- December 2024: Fixed useSyncExternalStore infinite loop with snapshot caching
