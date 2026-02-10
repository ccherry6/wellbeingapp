# .env File Backup Guide

## What is the .env file?

Your `.env` file contains critical environment variables for your application:

```
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_APP_URL=your_app_url_here
```

**Without this file, your application cannot connect to the database!**

---

## ✅ Backup Created

I've created a backup for you: `.env.backup`

**Location:** `/project/.env.backup`

---

## How to Back Up Your .env File

### Method 1: Download the File (Recommended)

1. **Locate the file:**
   - File is at: `/project/.env`
   - Backup is at: `/project/.env.backup`

2. **Copy the contents:**
   - Open `.env` in your editor
   - Copy all 3 lines
   - Paste into a secure note-taking app (NOT in public documents)

3. **Store securely:**
   - Save to password manager (like 1Password, LastPass, Bitwarden)
   - OR save to encrypted note on your computer
   - OR email to yourself (less secure but better than nothing)
   - **NEVER commit to GitHub or share publicly**

### Method 2: Manual Backup

Copy your credentials here for safekeeping:

```
Supabase URL: https://jxprvsxqknkbxthyuudv.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cHJ2c3hxa25rYnh0aHl1dWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODIsImV4cCI6MjA3NTYxNDk4Mn0.KRkPS5V6m9CW3elbBo5sZJwoHdbeXOU872X4h3W9ztE
App URL: https://thrivewellbeing.me
```

**Save these somewhere safe!**

---

## How to Restore from Backup

If you lose your `.env` file:

### Option 1: Use the Backup File
```bash
cp .env.backup .env
```

### Option 2: Recreate Manually
1. Create a new file called `.env` in your project root
2. Add these lines:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cHJ2c3hxa25rYnh0aHl1dWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg5ODIsImV4cCI6MjA3NTYxNDk4Mn0.KRkPS5V6m9CW3elbBo5sZJwoHdbeXOU872X4h3W9ztE
VITE_SUPABASE_URL=https://jxprvsxqknkbxthyuudv.supabase.co
VITE_APP_URL=https://thrivewellbeing.me
```
3. Save the file

### Option 3: Get from Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jxprvsxqknkbxthyuudv`
3. Go to Settings > API
4. Copy the `URL` and `anon/public` key
5. Recreate your `.env` file

---

## Security Best Practices

### ✅ DO:
- Keep `.env` file in your project root
- Back up to secure password manager
- Store in encrypted notes
- Keep `.env` in `.gitignore` (already done)
- Share credentials only via secure channels

### ❌ DON'T:
- **NEVER** commit `.env` to Git/GitHub
- **NEVER** share on Slack, Discord, or public forums
- **NEVER** upload to cloud storage without encryption
- **NEVER** include in screenshots or videos
- **NEVER** hard-code credentials in source files

---

## What Happens if I Lose It?

**If you lose your .env file:**
1. Your app won't connect to the database
2. Users won't be able to log in
3. All data access will fail

**To recover:**
1. Use `.env.backup` file (I created one for you)
2. Or get credentials from Supabase Dashboard
3. Or use the credentials in this document

---

## Current Backup Status

✅ **Original file:** `.env` (safe)
✅ **Backup file:** `.env.backup` (created)
✅ **In `.gitignore`:** Yes (won't be committed to Git)
✅ **Credentials documented:** Yes (in this file)

---

## Quick Backup Commands

### Create a new backup:
```bash
cp .env .env.backup
```

### Restore from backup:
```bash
cp .env.backup .env
```

### Verify backup exists:
```bash
ls -la .env*
```

### View current credentials:
```bash
cat .env
```

---

## Important Notes

1. **The `.env.backup` file is also in `.gitignore`**
   - It won't be committed to Git
   - It's only on your local machine

2. **If you deploy to production:**
   - Set environment variables in your hosting platform
   - Don't rely on the `.env` file for production
   - Use Netlify/Vercel environment variables

3. **These credentials are safe to use:**
   - The `ANON_KEY` is designed to be public-facing
   - It's protected by Row Level Security (RLS)
   - Sensitive operations require authentication

4. **Your database is protected:**
   - RLS policies prevent unauthorized access
   - Anon key can only do what policies allow
   - Admin operations require proper authentication

---

## Next Steps

1. ✅ Backup created (`.env.backup`)
2. 📋 Copy credentials to password manager
3. 🔒 Verify `.gitignore` includes `.env`
4. 💾 Save this guide for future reference

**You're all set!** Your credentials are backed up and documented.
