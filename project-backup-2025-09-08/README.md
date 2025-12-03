# BDC Wellbeing Monitor - Project Backup

Created: 9/8/2025, 10:06:45 AM

## What's Included

This backup contains the complete source code and configuration for the BDC High Performance Sport Wellbeing Monitoring application.

### Files Backed Up: 35
### Files Missing: 0

## Key Features
- Student daily wellbeing questionnaire (10 metrics)
- Coach analytics dashboard with multiple chart types
- QR code login system
- Role switching capabilities
- Data export (CSV, PDF, PNG)
- PWA support with notifications
- Responsive design

## Database Schema
- **user_profiles**: User information and roles
- **wellness_entries**: Daily wellbeing responses (10 metrics)
- **login_sessions**: QR code login sessions

## Restoration Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### 2. Quick Start
```bash
# Make restoration script executable (Mac/Linux)
chmod +x restore.sh

# Run restoration script
./restore.sh

# Or manually:
npm install
cp .env.example .env
# Update .env with your Supabase credentials
npm run dev
```

### 3. Database Setup
1. Create new Supabase project
2. Run SQL migration files from `supabase/migrations/`
3. Update `.env` with your Supabase URL and keys

### 4. Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## Environment Variables Needed
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Support
- Original deployment: https://student-wellbeing-ap-xmok.bolt.host
- Supabase project: mnmhkmamasbyvcpuoiwa.supabase.co

## Technology Stack
- React 18 + TypeScript
- Tailwind CSS
- Supabase (Database + Auth)
- Recharts (Analytics)
- Vite (Build tool)
- PWA capabilities
