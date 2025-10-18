# BDC Wellbeing Platform - Deployment Checklist

## Database Status

### Tables (All Present & Configured)
- user_profiles (with RLS enabled)
- wellness_entries (with RLS enabled)
- wellness_activities (with RLS enabled)
- wellness_resources (with RLS enabled)
- login_sessions (with RLS enabled)
- user_goals (with RLS enabled)
- coach_alerts (with RLS enabled)
- auto_alert_logs (with RLS enabled)

### Row Level Security (RLS)
All tables have proper RLS policies:
- Students can only read/write their own data
- Coaches can view all wellness entries and student profiles
- Anonymous users can create login sessions (QR code system)
- All policies use auth.uid() for proper authentication

### Current Data
- 1 user profile exists (test data)
- 1 wellness entry exists (test data)
- No coaches registered yet

## Build Status
Production build completed successfully on: October 2, 2025
- All TypeScript compiled without errors
- All assets bundled and optimized
- Ready for deployment

## Next Steps to Go Live

### 1. Create Your Coach Account
1. Visit your deployed application URL
2. Click "Sign Up"
3. Register with email: ccherry@bdc.nsw.edu.au
4. Use registration code: **BDC2026**
5. Your account will automatically have coach privileges

### 2. Test the Platform
**Student Flow:**
1. Create a test student account (use any @bdc.nsw.edu.au email)
2. Complete the daily questionnaire
3. Verify data saves correctly
4. Check student dashboard displays properly

**Coach Flow:**
1. Log in as coach (ccherry@bdc.nsw.edu.au)
2. Verify you can see all student data
3. Test creating custom alerts
4. Generate a QR code for student access
5. Export data in various formats (CSV, PDF, PNG)

### 3. Distribute to Students

**Option A: QR Code (Recommended)**
1. Log in as coach
2. Navigate to "QR Generator" section
3. Generate a QR code
4. Print and post in training areas
5. Students scan to access the platform

**Option B: Direct Link**
Share your deployment URL with students via:
- Email
- Microsoft Teams
- Student portal

**Include the Student Guide**
Distribute the `STUDENT_GUIDE.md` file to help students understand:
- How to sign up
- How to complete daily check-ins
- What each metric means
- Privacy and confidentiality

### 4. Monitor Critical Alerts

The platform automatically monitors for critical scores:
- Sleep Quality < 4
- Energy Level < 4
- Mood < 4
- Stress Level > 7
- Academic Pressure > 7

When triggered, these create alerts visible in the coach dashboard.

### 5. Configure Custom Alerts (Optional)

As a coach, you can create custom alerts for specific students or metrics:
1. Go to Coach Dashboard
2. Click "Alert History"
3. Set up alerts based on:
   - Specific metrics
   - Threshold values
   - Time periods
   - Individual students or all students

## Features Available Now

### For Students
- Daily wellbeing questionnaire (10 metrics)
- Personal progress tracking with charts
- Trend analysis over time
- Request to speak with coaches
- Report injuries or sickness
- Add private notes
- Browser notifications (opt-in)
- Export personal data

### For Coaches
- View all student data in one dashboard
- Individual student deep-dive analysis
- Multiple chart types (line, spider, bar)
- Critical alert notifications
- Contact follow-up tracking
- Custom alert configuration
- Data export (CSV, PDF, PNG)
- QR code generation for easy student access
- Alert history and management

## Security & Privacy

All data is:
- Encrypted in transit (HTTPS)
- Encrypted at rest (Supabase)
- Protected by Row Level Security
- Only accessible to authenticated users
- Compliant with privacy best practices

Students' personal data:
- Only visible to coaches and admins
- Never shared with other students
- Stored securely in Australian data centers

## Registration Code

Students need this code to sign up: **BDC2026**

Only share this code with BDC students to maintain platform security.

## Support Contacts

**Technical Issues:**
- Use Bolt to request fixes or improvements
- See UPDATING_WITH_BOLT.md for guidance

**Platform Questions:**
- Chris Cherry: ccherry@bdc.nsw.edu.au

## Success Metrics to Monitor

Track these indicators to measure platform success:
1. Daily completion rate (target: >80% of students)
2. Time to complete questionnaire (should be <2 minutes)
3. Coach response time to critical alerts (target: <24 hours)
4. Student engagement trends (check for drop-offs)

## Maintenance Schedule

**Daily:**
- Monitor critical alerts
- Respond to student requests for contact

**Weekly:**
- Review overall wellbeing trends
- Follow up on pending contacts
- Check for any technical issues

**Monthly:**
- Analyze data for patterns
- Gather student feedback
- Request improvements via Bolt if needed

## Known Limitations

1. QR code login sessions expire after 24 hours
2. Browser notifications require user permission
3. Data export limited to visible charts (not entire database)
4. Email notifications not yet implemented (future feature)

## Future Enhancements to Consider

Ask Bolt to add:
- Automated email notifications for coaches
- Weekly summary reports
- Goal-setting features
- Team/cohort comparisons
- Integration with existing BDC systems
- Mobile app version
- Advanced analytics and correlations
- Customizable dashboard widgets

---

## Ready to Launch?

If you've completed steps 1-3 above, your platform is ready for production use!

**Your deployment URL**: [Check your Bolt deployment dashboard]

**Questions?** Refer to UPDATING_WITH_BOLT.md for guidance on requesting changes or improvements.
