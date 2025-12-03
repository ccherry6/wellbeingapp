# Service Verification Checklist - Do This Now!

**Date:** December 3, 2025
**Your Correct Project:** jxprvsxqknkbxthyuudv
**Your Domain:** https://thrivewellbeing.me

---

## ✅ Step 1: Verify Netlify (MOST CRITICAL)

**Why First:** If Netlify has wrong environment variables, your entire deployed app connects to the wrong database.

### Actions:

1. **Go to:** https://app.netlify.com
2. **Log in** with your account
3. **Click** on your site (should be thrivewellbeing.me or similar name)
4. **Click** "Site settings" (top navigation bar)
5. **Click** "Environment variables" (left sidebar)

### What You Should See:

You need EXACTLY these three variables:

```
VITE_SUPABASE_URL
Value: https://jxprvsxqknkbxthyuudv.supabase.co

VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cHJ2c3hxa25rYnh0aHl1dWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODIsImV4cCI6MjA3NTYxNDk4Mn0.KRkPS5V6m9CW3elbBo5sZJwoHdbeXOU872X4h3W9ztE

VITE_APP_URL
Value: https://thrivewellbeing.me
```

### If Wrong or Missing:

**Option A: Update Existing Variable**
- Click the three dots next to the variable
- Click "Edit"
- Update the value
- Click "Save"

**Option B: Add New Variable**
- Click "Add a variable"
- Click "Add a single variable"
- Enter Key and Value exactly as above
- Click "Create variable"

### CRITICAL: After Any Changes
1. Go to "Deploys" tab (top navigation)
2. Click "Trigger deploy" button
3. Select "Clear cache and deploy site"
4. Wait for deployment to complete (1-2 minutes)

**✅ Check here when done:** ___

---

## ✅ Step 2: Verify Supabase Authentication Settings

**Why:** Wrong URLs here cause password reset emails to fail.

### Actions:

1. **Go to:** https://supabase.com/dashboard/project/jxprvsxqknkbxthyuudv
2. **Log in** if needed
3. **Click** "Authentication" (left sidebar)
4. **Click** "URL Configuration"

### What You Should See:

**Site URL:**
```
https://thrivewellbeing.me
```

**Redirect URLs:** (should include all of these)
```
https://thrivewellbeing.me/**
https://thrivewellbeing.me/reset-password
http://localhost:5173/**
```

### If Wrong:

**Fix Site URL:**
- Change the Site URL field to: `https://thrivewellbeing.me`
- Click "Save"

**Fix Redirect URLs:**
- In the "Redirect URLs" section, add each URL on a new line
- Include the wildcard `/**` for main domain
- Include specific `/reset-password` path
- Include localhost for testing
- Click "Save"

**✅ Check here when done:** ___

---

## ✅ Step 3: Verify Supabase Email Templates

**Why:** Email templates might have old project URLs embedded.

### Actions:

1. **Still in Supabase Dashboard**
2. **Click** "Authentication" (left sidebar)
3. **Click** "Email Templates"
4. **Check each template:**

### Templates to Verify:

#### A. Reset Password Template
- Click "Reset Password"
- Look for the button/link in the template
- Should contain: `{{ .SiteURL }}/reset-password` or `{{ .ConfirmationURL }}`
- **Should NOT contain:** Any hardcoded URLs like `https://0ec90b57d6e95fcbda19832f.supabase.co`

#### B. Confirm Email Template
- Click "Confirm Email"
- Look for the button/link
- Should contain: `{{ .ConfirmationURL }}`

#### C. Invite User Template
- Click "Invite User"
- Look for the button/link
- Should contain: `{{ .ConfirmationURL }}`

### If Wrong:

- Click "Revert to default" to get the correct Supabase template
- OR manually edit to use `{{ .SiteURL }}` or `{{ .ConfirmationURL }}`
- Click "Save"

**✅ Check here when done:** ___

---

## ✅ Step 4: Verify Supabase Edge Functions

**Why:** Your edge functions need to be deployed to the correct project.

### Actions:

1. **Still in Supabase Dashboard**
2. **Click** "Edge Functions" (left sidebar)
3. **You should see these functions:**
   - `send-reminder-email`
   - `send-low-metric-alert`
   - `send-invitation-email`
   - `daily-reminder-cron`

### What to Check:

- All functions show as "Active" or "Deployed"
- Click on each function to see deployment date
- Should show recent deployment dates

### If Functions Missing or Old:

**Tell me and I'll redeploy them for you.** This requires using the Supabase tools.

**✅ Check here when done:** ___

---

## ✅ Step 5: Verify Resend Email Service

**Why:** Resend must be connected to send emails from your app.

### Actions:

1. **Go to:** https://resend.com/emails
2. **Log in** with your account
3. **Check recent emails:**
   - Look for any test emails or invitations
   - Check if they're being delivered or failing

4. **Check API Keys:**
   - Go to: https://resend.com/api-keys
   - Find your active API key
   - Make sure it's not expired or revoked

5. **Check Domain:**
   - Go to: https://resend.com/domains
   - Verify `thrivewellbeing.me` is listed and verified
   - Should show green checkmarks for DNS records

### If Domain Not Verified:

**You need to add DNS records:**
- Resend will show you which DNS records to add
- Add them in your domain registrar (where you bought the domain)
- Wait for verification (can take a few hours)

### If API Key Issues:

**Update Supabase with correct key:**
- In Resend, copy your API key
- Go back to Supabase Dashboard
- Settings → Vault → Add Secret
- Name it `RESEND_API_KEY`
- Paste your API key
- Save

**✅ Check here when done:** ___

---

## ✅ Step 6: Test the Forgot Password Flow

**Why:** This is the main feature you're concerned about.

### Actions:

1. **Open your app:** https://thrivewellbeing.me
2. **Click** "Forgot Password?"
3. **Enter** a test email (or your coach email)
4. **Click** "Send Reset Link"
5. **Check the email inbox** for reset email
6. **Click the reset link** in the email
7. **Verify** it takes you to: `https://thrivewellbeing.me/reset-password`
8. **Enter** a new password
9. **Verify** it successfully updates

### Expected Behavior:

- Reset link email arrives within 1-2 minutes
- Link points to `thrivewellbeing.me/reset-password` (NOT localhost, NOT wrong domain)
- Reset page loads and shows "Set New Password" form
- Password updates successfully
- Redirects to login page

### If It Fails:

**Check browser console:**
- Press F12 to open developer tools
- Look for red errors
- Take a screenshot and share with me

**Common Issues:**
- Email doesn't arrive → Check Resend (Step 5)
- Link goes to wrong URL → Check Supabase Auth Settings (Step 2)
- Reset page shows error → Check Netlify environment variables (Step 1)

**✅ Check here when done:** ___

---

## ✅ Step 7: Verify GitHub (If Using)

**Why:** If you're syncing code to GitHub, make sure it's the right project.

### Actions:

1. **Go to:** Your GitHub repository
2. **Check** if `.env` file exists
   - It should NOT be visible in the repo (security risk)
   - Check `.gitignore` includes `.env`

3. **If using GitHub Actions:**
   - Go to Settings → Secrets and variables → Actions
   - Check if secrets match your correct values

### What You Should See:

**.gitignore should include:**
```
.env
.env.local
.env.production
```

**GitHub Secrets (if used):**
- Should match your `.env` values
- Should reference project `jxprvsxqknkbxthyuudv`

**✅ Check here when done:** ___

---

## ✅ Step 8: Verify Local Environment (Bolt.new)

**Why:** Make sure Bolt is using the right configuration.

### Actions:

1. **Check your `.env` file** (already correct based on my verification)
2. **Should contain:**

```
VITE_SUPABASE_URL=https://jxprvsxqknkbxthyuudv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cHJ2c3hxa25rYnh0aHl1dWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODIsImV4cCI6MjA3NTYxNDk4Mn0.KRkPS5V6m9CW3elbBo5sZJwoHdbeXOU872X4h3W9ztE
VITE_APP_URL=https://thrivewellbeing.me
```

**✅ This is already correct!** ✓

---

## 📊 Quick Diagnostic

After completing all steps, run this diagnostic:

### Test 1: Can users sign up?
- Go to https://thrivewellbeing.me
- Try to register a test account
- **Expected:** Account created successfully

### Test 2: Can users reset password?
- Click "Forgot Password"
- Enter email and submit
- Check email inbox
- Click reset link
- **Expected:** Link works and password resets

### Test 3: Do coaches see students?
- Log in as coach (ccherry@bdc.nsw.edu.au)
- View dashboard
- **Expected:** See list of students and their data

### Test 4: Do questionnaires save?
- Log in as student
- Fill out wellness questionnaire
- Submit
- **Expected:** Data appears in coach dashboard

---

## 🚨 Common Error Messages & Fixes

### "Invalid password reset link"
**Cause:** Netlify has wrong Supabase URL
**Fix:** Complete Step 1, then Step 6 again

### "Failed to send email"
**Cause:** Resend not configured or domain not verified
**Fix:** Complete Step 5

### "Session error" or "Auth error"
**Cause:** Supabase redirect URLs not configured
**Fix:** Complete Step 2

### "Database error" or "Row Level Security" error
**Cause:** Connected to wrong Supabase project
**Fix:** Complete Step 1 (Netlify env vars)

---

## 📝 Completion Summary

Once you've completed all steps, you should have:

- ✅ Netlify pointing to correct Supabase project (jxprvsxqknkbxthyuudv)
- ✅ Supabase Site URL set to https://thrivewellbeing.me
- ✅ Supabase redirect URLs configured
- ✅ Supabase email templates using correct variables
- ✅ Resend domain verified and connected
- ✅ All edge functions deployed
- ✅ Password reset flow working end-to-end
- ✅ All environment variables aligned across services

---

## 🆘 Still Having Issues?

If after completing this checklist you still have problems:

1. **Share specific error messages** you're seeing
2. **Tell me which step failed** and what you observed
3. **Share screenshots** of error messages or configuration screens
4. **Let me know** the result of the Quick Diagnostic tests

I can then help troubleshoot the specific issue!

---

**Save this checklist and use it any time you add new features or make configuration changes.**
