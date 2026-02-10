# Quick Deployment Guide

## Your Project is Ready!

All fixes have been applied. The `profiles` table issue has been resolved. Here's what to do next:

---

## Step 1: Save Project to Your Computer

**Option A: Download from Bolt (Easiest)**
1. Look for the download/export button in Bolt's interface
2. Download the entire project as a ZIP file
3. Extract it to a location like: `Documents/BDC-Thrive/`

**Option B: If working locally**
- Your project is already at: `/tmp/cc-agent/56043404/project`
- Copy this entire folder to your Documents folder or preferred location

---

## Step 2: Deploy Web App (10 minutes)

### What You'll Deploy:
The already-built `dist` folder contains your complete web application.

### Steps:
1. **Build the latest version** (if not already done):
   ```bash
   npm run build
   ```

2. **Go to Netlify**: https://www.netlify.com
   - Sign up or log in
   - Drag the `dist` folder into the upload area

3. **Add Environment Variables** in Netlify settings:
   - `VITE_SUPABASE_URL`: `https://jxprvsxqknkbxthyuudv.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (from your .env file)

4. **Add Custom Domain** (optional):
   - In Netlify, go to Domain Settings
   - Add your domain and follow DNS instructions

**Full details**: See `NETLIFY_DEPLOYMENT_GUIDE.md`

**Result**: Your web app will be live at `https://your-site.netlify.app`

---

## Step 3: Prepare for iOS Submission

### What You Need:
- A Mac computer with Xcode installed
- Apple Developer account ($99/year)
- The project folder saved to your Mac

### Before You Start:
1. Transfer the project to your Mac
2. Install dependencies:
   ```bash
   npm install
   npx cap sync ios
   ```

### Key Steps:
1. Open Xcode project: `npx cap open ios`
2. Configure app settings (Bundle ID, icons, etc.)
3. Test on your iPhone
4. Take screenshots for App Store
5. Archive and upload to App Store Connect
6. Submit for review

**Full details**: See `IOS_APP_STORE_GUIDE.md`

**Timeline**:
- Setup: 1-2 days
- Apple Review: 2-7 days
- Total: ~1-2 weeks to go live

---

## Step 4: Verify Everything Works

### After Web Deployment:
- [ ] Visit your live website URL
- [ ] Test login functionality
- [ ] Create a test student account
- [ ] Submit a wellness entry
- [ ] Check coach dashboard
- [ ] Generate a QR code for student signup

### After iOS App:
- [ ] Download from App Store
- [ ] Test all features on iPhone
- [ ] Verify data syncs with web version
- [ ] Share App Store link with students

---

## Important Files to Keep

### For Future Updates:
- `.env` - Your environment variables (BACKUP THIS!)
- `package.json` - Dependencies list
- All files in `src/` folder - Your source code
- All files in `supabase/migrations/` - Database schema

### For iOS Submission:
- `ios/` folder - iOS project files
- `public/` folder - App icons and assets
- Screenshots you take in Xcode

---

## Your Environment Variables (KEEP SECURE!)

Located in `.env` file:
```
VITE_SUPABASE_URL=https://jxprvsxqknkbxthyuudv.supabase.co
VITE_SUPABASE_ANON_KEY=[your key from .env file]
```

**CRITICAL**: Back up this file! You'll need it for all deployments.

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Run locally for testing
npm run dev

# Build for production (web)
npm run build

# Sync with iOS
npx cap sync ios

# Open iOS project in Xcode
npx cap open ios
```

---

## Support

- **Web Deployment Issues**: See `NETLIFY_DEPLOYMENT_GUIDE.md`
- **iOS Submission Issues**: See `IOS_APP_STORE_GUIDE.md`
- **Database Issues**: Check your Supabase dashboard
- **General Help**: Email ccherry@bdc.nsw.edu.au

---

## Next Steps

1. **RIGHT NOW**: Download/save this project to your computer
2. **TODAY**: Deploy to Netlify (takes 10 minutes)
3. **THIS WEEK**: Transfer to Mac and start iOS setup
4. **NEXT WEEK**: Submit to App Store

You've got this!
