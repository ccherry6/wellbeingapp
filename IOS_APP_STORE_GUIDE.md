# iOS App Store Deployment Guide

## Overview
This guide will walk you through deploying BDC Thrive to the Apple App Store using your existing Apple Developer account.

---

## Prerequisites

✅ You have a Mac computer
✅ Xcode installed (from Mac App Store)
✅ Apple Developer account (paid, $99/year) - **YOU HAVE THIS**
✅ iOS project initialized (already done via `npx cap add ios`)
✅ Domain: thrivewellbeing.me

---

## Part 1: Create App Icons

### Option A: Use an Online Icon Generator (Easiest)

1. **Create a Master Icon:**
   - 1024x1024 pixels PNG image
   - No transparency (solid background)
   - Use your BDC logo with solid background color
   - High quality, sharp edges

2. **Generate All Sizes Using Online Tool:**
   - Go to: https://www.appicon.co OR https://appicon.build
   - Upload your 1024x1024 PNG
   - Select "iOS" only
   - Click "Generate"
   - Download the ZIP file

3. **Extract and Locate Files:**
   - Unzip the downloaded file
   - You'll see folders with different icon sizes
   - Keep this folder open for next step

### Option B: Use Xcode Asset Catalog

1. Open your project in Xcode:
   ```bash
   cd /path/to/your/project
   npx cap open ios
   ```

2. In Xcode, navigate to:
   - Left sidebar: `App` > `App` > `Assets.xcassets`
   - Click on `AppIcon`

3. Drag and drop your master 1024x1024 icon into the "App Store iOS 1024pt" slot

4. For other sizes, either:
   - Let Xcode auto-generate them, OR
   - Manually add each size from your icon generator

---

## Part 2: Configure Xcode Project

### Step 1: Open iOS Project in Xcode

```bash
cd /path/to/your/project
npx cap open ios
```

This will launch Xcode with your project.

### Step 2: Configure General Settings

1. **Select Project Target:**
   - In left sidebar, click the blue "App" icon at the top
   - Make sure "App" is selected under "TARGETS" (not "PROJECT")

2. **Identity Settings:**
   - **Display Name:** BDC Thrive
   - **Bundle Identifier:** com.bdc.wellbeing
   - **Version:** 1.0.0
   - **Build:** 1

3. **Deployment Info:**
   - **Deployment Target:** iOS 13.0 (or higher)
   - **Supported Orientations (iPhone):**
     - ✅ Portrait
     - ✅ Landscape Left (optional)
     - ✅ Landscape Right (optional)
     - ❌ Upside Down (uncheck)
   - **Status Bar Style:** Default

4. **Requires Full Screen:** ✅ Checked

### Step 3: Configure Signing & Capabilities

1. **Click "Signing & Capabilities" tab**

2. **Team:**
   - Click the dropdown under "Team"
   - Select your Apple Developer account/team
   - If not visible, click "Add Account" and sign in

3. **Signing:**
   - ✅ Enable "Automatically manage signing"
   - Xcode will generate provisioning profiles automatically
   - Bundle Identifier should show: com.bdc.wellbeing

4. **Add Capabilities (click + Capability):**
   - **Push Notifications** (for daily reminders)
   - **Background Modes** (check "Remote notifications")

### Step 4: Configure Info.plist Privacy Permissions

1. **Open Info.plist:**
   - Left sidebar: `App` > `App` > `Info.plist`
   - Right-click and select "Open As" > "Source Code"

2. **Add these privacy keys BEFORE the closing `</dict>` tag:**

```xml
    <key>NSCameraUsageDescription</key>
    <string>We use your camera to scan QR codes for quick and secure login to BDC Thrive.</string>

    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>Save wellness reports and progress charts to your photo library.</string>

    <key>NSFaceIDUsageDescription</key>
    <string>Use Face ID for secure and convenient login to BDC Thrive.</string>

    <key>NSUserTrackingUsageDescription</key>
    <string>This app does not track you. This permission is required by App Store guidelines.</string>

    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
    </dict>
```

3. **Save the file** (Cmd+S)

---

## Part 3: Test on Physical Device

### Step 1: Connect Your iPhone

1. Connect iPhone to Mac via USB cable
2. Unlock your iPhone
3. Trust the Mac when prompted on iPhone

### Step 2: Select Device in Xcode

1. At the top of Xcode, click the device dropdown (next to "App")
2. Select your connected iPhone (e.g., "Chris's iPhone")
3. If not visible, ensure iPhone is unlocked and trusted

### Step 3: Build and Run

1. Click the Play button (▶️) in top-left of Xcode, OR press Cmd+R
2. Xcode will build and install the app on your iPhone
3. **First time:** On your iPhone:
   - Go to Settings > General > VPN & Device Management
   - Tap your Apple ID
   - Tap "Trust [Your Apple ID]"
   - Return to home screen and launch BDC Thrive

### Step 4: Test All Features

- [ ] App launches successfully
- [ ] Login screen appears
- [ ] Can register new account
- [ ] Can log in with QR code
- [ ] Wellness questionnaire works
- [ ] Dashboard displays correctly
- [ ] Can navigate all screens
- [ ] Images load properly
- [ ] No crashes or freezes
- [ ] Performance is smooth

---

## Part 4: Prepare for App Store

### Step 1: Create Privacy Policy URL

Your privacy policy is already created at:
```
https://thrivewellbeing.me/privacy.html
```

Make sure this is accessible after you deploy your website.

### Step 2: Take Screenshots

**Required Screenshot Sizes:**

**6.7" Display (iPhone 14 Pro Max, 15 Pro Max):**
- Size: 1290 x 2796 pixels
- Need: 3-10 screenshots

**6.5" Display (iPhone 11 Pro Max, XS Max):**
- Size: 1242 x 2688 pixels
- Need: 3-10 screenshots

**How to Take Screenshots:**

1. Run app on iPhone 14 Pro Max simulator:
   - In Xcode, select "iPhone 14 Pro Max" from device dropdown
   - Build and run (Cmd+R)

2. Navigate to key screens and take screenshots:
   - **Screenshot 1:** Login screen with QR code
   - **Screenshot 2:** Daily wellness questionnaire
   - **Screenshot 3:** Progress dashboard with graphs
   - **Screenshot 4:** Wellness trends over time
   - **Screenshot 5:** Goals and resources screen
   - **Screenshot 6:** Coach dashboard (if applicable)

3. Take screenshot in simulator:
   - Window > Screenshot (or Cmd+S)
   - Screenshots save to Desktop

4. Repeat for iPhone 11 Pro Max simulator

**Pro Tip:** Use design tools like Figma or Canva to add titles and descriptions to your screenshots to make them more appealing.

### Step 3: Write App Store Metadata

Prepare this information (you'll enter it in App Store Connect):

**App Name:** BDC Thrive

**Subtitle (30 characters max):** Student Wellbeing Tracker

**Promotional Text (170 characters max):**
```
Track your daily wellness, mood, sleep, and training. Get personalized support from your coaches. Thrive in sport and life at BDC.
```

**Description (4000 characters max):**
```
BDC Thrive is the official wellbeing monitoring platform for BDC students, designed to help you track your daily wellness, identify patterns, and receive timely support from your coaching team.

FEATURES

📊 Daily Wellness Check-in
• Quick 2-minute questionnaire
• Track sleep quality, energy, mood, stress
• Monitor training fatigue and recovery
• Academic pressure tracking
• Social wellbeing indicators

📈 Visualize Your Trends
• See how your wellbeing changes over time
• Identify patterns and triggers
• Understand your wellness journey
• Data-driven insights for better performance

🎯 Set and Track Goals
• Personal wellbeing goals
• Progress tracking
• Achievement milestones
• Stay motivated

🤝 Coach Support
• Direct line to your coaching team
• Request to speak with someone
• Timely intervention when needed
• Confidential and supportive

📚 Wellbeing Resources
• Curated mental health resources
• Stress management techniques
• Sleep optimization tips
• Academic support tools

🔒 Secure and Private
• Your data is encrypted and secure
• Only accessible to your coaching team
• Compliant with Australian privacy laws
• You control your data

WHO IS IT FOR?

BDC Thrive is designed specifically for BDC student athletes to support their holistic wellbeing throughout their program. Whether you're tracking your recovery, managing academic stress, or simply want to understand yourself better, BDC Thrive provides the tools and support you need.

WHY BDC THRIVE?

Your wellbeing matters. By checking in daily, you help your coaches understand how you're doing and provide support exactly when you need it. BDC Thrive is more than just tracking – it's about creating a supportive environment where every student can thrive.

ABOUT BDC

BDC is committed to the holistic development of student athletes, supporting excellence in sport, academics, and wellbeing.

SUPPORT

Questions or need help? Contact us at ccherry@bdc.nsw.edu.au or visit thrivewellbeing.me/support
```

**Keywords (100 characters max):**
```
wellbeing,wellness,student,athlete,mood,sleep,training,health,mental health,sports
```

**Support URL:**
```
https://thrivewellbeing.me/support.html
```

**Marketing URL (optional):**
```
https://thrivewellbeing.me
```

**Privacy Policy URL:**
```
https://thrivewellbeing.me/privacy.html
```

---

## Part 5: Create App Store Connect Listing

### Step 1: Log in to App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click "My Apps"

### Step 2: Create New App

1. Click the "+" button
2. Select "New App"
3. Fill in:
   - **Platform:** iOS
   - **Name:** BDC Thrive
   - **Primary Language:** English (Australia) or English (U.S.)
   - **Bundle ID:** Select "com.bdc.wellbeing" from dropdown
   - **SKU:** BDC-THRIVE-2024 (or any unique identifier)
   - **User Access:** Full Access

4. Click "Create"

### Step 3: Fill App Information

**In the "App Information" section:**

1. **Name:** BDC Thrive (30 characters)
2. **Subtitle:** Student Wellbeing Tracker (30 characters)
3. **Category:**
   - **Primary:** Health & Fitness
   - **Secondary:** Education
4. **Content Rights:** Check box confirming you have rights

**Privacy Policy:**
- Enter: https://thrivewellbeing.me/privacy.html

**Age Rating:**
1. Click "Edit" next to Age Rating
2. Answer questionnaire (most should be "No"):
   - Unrestricted Web Access? **No**
   - Realistic Violence? **No**
   - Cartoon/Fantasy Violence? **No**
   - Sexual Content? **No**
   - Profanity? **No**
   - Alcohol/Tobacco/Drugs? **No**
   - Mature/Suggestive Themes? **No**
   - Horror/Fear Themes? **No**
   - Gambling? **No**
   - Contests/Sweepstakes? **No**
   - Made for Kids? **No** (it's for teenagers/young adults)
3. Result should be: **4+**

### Step 4: Pricing and Availability

1. **Price:** Free
2. **Availability:** Australia (or all countries)
3. **Pre-orders:** No (unless you want to set a future release date)

---

## Part 6: Build and Upload to App Store

### Step 1: Archive Your App in Xcode

1. In Xcode, select "Any iOS Device (arm64)" as the build target
   - Click the device dropdown at top
   - Select "Any iOS Device (arm64)"

2. Product > Archive (or Cmd+B to build first)
   - This may take 2-5 minutes
   - Watch for any errors in the output

3. When complete, the Organizer window will open automatically
   - Shows your archived build

### Step 2: Validate Archive

1. In Organizer, select your archive
2. Click "Validate App"
3. Select your distribution options:
   - **App Store Connect:** Selected
   - **Upload your app's symbols:** ✅ Checked (recommended)
   - **Manage Version and Build Number:** ✅ Checked
4. Click "Next"
5. Sign with your Apple Developer account
6. Review and click "Validate"
7. Wait for validation (1-2 minutes)
8. Fix any errors if validation fails

### Step 3: Distribute to App Store

1. Once validated, click "Distribute App"
2. Select "App Store Connect"
3. Distribution options:
   - **Upload:** Selected
   - **Upload your app's symbols:** ✅ Checked
   - **Manage Version and Build Number:** ✅ Checked
4. Click "Next"
5. Sign and click "Upload"
6. Wait for upload (5-10 minutes depending on connection)

### Step 4: Wait for Processing

1. Upload completes in Xcode
2. Go to App Store Connect in your browser
3. Click your app "BDC Thrive"
4. Go to "TestFlight" tab or "App Store" tab
5. Your build will show "Processing" status
6. **Wait 10-30 minutes** for Apple to process the build
7. You'll receive an email when processing is complete

---

## Part 7: Complete App Store Submission

### Step 1: Add Build to Version

1. In App Store Connect, go to "App Store" tab
2. Click on version 1.0.0
3. Under "Build", click "Select a build before you submit your app"
4. Select your processed build from the list
5. Click "Done"

### Step 2: Add Screenshots

1. Scroll to "App Preview and Screenshots"
2. For each device size:
   - **6.7" Display:** Upload 3-10 screenshots
   - **6.5" Display:** Upload 3-10 screenshots
3. Drag and drop in the order you want them displayed

### Step 3: Add Description and Metadata

1. **Promotional Text:** (optional, appears above description)
2. **Description:** Paste your 4000-character description
3. **Keywords:** Paste your keywords (100 characters max)
4. **Support URL:** https://thrivewellbeing.me/support.html
5. **Marketing URL:** https://thrivewellbeing.me (optional)

### Step 4: App Review Information

1. **Sign-in required:** Yes
2. **Demo Account:**
   - **Username:** Create a test coach account (e.g., demo@bdc.nsw.edu.au)
   - **Password:** Provide a strong password
   - **Notes:** "This is a coach account. Student accounts require QR code invitation."

3. **Contact Information:**
   - **First Name:** Chris
   - **Last Name:** Cherry
   - **Phone Number:** Your contact number
   - **Email:** ccherry@bdc.nsw.edu.au

4. **Notes:**
```
BDC Thrive is a wellbeing monitoring platform for BDC student athletes.

LOGIN INSTRUCTIONS:
- Use the provided demo coach account to test the coach dashboard
- Student registration requires a QR code invitation from coaches
- The demo account has sample student data for review

KEY FEATURES TO TEST:
- Coach dashboard with student wellness overview
- Individual student wellness trends
- Alert system for students needing support
- Wellness resource library

This app is designed for BDC students and coaching staff only. It helps monitor student wellbeing and provides early intervention support.
```

### Step 5: Version Release Options

Select one:
- **Manually release this version** (you control when it goes live)
- **Automatically release this version** (goes live as soon as approved)

Recommendation: Choose "Manually release" for first version so you can coordinate launch.

### Step 6: Submit for Review

1. Review all information one final time
2. Click "Save" at the top
3. Click "Add for Review"
4. Agree to Export Compliance: "No" (this app doesn't use encryption requiring US export compliance)
5. Agree to Content Rights
6. Click "Submit for Review"

---

## Part 8: During App Review

### Timeline
- Typical review: 24-48 hours
- Can be as fast as same day
- Sometimes up to 7 days

### Status Tracking
- Check status at: App Store Connect > App Store tab
- Statuses:
  - **Waiting for Review:** In queue
  - **In Review:** Apple is reviewing now
  - **Pending Developer Release:** Approved! (if you chose manual release)
  - **Ready for Sale:** Live in App Store

### If Rejected

**Common rejection reasons:**
1. **Missing features/content:** Add more functionality or better explanation
2. **Crashes or bugs:** Fix and resubmit
3. **Privacy policy issues:** Update privacy policy
4. **Login issues:** Provide better demo account instructions
5. **Unclear purpose:** Better description/screenshots

**What to do:**
1. Read rejection reason carefully
2. Fix identified issues
3. If code changes needed:
   - Fix code
   - Build new version
   - Increment build number
   - Archive and upload again
4. If just metadata/description issues:
   - Update in App Store Connect
   - Resubmit without new build
5. Respond to Apple if you have questions
6. Resubmit for review

---

## Part 9: Release and Launch

### When Approved

If you chose "Manually release":
1. Log in to App Store Connect
2. Click your app
3. You'll see "Pending Developer Release" status
4. Click "Release this Version"
5. App goes live within 24 hours

If you chose "Automatically release":
- App goes live automatically upon approval
- Usually within 24 hours

### Share with Students

Once live, share:

**Direct App Store Link:**
```
https://apps.apple.com/app/bdc-thrive/[YOUR-APP-ID]
```

**QR Code:**
- Generate a QR code for the App Store link
- Include in onboarding materials
- Post in common areas

**Announcement:**
```
🎉 BDC Thrive is now available on the App Store!

Download the app to:
• Track your daily wellbeing
• Monitor your wellness trends
• Access support when you need it
• Set and achieve wellness goals

Search "BDC Thrive" in the App Store or scan this QR code.
```

---

## Part 10: Post-Launch Monitoring

### Monitor Key Metrics

**App Store Connect Analytics:**
- Downloads and installations
- Crashes
- User ratings and reviews
- Session duration

**What to Watch:**
1. **Crash Rate:** Should be < 0.5%
2. **User Reviews:** Respond promptly
3. **Download Numbers:** Track adoption
4. **Update Rate:** How many users update

### Respond to Reviews

- Thank positive reviews
- Address negative reviews professionally
- Fix bugs mentioned in reviews quickly
- Show users you're listening

### Plan Updates

**When to Update:**
- Bug fixes: Release ASAP
- New features: Every 4-8 weeks
- Major updates: Every 3-6 months

**Update Process:**
1. Make code changes
2. Increment version/build number
3. Build and archive
4. Upload to App Store Connect
5. Update "What's New" section
6. Submit for review
7. Typical review: 24-48 hours

---

## Part 11: Ongoing Maintenance

### Keep App Updated

**iOS Updates:**
- When Apple releases new iOS versions, test your app
- Update if needed for compatibility

**Xcode Updates:**
- Keep Xcode updated via Mac App Store
- Rebuild app with new Xcode after major updates

### Monitor for Issues

- Enable crash reporting
- Check App Store Connect weekly
- Respond to support emails within 24 hours
- Fix critical bugs within 1 week

### Annual Renewals

- Apple Developer Program renews annually ($99)
- Renew on time to keep app in App Store
- Apple sends reminder emails

---

## Troubleshooting Common Issues

### Build Errors

**"No signing certificate found":**
- Go to Signing & Capabilities
- Ensure your Apple ID is added
- Enable "Automatically manage signing"

**"Provisioning profile doesn't match":**
- Clean build folder: Product > Clean Build Folder (Shift+Cmd+K)
- Delete derived data: Xcode > Preferences > Locations > Click arrow next to Derived Data, delete folder
- Rebuild

**"Module not found":**
```bash
cd ios/App
pod install
```

### Upload Errors

**"Missing compliance":**
- Add NSAllowsArbitraryLoads = false to Info.plist
- Declare you're not using encryption for export

**"Invalid binary":**
- Ensure you selected "Any iOS Device (arm64)"
- Not a simulator
- Archive again

### App Rejected

**"App is incomplete":**
- Add more screenshots
- Better description
- More features or better demo

**"Can't log in":**
- Provide clear demo account instructions
- Ensure demo account works
- Add "skip login" option for reviewers (if applicable)

---

## Quick Reference Checklist

### Before Submitting:
- [ ] App icons added (1024x1024 + all sizes)
- [ ] Bundle ID: com.bdc.wellbeing
- [ ] Display name: BDC Thrive
- [ ] Version: 1.0.0, Build: 1
- [ ] Privacy permissions added to Info.plist
- [ ] Tested on physical device
- [ ] Screenshots taken (6.7" and 6.5")
- [ ] Description written
- [ ] Privacy policy accessible at URL
- [ ] Support page accessible at URL
- [ ] Demo account created and tested
- [ ] Build archived and uploaded
- [ ] All App Store Connect fields filled

### After Approval:
- [ ] Release app when ready
- [ ] Share App Store link with students
- [ ] Monitor downloads and reviews
- [ ] Respond to reviews
- [ ] Fix any bugs reported
- [ ] Plan future updates

---

## Support and Resources

**Apple Developer:**
- Developer Portal: https://developer.apple.com
- App Store Connect: https://appstoreconnect.apple.com
- Documentation: https://developer.apple.com/documentation

**Capacitor:**
- Documentation: https://capacitorjs.com/docs
- iOS Guide: https://capacitorjs.com/docs/ios

**Need Help?**
- Apple Developer Support: https://developer.apple.com/contact
- Stack Overflow: Tag "swift", "ios", "capacitor"

---

## Congratulations!

You're ready to deploy BDC Thrive to the App Store!

**Estimated Timeline:**
- Day 1-2: Configure Xcode, create icons
- Day 3: Test on device, take screenshots
- Day 4-5: Set up App Store Connect, upload build
- Day 6-7: Submit for review
- Day 8-10: Review process
- Day 10+: Live in App Store!

Good luck with your launch! 🚀
