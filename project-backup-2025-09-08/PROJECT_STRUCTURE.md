# BDC High Performance Sport - Wellbeing Monitor

## Project Overview
A comprehensive wellbeing monitoring application for student athletes with coach analytics dashboard.

## Key Features
- ✅ Student daily wellbeing questionnaire (10 metrics)
- ✅ Coach analytics dashboard with multiple chart types
- ✅ QR code login system for easy student access
- ✅ Role switching for testing
- ✅ Individual student progress tracking
- ✅ Comprehensive data visualization

## File Structure

### Core Application
```
src/
├── App.tsx                          # Main application component
├── main.tsx                         # Application entry point
├── index.css                        # Global styles with custom slider styling
└── vite-env.d.ts                   # TypeScript environment definitions
```

### Authentication System
```
src/components/Auth/
├── AuthForm.tsx                     # Main login/signup form
└── QRLogin.tsx                      # QR code login interface
```

### Student Components
```
src/components/Student/
├── StudentDashboard.tsx             # Student main dashboard
├── WellbeingQuestionnaire.tsx       # Daily check-in form (10 metrics)
└── StudentProgress.tsx              # Individual progress charts
```

### Coach Components
```
src/components/Coach/
├── CoachDashboard.tsx              # Coach main dashboard
├── AnalyticsCharts.tsx             # ALL METRICS CHARTS (Line, Spider, Bar)
├── StudentOverview.tsx             # Student list with risk assessment
└── QRGenerator.tsx                 # QR code generation for student login
```

### Layout Components
```
src/components/Layout/
└── Header.tsx                      # App header with logo and role switcher
```

### Core Services
```
src/lib/
├── supabase.ts                     # Supabase client configuration
└── database.types.ts               # TypeScript database types
```

### Hooks
```
src/hooks/
└── useAuth.ts                      # Authentication logic and user management
```

## Database Schema

### Tables
1. **user_profiles** - User information and roles
2. **wellness_entries** - Daily wellbeing responses (10 metrics)
3. **login_sessions** - QR code login sessions

### Wellness Metrics (1-10 scale)
1. Sleep Quality
2. Sleep Hours (0-12 hours)
3. Energy Level
4. Training Fatigue
5. Muscle Soreness
6. Mood
7. Stress Level
8. Academic Pressure
9. Relationship Satisfaction
10. Program Belonging

## Key Analytics Features

### AnalyticsCharts.tsx - Main Analytics Component
- **Individual Metrics View**: Select any metric, see all students plotted
- **Spider Chart**: Radar chart showing all metrics for program overview
- **All Students Comparison**: Every metric with all students visible
- **Student Visibility Controls**: Toggle individual students on/off
- **Time Range Selection**: 7, 14, or 30 days
- **Color-coded Students**: Each student gets unique color
- **Interactive Tooltips**: Detailed hover information
- **FULLY RESTORED**: All comprehensive charts and graphs working
- **Supports 1-50+ Students**: Scalable for large programs

### Chart Types
1. **Line Charts**: Trend analysis over time
2. **Radar/Spider Charts**: Multi-dimensional comparison
3. **Bar Charts**: Average score comparisons
4. **Progress Indicators**: Visual metric cards

## Configuration Files
- `package.json` - Dependencies and scripts
- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `index.html` - HTML template with BDC logo favicon

## Assets
- `public/BDC Logo.jpg` - Your organization logo

## Environment Variables (in .env)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Backup Information
- Backup created: 2025-01-27 (Updated with restored analytics)
- All critical files preserved
- Database schema documented
- Ready for deployment or migration

## Usage
1. **Students**: Complete daily wellbeing check-ins
2. **Coaches**: Monitor student data through comprehensive analytics
3. **QR Login**: Generate QR codes for easy student access
4. **Role Testing**: Switch between student/coach views

## Next Steps
- Deploy to production
- Set up automated backups
- Configure user permissions
- Add data export features