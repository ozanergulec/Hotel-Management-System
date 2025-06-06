# Hotel Management System

A comprehensive hotel management solution for streamlining hotel operations, reservations, and customer management across web and mobile platforms.

## Overview

This Hotel Management System is designed to provide hotels with an efficient way to manage their daily operations, including room bookings, customer information, billing, and staff management. The system is built using a modern tech stack with a JavaScript-based frontend, C# backend services, and mobile support for on-the-go management.

## Features

- **Reservation Management**: Create, edit, and cancel room reservations
- **Customer Management**: Store and manage customer information and preferences
- **Room Inventory**: Track room availability and status in real-time
- **Billing & Invoicing**: Generate bills and process payments
- **Staff Management**: Manage employee schedules and responsibilities
- **Reporting**: Generate analytical reports for business insights
- **Mobile Access**: Manage hotel operations from mobile devices
- **Cross-platform Compatibility**: Access system from both web and mobile interfaces

## Tech Stack

- **Frontend**: JavaScript (66.4%), TypeScript (2.9%), CSS (2.9%)
- **Backend**: C# (27.7%)
- **Mobile**: React Native for iOS and Android applications
- **Other Technologies**: (0.1%)

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- .NET Core SDK (version 6.0 or higher)
- SQL Server/PostgreSQL (for database)
- React Native environment setup (for mobile development)

### Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/ozanergulec/Hotel-Management-System.git
cd Hotel-Management-System
```

2. Install backend dependencies
```bash
# Navigate to backend directory and restore packages
cd backend
dotnet restore
```

3. Install frontend dependencies
```bash
# Navigate to frontend directory
cd ../frontend
npm install
```

4. Install mobile app dependencies
```bash
# Navigate to mobile directory
cd ../mobile
npm install
```

5. Configure the application settings
   - Update database connection strings in the appropriate configuration files
   - Set up environment variables as needed

6. Start the application
```bash
# Run backend (from backend directory)
dotnet run

# Run frontend (from frontend directory)
npm start

# Run mobile app (from mobile directory)
npx react-native run-android
# or
npx react-native run-ios
```

## Usage

After installation, access the application via:
- Web browser: http://localhost:3000 (or the configured port)
- Mobile app: Install on your iOS or Android device

Log in with the default admin credentials:
- Username: `superadmin@gmail.com`
- Password: `123Pa$$word!`

(Remember to change the default credentials immediately for security purposes)

## Project Structure

```
Hotel-Management-System/
├── frontend/           # JavaScript/TypeScript frontend code
│   ├── public/         # Static assets
│   └── src/            # Source code
├── backend/            # C# backend services
│   ├── Controllers/    # API endpoints
│   ├── Models/         # Data models
│   └── Services/       # Business logic
├── mobile/             # React Native mobile application
│   ├── android/        # Android-specific files
│   ├── ios/            # iOS-specific files
│   └── src/            # Shared mobile source code
└── database/           # Database scripts and migrations
```

## Mobile Application Features

The mobile application provides essential functionality for hotel staff and managers on the go:

- Real-time room status updates
- Mobile check-in and check-out processing
- Push notifications for new bookings and requests
- Staff task assignment and tracking
- Mobile-optimized reporting dashboards
- Offline mode with data synchronization when reconnected


## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Ozan Ergüleç - [GitHub](https://github.com/ozanergulec)

Project Link: [https://github.com/ozanergulec/Hotel-Management-System](https://github.com/ozanergulec/Hotel-Management-System)