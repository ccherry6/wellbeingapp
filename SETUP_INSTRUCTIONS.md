# BDC Thrive - Complete Email Alert Setup Instructions

## 🎯 What You Now Have

I've created a complete email alert system for your BDC Thrive application:

1. **Generic Resend Email Sender** (`supabase/functions/resend-send/index.ts`)
2. **Email Service Utility** (`src/lib/emailService.ts`) 
3. **Automatic Critical Alert Detection** (integrated into the questionnaire)
4. **Alert Logging System** (tracks all sent alerts)

## 🔧 Required Setup Steps (Outside Bolt AI)

### Step 1: Set Up Resend Account
1. Go to [resend.com](https://resend.com)
2. Create a free account
3. Verify your email address
4. Get your API key from the dashboard (starts with `re_`)

### Step 2: Configure Supabase Environment Variables
1. Go to your **Supabase Dashboard** → **Project Settings** → **Environment Variables**
2. Add these two variables:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   FROM_EMAIL=alerts@bdc.nsw.edu.au
   ```
   (Replace with your actual Resend API key and desired sender email)

### Step 3: Validate Your Sender Email in Resend
1. In your Resend dashboard, go to **Domains**
2. Either:
   - Add your domain (`bdc.nsw.edu.au`) and verify it, OR
   - Use a verified email address from a domain you control
3. Make sure the `FROM_EMAIL` you set in Step 2 is validated

### Step 4: Deploy the Edge Function
You need to use the **Supabase CLI** from your local machine:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project reference)
supabase link --project-ref mnmhkmamasbyvcpuoiwa

# Deploy the resend-send function
supabase functions deploy resend-send --no-verify
```

### Step 5: Run the Database Migration
In your **Supabase SQL Editor**, run the migration I created earlier:
```sql
-- Copy and paste the entire contents of:
-- supabase/migrations/create_auto_alert_system.sql
```

## 🧪 Testing the System

### Test Critical Alert
1. **Log in as a student** (or use demo login)
2. **Submit a check-in with critical scores**:
   - Mood: 2/10
   - Stress Level: 9/10
   - Sleep Quality: 3/10
3. **Check email**: ccherry@bdc.nsw.edu.au should receive an urgent alert
4. **Check logs**: Go to Coach Dashboard → Alert Logs tab

### Test Generic Email Function
You can also test the generic email sender directly:

```bash
# Test via curl (replace with your actual Supabase URL)
curl -X POST 'https://mnmhkmamasbyvcpuoiwa.supabase.co/functions/v1/resend-send/resend/send' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "to": "ccherry@bdc.nsw.edu.au",
    "subject": "Test Email from BDC Thrive",
    "html": "<h1>Test Email</h1><p>This is a test email from your BDC Thrive system.</p>",
    "text": "Test Email - This is a test email from your BDC Thrive system."
  }'
```

## 📊 What Happens Now

### Automatic Monitoring
- **Every student submission** is automatically checked for critical scores
- **Immediate email alerts** sent to ccherry@bdc.nsw.edu.au when thresholds are met
- **Alert logs** stored in database for tracking and review
- **Spam prevention**: Only one alert per student per metric per day

### Email Alert Contents
- **Student details**: Name, ID, sport, contact info
- **Critical metrics**: Specific scores that triggered the alert
- **Recommended actions**: Immediate intervention steps
- **Dashboard links**: Direct access to full student data
- **Emergency contacts**: Crisis line numbers

### Coach Dashboard Integration
- **Alert Logs tab**: View all triggered alerts with filtering
- **Student context**: See which students have triggered alerts
- **Time tracking**: Monitor alert frequency and patterns

## 🔍 Troubleshooting

### If emails aren't sending:
1. **Check Supabase logs**: Functions → resend-send → Logs
2. **Verify environment variables**: Make sure `RESEND_API_KEY` and `FROM_EMAIL` are set correctly
3. **Check Resend dashboard**: Verify your API key is active and email domain is validated
4. **Test the function directly**: Use the curl command above

### If alerts aren't triggering:
1. **Check browser console**: Look for JavaScript errors during submission
2. **Verify critical thresholds**: Make sure you're submitting scores that meet the criteria
3. **Check database**: Ensure the `auto_alert_logs` table exists

## 🎉 You're All Set!

Once you complete these setup steps, your BDC Thrive application will have:
- **Automatic safety monitoring** for all students
- **Immediate intervention alerts** for concerning scores
- **Professional email notifications** with full context
- **Complete audit trail** of all alerts

The system provides a crucial safety net that ensures no student in distress goes unnoticed!