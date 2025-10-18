# Netlify Deployment Guide for BDC Wellbeing Platform

This guide provides detailed step-by-step instructions for deploying your wellbeing platform to Netlify with a custom domain.

## Prerequisites

- Your domain name purchased (e.g., from GoDaddy, Namecheap, Google Domains, etc.)
- The `dist` folder from your project (already created by running `npm run build`)
- Your Supabase environment variables (see below)

## Your Environment Variables

You'll need these two values from your `.env` file:

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw
```

**IMPORTANT**: Keep these values secure. The ANON_KEY is safe to expose in your frontend (it's designed for public use), but don't share the full `.env` file publicly.

---

## Part 1: Create Netlify Account & Deploy

### Step 1: Sign Up for Netlify

1. Go to https://www.netlify.com
2. Click "Sign Up" (top right)
3. Choose "Sign up with GitHub" (recommended) OR use email
4. Complete the registration

### Step 2: Deploy Your Site (Drag & Drop Method)

**Option A: Drag & Drop (Easiest)**

1. After logging in, you'll see your dashboard
2. Look for the large box that says "Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"
3. Locate your `dist` folder on your computer:
   - It's in your project directory: `/tmp/cc-agent/57932523/project/dist`
   - The folder contains: `index.html`, `assets` folder, and other files
4. Drag the entire `dist` folder into the Netlify drop zone
5. Wait 10-30 seconds for upload and deployment
6. Netlify will generate a random URL like: `https://random-name-12345.netlify.app`

**Option B: Manual Upload (Alternative)**

1. Click "Add new site" button
2. Select "Deploy manually"
3. Click "Browse to upload"
4. Select your `dist` folder
5. Click "Deploy"

### Step 3: Test Your Deployed Site

1. Click the generated URL (e.g., `https://random-name-12345.netlify.app`)
2. Your site should load, but it won't work yet (database connection missing)
3. You'll see errors - this is expected! We need to add environment variables next

---

## Part 2: Add Environment Variables

### Step 1: Access Site Settings

1. From your Netlify dashboard, click on your deployed site
2. Click "Site settings" (top navigation)
3. In the left sidebar, click "Environment variables"
4. Click "Add a variable" button

### Step 2: Add First Variable

1. Click "Add a single variable"
2. **Key**: `VITE_SUPABASE_URL`
3. **Value**: `https://0ec90b57d6e95fcbda19832f.supabase.co`
4. **Scopes**: Leave as "All scopes" (default)
5. Click "Create variable"

### Step 3: Add Second Variable

1. Click "Add a variable" again
2. Click "Add a single variable"
3. **Key**: `VITE_SUPABASE_ANON_KEY`
4. **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw`
5. **Scopes**: Leave as "All scopes" (default)
6. Click "Create variable"

### Step 4: Trigger Rebuild

1. Go back to "Deploys" (top navigation)
2. Click "Trigger deploy" dropdown (top right)
3. Select "Clear cache and deploy site"
4. Wait 30-60 seconds for rebuild
5. Test your site again - it should now work fully!

---

## Part 3: Connect Your Custom Domain

### Step 1: Add Domain in Netlify

1. From your site dashboard, click "Domain settings" (top navigation)
2. Click "Add a domain" or "Add custom domain"
3. Enter your domain name (e.g., `bdcwellbeing.com` or `wellbeing.bdc.nsw.edu.au`)
4. Click "Verify"
5. Netlify will check if you own the domain
6. Click "Add domain"

### Step 2: Configure DNS Records

You have two options: **Netlify DNS (Easier)** or **External DNS**

#### Option A: Use Netlify DNS (Recommended if allowed)

1. Netlify will prompt: "Would you like to set up Netlify DNS?"
2. Click "Set up Netlify DNS"
3. Netlify will show you nameservers like:
   ```
   dns1.p05.nsone.net
   dns2.p05.nsone.net
   dns3.p05.nsone.net
   dns4.p05.nsone.net
   ```
4. Go to your domain registrar (where you bought the domain)
5. Find "DNS Settings" or "Nameservers"
6. Replace existing nameservers with Netlify's nameservers
7. Save changes
8. Wait 24-48 hours for DNS propagation (usually faster, but can take this long)

#### Option B: Use External DNS (If you can't change nameservers)

1. In Netlify, skip the DNS setup
2. Netlify will show you need to add DNS records
3. Go to your domain registrar's DNS management
4. Add these records:

   **For root domain (e.g., bdcwellbeing.com):**
   - Type: `A`
   - Name: `@` (or blank)
   - Value: `75.2.60.5` (Netlify's load balancer)
   - TTL: `3600` (or automatic)

   **For www subdomain:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-site-name.netlify.app` (your Netlify URL)
   - TTL: `3600`

   **OR, if using a subdomain (e.g., wellbeing.bdc.nsw.edu.au):**
   - Type: `CNAME`
   - Name: `wellbeing` (or your subdomain)
   - Value: `your-site-name.netlify.app`
   - TTL: `3600`

5. Save all records
6. Return to Netlify and click "Verify DNS configuration"
7. Wait for verification (can take a few minutes to 48 hours)

### Step 3: Enable HTTPS

1. Once DNS is verified, Netlify automatically provisions an SSL certificate
2. This happens automatically within minutes to a few hours
3. Your site will be accessible via `https://yourdomain.com`
4. Netlify automatically redirects HTTP to HTTPS

### Step 4: Set Primary Domain

1. In "Domain settings", you'll see your domains listed
2. Click the three dots next to your preferred domain
3. Select "Set as primary domain"
4. This ensures all traffic goes to your chosen domain

---

## Part 4: Final Configuration

### Set Up Redirects (Already Configured)

Your project already has a `_redirects` file in the `public` folder that handles single-page application routing. This was included in your deployment automatically.

### Test Everything

1. Visit your custom domain
2. Try to sign up as a coach (ccherry@bdc.nsw.edu.au)
3. Create a test student account
4. Submit a wellness questionnaire
5. Check coach dashboard
6. Generate a QR code
7. Test the QR code on a mobile device

---

## Troubleshooting

### Site Shows "Page Not Found"
- Check that you uploaded the `dist` folder, not the entire project
- Verify the `_redirects` file is present in your deployment

### Database Errors
- Verify environment variables are set correctly (no typos)
- Check that both variables start with `VITE_` (required for Vite)
- Trigger a new deploy after adding variables

### Domain Not Working
- DNS can take up to 48 hours to propagate
- Check DNS settings at your registrar
- Use https://dnschecker.org to verify DNS propagation
- Ensure there are no conflicting records

### HTTPS Certificate Not Provisioning
- Verify DNS is fully propagated first
- Check that no CAA records block Let's Encrypt
- Contact Netlify support if it takes more than 24 hours

---

## Updating Your Site in the Future

When you make changes to your app:

1. Ask Bolt to make the changes
2. Run `npm run build` to create new `dist` folder
3. Go to Netlify dashboard
4. Drag and drop the new `dist` folder to "Deploys" page
5. Netlify will automatically deploy the update
6. Changes go live in 30-60 seconds

**OR** set up continuous deployment from GitHub (more advanced - ask if you want instructions).

---

## Cost Summary

- **Netlify Free Tier**: 100GB bandwidth/month, 300 build minutes/month
- **Suitable for**: Up to 100 students checking in daily
- **If you exceed**: Netlify Pro is $19/month for 1TB bandwidth

---

## Security Checklist

- HTTPS is enabled (automatic via Netlify)
- Environment variables are configured (not in code)
- Database has Row Level Security enabled (already configured)
- Only share registration code (BDC2026) with authorized students

---

## Need Help?

**Netlify Issues:**
- Netlify Support: https://www.netlify.com/support/
- Documentation: https://docs.netlify.com

**Domain Issues:**
- Your domain registrar's support

**App Issues:**
- Ask Bolt for help
- Reference UPDATING_WITH_BOLT.md

---

## Quick Reference: What Goes Where

| What | Where |
|------|-------|
| Website files | Netlify (dist folder) |
| Database | Supabase (already hosted) |
| Environment variables | Netlify settings |
| Domain name | Your registrar (pointing to Netlify) |
| SSL certificate | Netlify (automatic) |

---

Your platform should now be live and accessible to students via your custom domain!
