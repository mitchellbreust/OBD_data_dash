# OBD Data Dashboard

A modern vehicle telemetry platform for visualizing and analyzing real-time car diagnostic data from ELM327 OBD-II devices.

## Features

- **User Authentication**: Register and login functionality with JWT token management
- **Device Token Generation**: Generate secure tokens for OBD-II device authentication
- **Manual Data Upload**: Upload CSV files containing OBD-II telemetry data
- **Real-time Analytics Dashboard**: Visualize vehicle data with interactive charts
- **Auto-refresh**: Live data updates every 5 seconds
- **Comprehensive Metrics**: Track speed, RPM, temperature, throttle, air flow, and pressure

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4 with custom dark theme
- **Charts**: Recharts for data visualization
- **UI Components**: shadcn/ui component library
- **TypeScript**: Full type safety

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Connecting to Your Backend

All API calls are currently mocked and located in `services/api.ts`. To connect to your real backend:

1. Set your API base URL in environment variables:
   \`\`\`
   NEXT_PUBLIC_API_URL=http://your-backend-url:8000
   \`\`\`

2. Replace the mock API calls in `services/api.ts` with real fetch calls. Each function is clearly marked with `// TODO: Replace with real API call`

3. Update the API endpoints to match your backend routes:
   - `POST /api/register` - User registration
   - `POST /api/login` - User authentication
   - `POST /api/create-token` - Generate device token
   - `POST /api/upload` - Upload CSV data
   - `GET /api/data` - Fetch telemetry data

### Expected CSV Format

Your CSV files should include these columns:
- timestamp
- Vehicle Speed
- Engine Coolant Temperature
- Throttle Position
- Intake Manifold Pressure
- Intake Air Temperature
- MAF Air Flow Rate
- Run Time Since Engine Start
- Barometric Pressure
- RPM

## Project Structure

\`\`\`
├── app/
│   ├── dashboard/       # Main analytics dashboard
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   ├── token/          # Device token generation
│   ├── upload/         # CSV upload page
│   └── layout.tsx      # Root layout with navigation
├── components/
│   ├── navigation.tsx  # Main navigation component
│   └── ui/            # shadcn/ui components
├── services/
│   └── api.ts         # API service layer (mock calls)
└── README.md
\`\`\`

## Authentication Flow

1. User registers or logs in
2. JWT token is stored in localStorage
3. Token is used for authenticated API requests
4. User can generate device tokens for OBD-II devices
5. Device tokens authenticate data uploads from vehicles

## Development Notes

- All pages except login/register are protected and require authentication
- The dashboard auto-refreshes data every 5 seconds when enabled
- Mock data is generated for demonstration purposes
- All API integration points are clearly marked with TODO comments

## Deployment

This project is ready to deploy on Vercel:

\`\`\`bash
vercel deploy
\`\`\`

Make sure to set your environment variables in the Vercel dashboard.

## License

MIT
