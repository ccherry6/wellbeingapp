# 🚀 BDC Thrive - Quick Start Guide

## Deploy Your Platform in 30 Minutes

### ✅ What You Have
- Production-ready web app in `/dist` folder
- iOS project initialized in `/ios` folder
- Domain: thrivewellbeing.me
- Database: Fully configured and secured
- Apple Developer account: Active ✅

---

## 🌐 Web Deployment (Start Here!)

### Step 1: Sign Up for Netlify (2 minutes)
1. Go to https://www.netlify.com
2. Click "Sign Up" → Use GitHub or Email
3. Complete registration (free)

### Step 2: Deploy (3 minutes)
1. In Netlify dashboard, find the drop zone
2. Drag the **entire `/dist` folder** from your project
3. Wait 30 seconds
4. You'll get a URL like: `random-name-12345.netlify.app`
5. Click to test (will show errors - this is normal)

### Step 3: Add Environment Variables (5 minutes)
1. Click your site → "Site settings" → "Environment variables"
2. Add these THREE variables:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://jxprvsxqknkbxthyuudv.supabase.co`

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: Copy from your `.env` file (starts with `eyJ...`)

**Variable 3:**
- Key: `VITE_APP_URL`
- Value: `https://thrivewellbeing.me`

3. Click "Create variable" for each

### Step 4: Rebuild (2 minutes)
1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait 30-60 seconds
4. Test your site - should work now!

### Step 5: Connect Domain (5 minutes + wait)
1. Click "Domain settings" → "Add a domain"
2. Enter: `thrivewellbeing.me`
3. Follow Netlify's DNS instructions
4. Update DNS at your domain registrar
5. Wait 1-48 hours for DNS propagation

### Step 6: Update Supabase (3 minutes)
1. Go to https://supabase.com/dashboard
2. Select your project → "Authentication" → "URL Configuration"
3. Add to Redirect URLs:
   ```
   https://thrivewellbeing.me
   https://thrivewellbeing.me/**
   ```
4. Set Site URL: `https://thrivewellbeing.me`
5. Save

### Step 7: Test Everything (10 minutes)
- [ ] Visit thrivewellbeing.me
- [ ] Create test account
- [ ] Submit wellness check-in
- [ ] Verify data saves
- [ ] Test on phone
- [ ] Check all pages work

**🎉 You're live!**

---

## 📱 iOS Deployment (Do This Later)

### Requirements
- Mac computer with Xcode
- Your Apple Developer account (you have this ✅)
- 3-4 hours for initial setup

### Quick Steps
1. Open Terminal, navigate to project folder
2. Run: `npx cap open ios`
3. Follow **IOS_APP_STORE_GUIDE.md** (comprehensive guide)

**Key tasks:**
- Add app icons (use online generator)
- Configure signing with your Apple ID
- Test on your iPhone
- Take screenshots
- Submit to App Store

**Timeline:**
- Setup: 3-4 hours
- App Store review: 24-48 hours
- Total: About 1 week to launch

---

## 🆘 Quick Troubleshooting

### Web Issues

**"Site shows database errors"**
```
→ Check environment variables are set correctly
→ Trigger new deploy after adding variables
```

**"Domain not working"**
```
→ Wait up to 48 hours for DNS propagation
→ Use https://dnschecker.org to check status
```

**"HTTPS not enabled"**
```
→ DNS must be fully propagated first
→ Netlify will auto-provision SSL certificate
```

### iOS Issues

**"Can't open Xcode"**
```
→ Ensure Xcode is installed from Mac App Store
→ Run: npx cap open ios
```

**"Signing failed"**
```
→ Xcode → Preferences → Accounts
→ Add your Apple ID
→ In project: Enable "Automatically manage signing"
```

---

## 📞 Support Resources

### Documentation
- **Web deployment:** WEB_DEPLOYMENT_GUIDE.md
- **iOS deployment:** IOS_APP_STORE_GUIDE.md
- **Full overview:** DEPLOYMENT_READY.md

### External Support
- **Netlify:** https://www.netlify.com/support
- **Supabase:** https://supabase.com/support
- **Apple Developer:** https://developer.apple.com/contact

### Your Contact
- **Email:** ccherry@bdc.nsw.edu.au
- **Domain:** thrivewellbeing.me

---

## 💡 Pro Tips

1. **Deploy web first** - Get students using it immediately
2. **Test with small group** - 5-10 students before full launch
3. **iOS can wait** - Web platform works great on mobile browsers
4. **Monitor errors** - Check Netlify logs first week
5. **Gather feedback** - Iterate based on real usage

---

## ✨ What Students See

### On Web (thrivewellbeing.me)
1. Coach generates QR code
2. Student scans QR with phone
3. Opens in browser
4. Registers and completes first check-in
5. Can "Add to Home Screen" for app-like experience

### On iOS App (After App Store Launch)
1. Student downloads "BDC Thrive" from App Store
2. Opens app
3. Scans QR code or registers manually
4. Gets daily reminder notifications
5. Native app experience

---

## 📊 Success Metrics

After launch, track:
- Daily active users
- Check-in completion rate
- Support requests (should be minimal)
- Student feedback
- Coach engagement

---

## 🎯 Launch Checklist

- [ ] Deployed to Netlify
- [ ] Environment variables set
- [ ] Domain connected (or in progress)
- [ ] Supabase URLs updated
- [ ] Tested all features
- [ ] Privacy policy accessible
- [ ] Support page accessible
- [ ] QR codes generated for students
- [ ] Coach dashboard tested
- [ ] Ready to onboard students

---

## ⚡ Emergency Rollback

If something breaks after deployment:

**Netlify:**
1. Go to "Deploys" tab
2. Find previous working deployment
3. Click "Publish deploy"
4. Live in seconds

**iOS:**
1. Can't rollback once published
2. Fix issue and submit update
3. Emergency: Remove app from sale temporarily

---

## 🚀 You're Ready!

**Right now, you can:**
1. Deploy web platform in 30 minutes
2. Have students using it today
3. Add iOS app later when ready

**Start with:** WEB_DEPLOYMENT_GUIDE.md or just follow steps above!

**Have Apple Developer account:** Great! Add iOS in week 2-3

**Questions?** Check DEPLOYMENT_READY.md for comprehensive info

---

Good luck! You've got this! 🎉
