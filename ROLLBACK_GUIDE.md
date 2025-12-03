# Complete Rollback & Restoration Guide

**Created:** October 19, 2025
**Purpose:** Instructions to save current version and restore it if future updates cause issues

---

## 1. Save Current Version Locally

### Option A: Manual Backup (Recommended)
```bash
# Navigate to your project directory
cd /path/to/your/project

# Create backup with timestamp
mkdir ../bdc-backup-$(date +%Y-%m-%d-%H%M%S)
cp -r . ../bdc-backup-$(date +%Y-%m-%d-%H%M%S)/

# Or create a zip archive
zip -r ../bdc-backup-$(date +%Y-%m-%d-%H%M%S).zip . -x "node_modules/*" -x ".git/*"
```

### Option B: Git Tag
```bash
# Tag current version
git tag -a v1.0-stable -m "Stable version before updates"
git push origin v1.0-stable
```

---

## 2. Resend Rollback Instructions

### Current Configuration
- **Sender Email:** ccherry@thrivewellbeing.me
- **Domain:** thrivewellbeing.me

### Edge Functions Using Resend
1. `send-reminder-email` - Daily student reminders
2. `send-low-metric-alert` - Coach wellness alerts
3. `send-invitation-email` - Coach/student invitations (if updated)

### Rollback Steps

#### A. Restore Edge Functions via Bolt.new CLI
```bash
# If you have the backed-up edge function files, redeploy them
# (Bolt.new will handle deployment automatically when you restore files)
```

#### B. Restore via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/functions
2. For each function (`send-reminder-email`, `send-low-metric-alert`):
   - Click on the function name
   - Click "Edit function"
   - Replace code with backed-up version
   - Click "Deploy"

#### C. Verify Resend API Key
1. Go to: https://resend.com/api-keys
2. Ensure API key `re_gF9DQPwg_6EsGNJedgZR6eqZp2TJyQzrw` is active
3. If issues occur, generate new key and update Supabase secrets:
   ```bash
   # Update via Supabase CLI (if installed)
   supabase secrets set RESEND_API_KEY=your_new_key
   ```

#### D. Current Edge Function Code Backup

**send-reminder-email/index.ts:**
```typescript
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  studentName: string;
  studentEmail: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend('re_gF9DQPwg_6EsGNJedgZR6eqZp2TJyQzrw');
    const { studentName, studentEmail }: EmailRequest = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'BDC Wellbeing <ccherry@thrivewellbeing.me>',
      to: [studentEmail],
      subject: 'Time to Log Your Wellbeing! 🌟',
      html: `
        <h2>Hi ${studentName}!</h2>
        <p>This is your friendly reminder to log your wellbeing metrics for today.</p>
        <p>Taking a moment to check in with yourself helps track your progress and identify patterns.</p>
        <p><strong>Click here to log your metrics:</strong> <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}">Log Wellbeing</a></p>
        <p>Keep up the great work! 💪</p>
        <p>- BDC Wellbeing Team</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**send-low-metric-alert/index.ts:**
```typescript
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  studentName: string;
  studentEmail: string;
  metricName: string;
  metricValue: number;
  coachEmail: string;
  coachName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend('re_gF9DQPwg_6EsGNJedgZR6eqZp2TJyQzrw');
    const { studentName, studentEmail, metricName, metricValue, coachEmail, coachName }: AlertRequest = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'BDC Wellbeing Alerts <ccherry@thrivewellbeing.me>',
      to: [coachEmail],
      subject: `🚨 Low Wellbeing Alert: ${studentName}`,
      html: `
        <h2>Low Wellbeing Metric Detected</h2>
        <p>Hi ${coachName},</p>
        <p>This is an automated alert regarding one of your students:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
          <p><strong>Student:</strong> ${studentName} (${studentEmail})</p>
          <p><strong>Metric:</strong> ${metricName}</p>
          <p><strong>Value:</strong> ${metricValue}/10</p>
        </div>
        <p>This metric has fallen below the threshold (≤3). Please consider reaching out to provide support.</p>
        <p><strong>Access Dashboard:</strong> <a href="${Deno.env.get('APP_URL') || 'https://your-app-url.com'}">View Details</a></p>
        <p>- BDC Wellbeing Platform</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 3. GitHub Rollback Instructions

### Current Repository
- Check your GitHub repository URL in the project

### Rollback Methods

#### Option A: Revert to Tagged Version
```bash
# List all tags
git tag

# Checkout the stable tag
git checkout v1.0-stable

# Create new branch from this point
git checkout -b rollback-branch

# Push to GitHub
git push origin rollback-branch
```

#### Option B: Revert Specific Commits
```bash
# View commit history
git log --oneline

# Revert to specific commit (replace COMMIT_HASH)
git revert COMMIT_HASH

# Or reset to specific commit (WARNING: destructive)
git reset --hard COMMIT_HASH
git push origin main --force
```

#### Option C: Restore Entire Repository
```bash
# If you have the backup folder
cd /path/to/backup-folder

# Initialize git if needed
git init
git add .
git commit -m "Restore stable version"

# Push to GitHub (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -f origin main
```

---

## 4. Netlify Rollback Instructions

### Current Deployment
- Site URL: Check your Netlify dashboard
- Build Command: `npm run build`
- Publish Directory: `dist`

### Rollback Methods

#### Option A: Use Netlify's Built-in Rollback
1. Go to: https://app.netlify.com
2. Select your site
3. Click "Deploys" in the top menu
4. Find the stable deployment (before your updates)
5. Click the deployment
6. Click "Publish deploy" button
7. Confirm the rollback

**Advantages:**
- Instant rollback
- No code changes needed
- Can preview before publishing

#### Option B: Deploy from Local Backup
```bash
# Navigate to your backup folder
cd /path/to/backup-folder

# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Netlify using CLI (if installed)
netlify deploy --prod --dir=dist

# Or manually upload dist folder via Netlify dashboard
```

#### Option C: Trigger Deployment from GitHub Tag
1. In Netlify dashboard, go to "Site settings" → "Build & deploy"
2. Under "Deploy contexts", configure production branch
3. Set production branch to your stable tag/branch
4. Trigger new deployment

### Verify Netlify Environment Variables
After rollback, ensure these are set correctly:
1. Go to: Site settings → Environment variables
2. Verify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Any other custom variables

---

## 5. Complete Restoration Checklist

When rolling back to this version, verify:

### Frontend (Netlify)
- [ ] Deployment successful
- [ ] Environment variables correct
- [ ] Site loads without errors
- [ ] Login/authentication works
- [ ] Coach dashboard accessible
- [ ] Student dashboard accessible

### Backend (Supabase)
- [ ] Database tables intact (check migrations)
- [ ] Edge functions deployed and active
- [ ] RLS policies working correctly
- [ ] Authentication flows working

### Email System (Resend)
- [ ] API key valid and active
- [ ] Domain verified (thrivewellbeing.me)
- [ ] Test emails sending successfully
- [ ] Edge functions can call Resend API

### Testing After Rollback
```bash
# Test student reminder email
# (Via Supabase dashboard → Edge Functions → send-reminder-email → Invoke)
{
  "studentName": "Test Student",
  "studentEmail": "test@example.com"
}

# Test low metric alert
# (Via Supabase dashboard → Edge Functions → send-low-metric-alert → Invoke)
{
  "studentName": "Test Student",
  "studentEmail": "student@example.com",
  "metricName": "Sleep Quality",
  "metricValue": 2,
  "coachEmail": "coach@example.com",
  "coachName": "Test Coach"
}
```

---

## 6. Quick Reference: Current System State

### Database Schema (Key Tables)
- `profiles` - User profiles (coaches and students)
- `wellbeing_entries` - Student daily check-ins
- `students` - Student-specific data
- `invitations` - Coach/student invitations
- `critical_alerts` - Alert history
- `resources` - Educational resources
- `notification_settings` - User notification preferences

### Edge Functions (Active)
1. `daily-reminder-cron` - Scheduled daily reminders
2. `send-reminder-email` - Email sending for reminders
3. `send-low-metric-alert` - Wellness alert emails
4. `send-invitation-email` - Invitation emails
5. `delete-student` - Student data removal
6. `process-invitations` - Invitation processing

### Frontend Routes
- `/` - Login/Home
- `/student` - Student dashboard
- `/coach` - Coach dashboard
- `/settings` - User settings

### Key Features
- Email/password authentication
- Daily wellbeing check-ins (8 metrics)
- Coach analytics and student monitoring
- Automated email alerts
- QR code login for students
- Resource management
- Contact follow-up tracking

---

## Emergency Contacts

**If you need help:**
1. Check Supabase Dashboard for edge function logs
2. Check Netlify Deploy logs for build errors
3. Check browser console for frontend errors
4. Check Resend dashboard for email delivery status

**Support Resources:**
- Supabase Docs: https://supabase.com/docs
- Netlify Docs: https://docs.netlify.com
- Resend Docs: https://resend.com/docs

---

## Notes

- This guide assumes you're using the current configuration with `thrivewellbeing.me` domain
- Always test in a non-production environment first if possible
- Keep multiple backups (local + GitHub tag + Netlify deployment history)
- Document any customizations you make for future reference

**Last Updated:** October 19, 2025
**Version:** 1.0-stable
