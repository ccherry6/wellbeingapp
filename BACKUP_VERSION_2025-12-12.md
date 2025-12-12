# Project Backup - December 12, 2025

## Backup Information
- **Date**: December 12, 2025
- **Status**: Fully functional production application
- **Database**: Supabase (all migrations applied)
- **Framework**: React + TypeScript + Vite + Tailwind CSS
- **Mobile**: Capacitor configured for iOS

## Current Features

### Authentication System
- Email/password authentication via Supabase
- Password reset functionality with token-based verification
- Role-based access (student/coach)
- Account deletion with consent handling
- Automatic profile creation on signup

### Student Features
1. **Daily Wellbeing Check-in**
   - 10 wellness metrics (sleep, mood, stress, energy, etc.)
   - Optional biometric data (HRV, resting heart rate)
   - Injury/sickness tracking
   - Request to speak with school staff
   - Prevents duplicate submissions per day

2. **Progress Tracking**
   - Streak tracking (current and longest)
   - Visual progress charts
   - Historical data trends
   - Participation statistics

3. **Settings**
   - Notification preferences
   - Account deletion (with data export option)
   - Voluntary consent management

### Coach Features
1. **Student Overview Dashboard**
   - Real-time student list with latest metrics
   - Color-coded risk indicators
   - Filter by sport/status
   - Quick access to student details

2. **Analytics & Reports**
   - Weekly summaries
   - Trend analysis
   - Correlation insights
   - Alert history

3. **Student Management**
   - Deep dive into individual student data
   - Contact follow-up tracking
   - Research data export
   - Resource assignment

4. **User Management**
   - Create coach invitations
   - Manage user accounts
   - Role assignment

### Automated Systems
1. **Email Notifications**
   - Daily reminder emails (cron job)
   - Low metric alerts to coaches
   - Invitation emails
   - Password reset emails
   - Speak request notifications

2. **Database Triggers**
   - Automatic profile creation
   - Low metric detection
   - Resource recommendations
   - Audit logging

## Database Schema

### Core Tables
1. **user_profiles** - User information and settings
2. **wellness_entries** - Daily check-in data
3. **coach_invitations** - Invitation management
4. **resources** - Support resources
5. **consent_log** - Voluntary participation tracking
6. **notification_settings** - User notification preferences
7. **research_exports_audit** - Data export audit trail
8. **audit_logs** - System audit logging
9. **password_reset_tokens** - Password reset token management

### Security Features
- Row Level Security (RLS) enabled on all tables
- Restrictive policies by default
- Authentication-based access control
- Audit trail for sensitive operations
- Research data anonymization views

## Edge Functions

1. **daily-reminder-cron** - Sends daily check-in reminders
2. **delete-account** - Handles account deletion
3. **request-password-reset** - Initiates password reset flow
4. **send-invitation-email** - Sends coach invitations
5. **send-low-metric-alert** - Alerts coaches of concerning metrics
6. **send-reminder-email** - Individual reminder emails
7. **verify-reset-token** - Validates password reset tokens

## Environment Variables Required

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Files Structure

### Components
```
src/components/
├── Auth/
│   ├── AuthForm.tsx - Login/signup form
│   └── ResetPasswordPage.tsx - Password reset UI
├── Coach/
│   ├── CoachDashboard.tsx - Main coach interface
│   ├── StudentOverview.tsx - Student list view
│   ├── StudentDeepDive.tsx - Individual student details
│   ├── AnalyticsCharts.tsx - Data visualization
│   ├── ResourceManagement.tsx - Resource assignment
│   ├── UserManagement.tsx - User creation/management
│   └── [other coach components]
├── Student/
│   ├── StudentDashboard.tsx - Main student interface
│   ├── WellbeingQuestionnaire.tsx - Daily check-in form
│   ├── ProgressTracker.tsx - Streak and progress display
│   ├── StudentProgress.tsx - Historical trends
│   └── ConsentModal.tsx - Voluntary participation consent
├── Settings/
│   ├── NotificationSettings.tsx - Notification preferences
│   └── AccountDeletion.tsx - Account deletion UI
└── Layout/
    └── Header.tsx - Navigation header
```

### Utilities
```
src/lib/
├── supabase.ts - Supabase client configuration
├── dateUtils.ts - AEST timezone utilities
└── database.types.ts - TypeScript database types
```

### Hooks
```
src/hooks/
├── useAuth.ts - Authentication hook
└── useNotifications.ts - Notification management
```

## Recent Migrations (Last 10)

1. **20251206044454** - Password reset tokens table
2. **20251204005335** - Fix role switching dependencies
3. **20251204005315** - Fix role view switching
4. **20251204005300** - Remove restrictive role check
5. **20251204005254** - Fix role switching circular dependency
6. **20251204005249** - Fix role switching RLS policies
7. **20251204005244** - Research anonymization view
8. **20251204005129** - Audit log system
9. **20251204005124** - Critical RLS security improvements
10. **20251204005119** - Voluntary consent tracking

## Known Issues & Notes

### Current Status
- All core features are functional
- Database migrations are up to date
- RLS policies are properly configured
- Email notifications are working

### Timezone Configuration
- System is configured for Australian Eastern Time (AEST/AEDT)
- All date functions use Australia/Sydney timezone
- Database timezone is set to AEST

### Security Considerations
- All tables have RLS enabled
- Restrictive policies by default
- Audit logging for sensitive operations
- Research data is anonymized for exports

### Mobile App
- iOS configuration is complete
- Capacitor is configured
- App icons and splash screens are set
- Ready for iOS build

## Build & Deploy Commands

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Mobile Build
```bash
npm run build:mobile
npx cap sync
npm run ios
```

## Restore Instructions

1. **Database Restoration**
   - All migrations are in `supabase/migrations/`
   - Apply migrations in chronological order
   - Migrations are idempotent (use IF EXISTS/IF NOT EXISTS)

2. **Environment Setup**
   - Copy `.env` file with Supabase credentials
   - Ensure environment variables are set

3. **Dependencies**
   ```bash
   npm install
   ```

4. **Edge Functions**
   - All functions are in `supabase/functions/`
   - Deploy using Supabase MCP tools

## Testing Checklist

- [ ] Student can sign up and log in
- [ ] Student can complete daily check-in
- [ ] Student cannot submit twice in one day
- [ ] Coach can view student overview
- [ ] Coach can see student details
- [ ] Email notifications are sent
- [ ] Password reset works
- [ ] Account deletion works
- [ ] RLS policies prevent unauthorized access
- [ ] Mobile app builds successfully

## Database Connection Test

To verify database connectivity:
```sql
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM wellness_entries;
```

## Support Resources

### Documentation Files
- START_HERE.md - Quick start guide
- QUICK_START.md - Setup instructions
- PROJECT_SUMMARY.md - Project overview
- DEPLOYMENT_READY.md - Deployment guide
- MOBILE_BUILD_GUIDE.md - iOS build instructions
- IOS_APP_STORE_GUIDE.md - App Store submission

### Backup Files
- BACKUP_INFO.md - Backup procedures
- QUICK_BACKUP_GUIDE.md - Quick backup reference
- RESTORE_FROM_BACKUP.sh - Restoration script
- restore.sh - Alternative restore script

## Project Statistics

- **Total Migrations**: 95+
- **Total Components**: 20+
- **Total Edge Functions**: 7
- **Database Tables**: 10+
- **Lines of Code**: ~10,000+

## Maintenance Notes

### Regular Tasks
1. Monitor email delivery rates
2. Check for failed cron jobs
3. Review audit logs for security
4. Backup database regularly
5. Update dependencies monthly

### Future Enhancements
- Push notifications for mobile
- Additional analytics features
- Export to CSV functionality
- Bulk student import
- Advanced reporting

## Contact Information

### School Staff (configured in app)
- Chris Cherry - ccherry@bdc.nsw.edu.au
- Nat Titcume - ntitcume@bdc.nsw.edu.au
- Sarah Stokes - sstokes@bdc.nsw.edu.au
- Sue Oconnor - sueoconnor@bdc.nsw.edu.au
- Pat Galvin - pgalvin@bdc.nsw.edu.au
- Andrea Wiffen - awiffen@bdc.nsw.edu.au

---

**Backup Created**: December 12, 2025
**System Status**: Operational
**Last Build**: Successful
**Database Status**: All migrations applied
**Production Ready**: Yes
