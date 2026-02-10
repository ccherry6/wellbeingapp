# How to Save Your Project & Deploy

## Overview

This guide shows you how to:
1. Save your project to your computer
2. Deploy the web version to go live
3. Prepare for Apple App Store submission

---

## Part 1: Save Project to Your Computer (5 minutes)

### Option A: Using the Backup Script (Recommended)

Run this command in your terminal:

```bash
./CREATE_BACKUP.sh
```

This creates a complete backup including:
- All source code
- Database migrations
- iOS project files
- Environment variables
- Documentation
- Built website

The backup will be saved at: `/tmp/BDC-Thrive-[DATE].zip`

### Option B: Manual Download from Bolt

1. Look for a download/export button in Bolt
2. Download the entire project as ZIP
3. Save to: `Documents/BDC-Thrive/`

### Option C: Manual Copy (if working locally)

Copy the entire project folder to your preferred location:

```bash
cp -r /tmp/cc-agent/56043404/project ~/Documents/BDC-Thrive/
```

### CRITICAL: Backup Your .env File!

Your `.env` file contains essential credentials:
```
VITE_SUPABASE_URL=https://jxprvsxqknkbxthyuudv.supabase.co
VITE_SUPABASE_ANON_KEY=[your key]
```

**Save this file separately** - you'll need it for all deployments!

---

## Part 2: Deploy Web App (10 minutes)

### Step 1: Build Your App

If not already built, run:

```bash
npm run build
```

This creates the `dist` folder with your complete web application.

### Step 2: Sign Up for Netlify

1. Go to: https://www.netlify.com
2. Click "Sign Up"
3. Choose "Sign up with GitHub" or use email
4. Complete registration

### Step 3: Deploy Your Site

**Drag & Drop Method:**
1. After login, find the box: "Want to deploy a new site without connecting to Git?"
2. Drag your `dist` folder into the upload area
3. Wait 30 seconds for deployment
4. Netlify generates a URL like: `https://random-name-12345.netlify.app`

### Step 4: Add Environment Variables

Your site won't work yet - you need to add your database connection:

1. Click your site in Netlify dashboard
2. Go to "Site settings"
3. Click "Environment variables" in sidebar
4. Click "Add a variable"
5. Add these TWO variables:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://jxprvsxqknkbxthyuudv.supabase.co`

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: (paste from your .env file)

6. Click "Deploys" tab
7. Click "Trigger deploy" → "Clear cache and deploy site"
8. Wait 1 minute

### Step 5: Test Your Live Site

Visit your Netlify URL and test:
- Login works
- Can create accounts
- Wellness forms submit
- Coach dashboard loads
- No errors in browser console

### Step 6: Add Custom Domain (Optional)

If you have a domain:

1. In Netlify, click "Domain settings"
2. Click "Add a domain"
3. Enter your domain (e.g., `wellbeing.bdc.nsw.edu.au`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic, takes 10-60 minutes)

**Full details**: See `NETLIFY_DEPLOYMENT_GUIDE.md`

---

## Part 3: Prepare for iOS App Store (Mac Required)

### Prerequisites

- Mac computer
- Xcode (free from Mac App Store)
- Apple Developer account ($99/year)
- Your project transferred to your Mac

### Transfer Project to Mac

1. Copy your backup ZIP to your Mac (via USB, email, cloud storage)
2. Extract to: `Documents/BDC-Thrive/`
3. Open Terminal and navigate to the folder:
   ```bash
   cd ~/Documents/BDC-Thrive/
   ```

### Install Dependencies

```bash
# Install Node packages
npm install

# Sync iOS project
npx cap sync ios
```

### Open in Xcode

```bash
npx cap open ios
```

### Complete iOS Setup

Follow the comprehensive guide: `IOS_APP_STORE_GUIDE.md`

Key steps:
1. Configure app settings (icons, bundle ID, etc.)
2. Test on your iPhone
3. Take screenshots for App Store
4. Create App Store Connect listing
5. Archive and upload build
6. Submit for review

**Timeline**:
- Setup & testing: 2-3 days
- Apple review: 2-7 days
- Total: 1-2 weeks to go live

---

## Part 4: Verify Everything

### Web App Checklist:
- [ ] Site loads at Netlify URL
- [ ] Can log in as coach
- [ ] Can register new student
- [ ] Wellness form submits successfully
- [ ] Coach can view student data
- [ ] QR code generation works
- [ ] Mobile browsers work properly
- [ ] Custom domain configured (if applicable)

### iOS App Checklist (When Ready):
- [ ] App icons added
- [ ] Bundle ID set: `com.bdc.wellbeing`
- [ ] Tested on physical iPhone
- [ ] Screenshots taken
- [ ] Privacy policy accessible
- [ ] Demo account created
- [ ] Build uploaded to App Store Connect
- [ ] Submitted for review

---

## Your Complete File Checklist

### Essential Files to Backup:
- [ ] `.env` - Database credentials (CRITICAL!)
- [ ] `src/` - All source code
- [ ] `supabase/migrations/` - Database schema
- [ ] `public/` - Assets and images
- [ ] `package.json` - Dependencies
- [ ] `ios/` - iOS project files
- [ ] All `.md` documentation files

### Generated Files (can rebuild):
- `dist/` - Built website (run `npm run build`)
- `node_modules/` - Dependencies (run `npm install`)

---

## Quick Reference Commands

```bash
# Install dependencies (first time)
npm install

# Run locally for testing
npm run dev

# Build for production
npm run build

# Create backup
./CREATE_BACKUP.sh

# iOS: Sync project
npx cap sync ios

# iOS: Open in Xcode
npx cap open ios
```

---

## Support & Resources

### Documentation:
- `DEPLOYMENT_QUICK_START.md` - Quick overview
- `NETLIFY_DEPLOYMENT_GUIDE.md` - Complete web deployment
- `IOS_APP_STORE_GUIDE.md` - Complete iOS submission
- `UPDATING_WITH_BOLT.md` - How to make changes

### Need Help?
- **Database issues**: Check Supabase dashboard
- **Web deployment**: Netlify support docs
- **iOS issues**: Apple Developer support
- **General help**: ccherry@bdc.nsw.edu.au

---

## Deployment Timeline

### Week 1 (Web):
- **Day 1**: Save project, deploy to Netlify → **GO LIVE**
- **Day 2-3**: Test thoroughly, add custom domain
- **Day 4-5**: Share with students, monitor

### Week 2 (iOS):
- **Day 1-2**: Transfer to Mac, configure Xcode
- **Day 3-4**: Test, take screenshots, set up App Store Connect
- **Day 5**: Submit to Apple
- **Day 6-12**: Apple review process
- **Day 13+**: **LIVE ON APP STORE**

---

## Important Notes

1. **Environment Variables**: Keep your `.env` file safe and backed up!

2. **Two Versions**: Web app and iOS app share the same database - they work together seamlessly.

3. **Updates**: When you make changes:
   - Rebuild: `npm run build`
   - Redeploy: Upload new `dist` to Netlify
   - iOS: Increment version, rebuild, resubmit to Apple

4. **Cost**:
   - Netlify: Free (100GB bandwidth/month)
   - Apple Developer: $99/year
   - Supabase: Currently free (paid plans if you scale)

5. **Security**: All data is encrypted and secure. Only authorized users can access their data.

---

## You're Ready!

Your project is complete and ready to deploy. Start with the web version (it's fastest), then tackle iOS when you have your Mac ready.

Good luck with your launch! 🚀
