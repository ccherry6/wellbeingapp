# Web Platform Deployment Guide

## Overview
This guide will help you deploy BDC Thrive to production at **thrivewellbeing.me** using Netlify (recommended) or another hosting provider.

---

## Your Production Environment

**Domain:** thrivewellbeing.me (already configured)
**Database:** Supabase (already hosted)
**Environment Variables:**
- VITE_SUPABASE_URL: https://jxprvsxqknkbxthyuudv.supabase.co
- VITE_SUPABASE_ANON_KEY: (in your .env file)
- VITE_APP_URL: https://thrivewellbeing.me

---

## Part 1: Deploy to Netlify (Recommended)

### Why Netlify?
- Free tier perfect for your needs (100GB bandwidth)
- Automatic HTTPS/SSL
- Global CDN (fast loading worldwide)
- Zero-downtime deployments
- Simple drag-and-drop or Git integration

### Step 1: Build Production Bundle

This has already been done! Your `dist` folder is ready at:
```
/tmp/cc-agent/56043404/project/dist/
```

To rebuild anytime:
```bash
npm run build
```

### Step 2: Sign Up for Netlify

1. Go to: https://www.netlify.com
2. Click "Sign Up" (top right)
3. Choose one:
   - **Sign up with GitHub** (recommended for Git integration)
   - **Sign up with Email**
4. Complete registration (free account)

### Step 3: Deploy Your Site

**Method A: Drag and Drop (Easiest for First Deployment)**

1. After logging in, you'll see your dashboard
2. Look for the deployment drop zone:
   ```
   "Want to deploy a new site without connecting to Git?
   Drag and drop your site output folder here"
   ```
3. **Important:** Drag the ENTIRE `dist` folder (not the contents inside)
4. Netlify will upload and deploy (10-30 seconds)
5. You'll get a random URL like: `https://random-name-12345.netlify.app`
6. Click the URL to test your site

**Method B: Manual Upload**

1. Click "Add new site" button
2. Select "Deploy manually"
3. Click "Browse to upload"
4. Select your `dist` folder
5. Click "Deploy site"

### Step 4: Test Temporary Site

1. Visit your temporary Netlify URL
2. **Expected:** Site loads but shows errors (database not connected)
3. This is normal - we need to add environment variables next

### Step 5: Configure Environment Variables

1. From your Netlify dashboard, click on your deployed site
2. Click "Site settings" (top navigation)
3. In left sidebar, click "Environment variables"
4. Click "Add a variable" button

**Add these three variables:**

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://jxprvsxqknkbxthyuudv.supabase.co`
- Scopes: All scopes (default)
- Click "Create variable"

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: [Copy from your .env file]
- Scopes: All scopes (default)
- Click "Create variable"

**Variable 3:**
- Key: `VITE_APP_URL`
- Value: `https://thrivewellbeing.me`
- Scopes: All scopes (default)
- Click "Create variable"

### Step 6: Trigger Rebuild with Variables

1. Go back to "Deploys" (top navigation)
2. Click "Trigger deploy" dropdown (top right)
3. Select "Clear cache and deploy site"
4. Wait 30-60 seconds for rebuild
5. Test your site again - should work now!

### Step 7: Connect Custom Domain (thrivewellbeing.me)

1. From your site dashboard, click "Domain settings" (top navigation)
2. Click "Add a domain" or "Add custom domain"
3. Enter: `thrivewellbeing.me`
4. Click "Verify"
5. Click "Add domain"

**You'll see one of two options:**

#### Option A: Use Netlify DNS (Easiest)

1. Netlify will prompt: "Would you like to set up Netlify DNS?"
2. Click "Set up Netlify DNS"
3. Netlify will show you nameservers like:
   ```
   dns1.p05.nsone.net
   dns2.p05.nsone.net
   dns3.p05.nsone.net
   dns4.p05.nsone.net
   ```
4. Go to your domain registrar (where you bought thrivewellbeing.me)
5. Find "DNS Settings" or "Nameservers" or "Domain Management"
6. Replace existing nameservers with Netlify's nameservers
7. Save changes
8. **Wait 24-48 hours for DNS propagation** (often faster)

#### Option B: Keep Your Current DNS (Alternative)

1. In Netlify, note your Netlify site URL (e.g., random-name-12345.netlify.app)
2. Go to your domain registrar's DNS management
3. Add these DNS records:

**For root domain (thrivewellbeing.me):**
```
Type: A
Name: @ (or leave blank)
Value: 75.2.60.5
TTL: 3600 (or auto)
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: random-name-12345.netlify.app (your Netlify URL)
TTL: 3600
```

4. Save all records
5. Return to Netlify and click "Verify DNS configuration"
6. Wait for verification (few minutes to 48 hours)

### Step 8: Enable HTTPS (Automatic)

1. Once DNS is verified, Netlify automatically provisions SSL certificate
2. This happens within minutes to a few hours
3. Your site will be accessible via `https://thrivewellbeing.me`
4. Netlify automatically redirects HTTP to HTTPS

### Step 9: Set Primary Domain

1. In "Domain settings", you'll see your domains listed
2. Find `thrivewellbeing.me`
3. Click the three dots (⋮) next to it
4. Select "Set as primary domain"
5. All traffic now goes to thrivewellbeing.me

---

## Part 2: Update Supabase Configuration

### Step 1: Add Production URL to Supabase

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to "Authentication" in left sidebar
4. Click "URL Configuration"

### Step 2: Add Site URL

```
Site URL: https://thrivewellbeing.me
```

### Step 3: Add Redirect URLs

Add these to "Redirect URLs":
```
https://thrivewellbeing.me
https://thrivewellbeing.me/**
https://www.thrivewellbeing.me
https://www.thrivewellbeing.me/**
```

### Step 4: Update CORS Settings

If you have custom CORS settings:
1. Go to "Settings" > "API"
2. Find "API Settings" section
3. Ensure these origins are allowed:
   ```
   https://thrivewellbeing.me
   https://www.thrivewellbeing.me
   ```

---

## Part 3: Test Production Site

### Comprehensive Testing Checklist

Visit https://thrivewellbeing.me and test:

**Authentication:**
- [ ] Registration page loads
- [ ] Can create new student account
- [ ] Can log in with email/password
- [ ] Can log out
- [ ] QR code login works
- [ ] Password reset works

**Student Features:**
- [ ] Dashboard loads after login
- [ ] Wellness questionnaire displays
- [ ] Can submit questionnaire
- [ ] Submission saves to database
- [ ] Progress charts display
- [ ] Historical data shows correctly
- [ ] Can set goals
- [ ] Can view resources

**Coach Features (if applicable):**
- [ ] Coach can log in
- [ ] Coach dashboard displays
- [ ] Student list loads
- [ ] Individual student data accessible
- [ ] Alerts system works
- [ ] Can generate QR codes
- [ ] Reports generate correctly

**Mobile Testing:**
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Can "Add to Home Screen"

**Performance:**
- [ ] Site loads in under 3 seconds
- [ ] Images load properly
- [ ] No console errors
- [ ] Smooth navigation
- [ ] Forms submit quickly

**Security:**
- [ ] HTTPS is enforced (green padlock in browser)
- [ ] Mixed content warnings? (should be none)
- [ ] Can't access other users' data
- [ ] Unauthorized routes redirect to login

---

## Part 4: Alternative Hosting Options

### Option B: Vercel

**Similar to Netlify:**
1. Go to: https://vercel.com
2. Sign up (free)
3. Import Git repository OR drag/drop dist folder
4. Add environment variables
5. Deploy
6. Connect custom domain

**Pros:**
- Excellent performance
- Free tier generous
- Great developer experience

**Cons:**
- Slightly more complex than Netlify

### Option C: Your School/Institution Server

If your school has web hosting:

**Requirements:**
- Apache or Nginx web server
- HTTPS/SSL certificate
- Ability to upload files via FTP/SFTP

**Steps:**
1. Upload entire `dist` folder contents to web root
2. Configure web server for SPA routing:

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx (config):**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

3. Set environment variables (method depends on hosting)
4. Enable HTTPS
5. Test site

---

## Part 5: Continuous Deployment (Optional)

### Set Up Git Integration

**Benefits:**
- Push code → auto deploy
- No manual uploads
- Version control
- Rollback capability

### With Netlify:

1. Push your project to GitHub
2. In Netlify, click "Add new site" → "Import an existing project"
3. Connect GitHub account
4. Select repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Add environment variables
7. Deploy

**Now:**
- Every push to `main` branch → automatic deployment
- Pull requests → preview deployments
- Can rollback to any previous deployment

---

## Part 6: Monitoring and Maintenance

### Monitor Site Performance

**Netlify Analytics (Optional, Paid):**
- Visitor statistics
- Bandwidth usage
- Popular pages

**Free Alternatives:**
- Google Analytics
- Plausible Analytics
- Simple Analytics

### Check Site Health

**Weekly:**
- Visit site and spot check
- Test login and key features
- Check for any error reports

**Monthly:**
- Review hosting bandwidth usage
- Check SSL certificate status (auto-renews)
- Test on different browsers/devices

### Updating Your Site

**When you make changes:**

1. **Make code changes locally**
2. **Build:** `npm run build`
3. **Deploy:**
   - **Drag & Drop:** Drag new dist folder to Netlify
   - **Git:** Push to GitHub (auto-deploys)
4. **Test:** Visit site and verify changes
5. **Rollback if needed:** Netlify > Deploys > Previous deploy > Publish

**Changes are live in 30-60 seconds!**

---

## Part 7: Troubleshooting

### Site Shows "Page Not Found"

**Problem:** Wrong folder uploaded or SPA routing not configured

**Solution:**
- Ensure you uploaded the `dist` folder (contains index.html)
- Check _redirects file exists in dist
- Verify SPA routing is enabled

### Database Connection Errors

**Problem:** Environment variables not set or incorrect

**Solution:**
1. Check Netlify environment variables
2. Verify variable names start with `VITE_`
3. No typos in values
4. Trigger new deploy after adding variables

### Domain Not Working

**Problem:** DNS not configured or not propagated

**Solution:**
- Check DNS records at registrar
- Use https://dnschecker.org to verify propagation
- Wait up to 48 hours for DNS propagation
- Ensure no conflicting records

### HTTPS Certificate Not Provisioning

**Problem:** DNS not verified yet

**Solution:**
- Verify DNS is fully propagated
- Check no CAA records blocking Let's Encrypt
- Contact Netlify support if > 24 hours

### Site Loads But Looks Broken

**Problem:** Assets not loading correctly

**Solution:**
- Check browser console for errors
- Verify all files uploaded
- Check `base` setting in vite.config.ts
- Clear browser cache
- Try incognito/private browsing

### Deployment Fails

**Problem:** Build errors or missing dependencies

**Solution:**
- Check build log in Netlify
- Verify package.json is correct
- Test build locally: `npm run build`
- Check Node.js version compatibility

---

## Part 8: Performance Optimization

### Already Optimized:

✅ Production build minified
✅ Assets compressed
✅ Images optimized
✅ Code splitting enabled
✅ CDN delivery (Netlify/Vercel)

### Additional Optimizations (Optional):

**1. Add Service Worker (PWA):**
```bash
npm install vite-plugin-pwa
```

**2. Enable Brotli Compression:**
- Netlify enables automatically
- Reduces bandwidth ~20%

**3. Image Optimization:**
- Use WebP format for images
- Lazy load images below fold

**4. Caching Strategy:**
- Static assets: 1 year cache
- HTML: No cache (always fresh)
- API calls: Appropriate cache headers

---

## Part 9: Security Checklist

Before going live, verify:

### SSL/HTTPS:
- [ ] HTTPS enabled (green padlock)
- [ ] HTTP redirects to HTTPS
- [ ] No mixed content warnings
- [ ] Valid SSL certificate

### Environment Variables:
- [ ] Not exposed in client code
- [ ] Only VITE_ prefixed vars in frontend
- [ ] Sensitive keys server-side only

### Supabase Security:
- [ ] RLS policies active on all tables
- [ ] Anon key is public (safe for frontend)
- [ ] Service role key never in frontend
- [ ] Production URL in allowed origins

### Content Security:
- [ ] No hardcoded credentials
- [ ] No API keys in code
- [ ] Privacy policy accessible
- [ ] Support page accessible

---

## Part 10: Cost Management

### Netlify Free Tier Limits:

- **Bandwidth:** 100 GB/month
- **Build minutes:** 300/month
- **Sites:** Unlimited
- **Team members:** 1

### Estimating Usage:

**Average page size:** ~2 MB (with assets)

**Monthly bandwidth for:**
- 50 students × 30 check-ins × 2 MB = 3 GB
- 100 students × 30 check-ins × 2 MB = 6 GB
- 200 students × 30 check-ins × 2 MB = 12 GB

**Verdict:** Free tier is sufficient for 300+ students

### If You Exceed Free Tier:

**Netlify Pro:** $19/month
- 1 TB bandwidth
- 25,000 build minutes
- More team members

---

## Part 11: Backup and Disaster Recovery

### Netlify Automatic Features:

**Deployment History:**
- Every deployment saved
- Instant rollback to any version
- No data loss

**How to Rollback:**
1. Netlify dashboard → Deploys
2. Find previous working deployment
3. Click "Publish deploy"
4. Live in seconds

### Database Backup:

**Supabase handles:**
- Automatic daily backups
- Point-in-time recovery
- Replication
- Disaster recovery

---

## Part 12: Launch Checklist

### Pre-Launch:

- [ ] Production build successful
- [ ] Deployed to Netlify
- [ ] Environment variables set
- [ ] Custom domain connected
- [ ] DNS propagated
- [ ] HTTPS enabled
- [ ] Supabase configured
- [ ] All features tested
- [ ] Mobile responsive verified
- [ ] Privacy policy live
- [ ] Support page live
- [ ] No console errors
- [ ] Performance acceptable

### Launch Day:

- [ ] Final test of all features
- [ ] Monitor for errors
- [ ] Share URL with initial users
- [ ] Provide support documentation
- [ ] Monitor bandwidth/performance

### Post-Launch:

- [ ] Gather user feedback
- [ ] Fix any reported issues
- [ ] Monitor analytics
- [ ] Plan improvements
- [ ] Regular backups verified

---

## Part 13: Sharing with Students

### Launch Announcement Template:

```
🎉 Exciting News: BDC Thrive is Now Live!

Access your wellness platform at:
https://thrivewellbeing.me

What you can do:
• Complete daily wellness check-ins
• Track your wellbeing trends
• Set and achieve personal goals
• Access mental health resources
• Connect with coaching support

Getting Started:
1. Visit thrivewellbeing.me
2. Use the QR code from your coach to register
3. Complete your first check-in
4. Explore your dashboard

Need Help?
Visit: thrivewellbeing.me/support
Email: ccherry@bdc.nsw.edu.au

On iOS? Download the BDC Thrive app from the App Store!
```

### QR Code for Easy Access:

Generate a QR code pointing to: https://thrivewellbeing.me

**Tools:**
- https://qr-code-generator.com
- https://www.qr-code-monkey.com
- Built-in QR generator in the app

---

## Part 14: Ongoing Updates

### Regular Update Schedule:

**Weekly:**
- Monitor for errors
- Check user feedback
- Quick bug fixes

**Monthly:**
- Feature updates
- Performance optimization
- Security patches

**Quarterly:**
- Major feature releases
- UI/UX improvements
- User experience surveys

### How to Deploy Updates:

1. Make changes locally
2. Test thoroughly
3. Build: `npm run build`
4. Deploy to Netlify (drag/drop or Git push)
5. Monitor for issues
6. Rollback if needed

---

## Success Metrics to Track

### Key Performance Indicators:

1. **User Engagement:**
   - Daily active users
   - Check-in completion rate
   - Average session duration

2. **Technical Performance:**
   - Page load time (<3 seconds)
   - Uptime (>99.9%)
   - Error rate (<0.1%)

3. **Support Metrics:**
   - Support requests per week
   - Response time
   - Resolution time

4. **Growth:**
   - New registrations
   - Retention rate
   - Feature adoption

---

## Quick Reference

### Important URLs:

**Production Site:** https://thrivewellbeing.me
**Privacy Policy:** https://thrivewellbeing.me/privacy.html
**Support Page:** https://thrivewellbeing.me/support.html
**Netlify Dashboard:** https://app.netlify.com
**Supabase Dashboard:** https://supabase.com/dashboard

### Key Commands:

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Build for mobile
npm run build:mobile
```

### Support Contacts:

**Netlify Support:** https://www.netlify.com/support
**Supabase Support:** https://supabase.com/support
**Domain Registrar:** Check your registrar's support

---

## Congratulations!

Your web platform is ready for production deployment!

**Next Steps:**
1. Deploy to Netlify (30 minutes)
2. Configure domain (1-48 hours for DNS)
3. Test thoroughly
4. Launch to students
5. Monitor and improve

**Total Time to Launch: 1-2 days**

Good luck with your launch! ��
