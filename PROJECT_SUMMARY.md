# BDC Wellbeing Monitor - Project Summary

## 🎯 **Project Overview**
A comprehensive wellbeing monitoring application for BDC High Performance Sport Program students with coach analytics dashboard.

**Live URL:** https://student-wellbeing-ap-xmok.bolt.host

## 🔑 **Key Features Implemented**

### **Student Features:**
- Daily wellbeing questionnaire (10 metrics: sleep quality/hours, energy, training fatigue, muscle soreness, mood, stress, academic pressure, relationships, program belonging)
- "Speak to someone" feature with staff autocomplete
- Individual progress tracking with charts
- Notification settings for daily reminders
- PWA support for mobile installation

### **Coach Features:**
- Student overview with risk assessment (low/medium/high)
- Comprehensive analytics with multiple chart types:
  - Individual metrics view (all students for one metric)
  - Individual student view (all metrics for one student) 
  - Spider/radar charts for multi-dimensional comparison
  - All students comparison view
- Student visibility controls (show/hide individual students)
- Data export (CSV, PDF, PNG)
- QR code generation for student login
- Color-coded 7-day average scores (green/orange/red)

### **Authentication:**
- Email/password login with remember functionality
- QR code login system
- Demo access with public QR code
- Admin view switching (ccherry@bdc.nsw.edu.au can switch between student/coach modes)

## 🗄️ **Database Schema (Supabase)**

### **Tables:**
1. **user_profiles** - User info, roles, notification settings
2. **wellness_entries** - Daily responses (10 metrics + notes + speak_to_who/email)
3. **login_sessions** - QR code sessions

### **Key Fields Added:**
- `wants_to_speak` (boolean)
- `speak_to_who` (text) 
- `speak_to_email` (text)
- `notification_settings` (jsonb)

## 🎨 **Recent Implementations**

### **Staff Autocomplete System:**
```javascript
const schoolStaff = [
  { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@bdc.nsw.edu.au', role: 'School Counselor' },
  // Add your actual staff here
]
```

### **Individual Student Analytics:**
- New "Individual Student" tab in coach analytics
- Student dropdown selection
- Individual metrics line chart
- Individual spider chart
- Color-coded 7-day average score cards

### **Color Coding Logic:**
- **Green:** Good scores (7-10 for positive metrics, 1-4 for stress/fatigue)
- **Orange:** Moderate (5-6 for all metrics)
- **Red:** Concerning (1-4 for positive metrics, 7-10 for stress/fatigue)

## 🔧 **Technical Stack**
- React 18 + TypeScript
- Tailwind CSS with custom slider styling
- Supabase (database + auth)
- Recharts for analytics
- Vite build tool
- PWA capabilities

## 🚀 **Deployment**
- Hosted on Bolt Hosting
- Includes `_redirects` file for proper routing
- PWA manifest and service worker configured

## 🔐 **Admin Access**
- Email: ccherry@bdc.nsw.edu.au
- Can switch between student/coach views via header button
- Full access to all analytics and QR generation

## 📱 **Mobile Optimizations**
- Responsive design for all screen sizes
- PWA installation prompts
- Touch-friendly sliders and controls
- Remember login functionality

## 🎯 **Key Files to Know**
- `src/components/Student/WellbeingQuestionnaire.tsx` - Main questionnaire with staff autocomplete
- `src/components/Coach/AnalyticsCharts.tsx` - All analytics views and charts
- `src/components/Coach/StudentOverview.tsx` - Student list with risk assessment
- `src/hooks/useAuth.ts` - Authentication logic with view mode switching
- `src/contexts/ViewModeContext.tsx` - View mode state management

## 🔄 **Recent Fixes**
- Fixed login "Load failed" error with better error handling
- Added remember login functionality
- Fixed individual student analytics selection
- Added color coding to student score cards
- Improved mobile login experience

## 📋 **To Continue Development**
1. Update `schoolStaff` array with actual BDC staff
2. Test all features on mobile devices
3. Verify Supabase connection is stable
4. Consider adding email notifications for "speak to someone" requests

This summary contains all the essential information to continue development without needing the full conversation history.