# BDC Thrive - Mobile App Build Guide

This guide explains how to build and run the BDC Wellbeing Platform as a native iOS app on your iPhone.

## Important Notes

- **Your web app is completely unchanged** - The web version continues to work exactly as before
- **Separate build target** - Mobile builds are completely independent from web builds
- **Same codebase** - You maintain one React application that works on both web and mobile

## Prerequisites

1. **Mac Computer** - Required for iOS development
2. **Xcode** - Download from Mac App Store (free, ~15GB)
3. **iPhone** connected via USB cable
4. **Apple ID** - Free account is sufficient for development testing

## First-Time Setup

### Step 1: Build the Web Application

```bash
npm run build
```

This creates the `dist` folder with your compiled web application (same as always).

### Step 2: Sync Web Build to iOS Project

```bash
npx cap sync ios
```

This copies your web build into the iOS native wrapper. The `ios` folder now contains a complete Xcode project.

### Step 3: Open Xcode

```bash
npm run ios
```

Or manually:

```bash
npx cap open ios
```

This launches Xcode with your iOS project.

## Building and Running on Your iPhone

### In Xcode:

1. **Connect your iPhone** to your Mac via USB cable

2. **Trust your Mac on iPhone** - Unlock your iPhone and tap "Trust" when prompted

3. **Select your device** - At the top of Xcode, click the device dropdown and select your connected iPhone

4. **Sign the app** (first time only):
   - Click on the project name in the left sidebar (blue "App" icon)
   - Select "Signing & Capabilities" tab
   - Under "Team", click "Add Account" if needed
   - Sign in with your Apple ID
   - Select your Apple ID as the team

5. **Click the Play button** (▶️) in the top-left corner of Xcode

6. **On your iPhone** (first time only):
   - Go to Settings > General > VPN & Device Management
   - Tap on your Apple ID email
   - Tap "Trust [Your Apple ID]"
   - Go back to your home screen

7. **The app should now launch** on your iPhone!

## Making Updates

When you make changes to your React code:

```bash
# Build the updated web app and sync to mobile
npm run build:mobile

# Then in Xcode, click the Play button again
```

## Common Issues

### "Developer Mode Required" (iOS 16+)

On your iPhone: Settings > Privacy & Security > Developer Mode > Enable

### "Untrusted Developer"

Go to Settings > General > VPN & Device Management > Trust your developer certificate

### "App expires after 7 days"

With a free Apple Developer account, apps need to be reinstalled weekly. To avoid this, enroll in Apple Developer Program ($99/year).

### Build Errors in Xcode

Try cleaning the build:
- In Xcode: Product > Clean Build Folder (Shift+Cmd+K)
- Then rebuild

## Web Development (Unchanged)

Your normal web development workflow continues to work exactly as before:

```bash
# Local development (browser)
npm run dev

# Build for web deployment
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
project/
├── src/                    # Your React app (unchanged)
├── dist/                   # Web build output (unchanged)
├── ios/                    # iOS native project (auto-generated)
├── capacitor.config.ts     # Mobile config (doesn't affect web)
└── package.json           # Added mobile scripts, web scripts unchanged
```

## What's Different on Mobile?

- Same React codebase
- Native iOS wrapper
- Can access device features (camera, notifications, etc.)
- Runs offline after initial load
- Feels like a native app

## Next Steps

Once testing is complete, you can:

1. **TestFlight** - Distribute to beta testers (requires $99/year Apple Developer Program)
2. **App Store** - Public release (requires $99/year and Apple review)

## Questions?

The web app works exactly as before. Mobile is a separate build target that doesn't interfere with web development or deployment.
