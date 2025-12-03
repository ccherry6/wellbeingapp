# Password Reset Email Template Configuration

## Overview
This guide explains how to configure the password reset email template in Supabase with Thrive Wellbeing branding.

## Steps to Configure

### 1. Access Supabase Dashboard
1. Log in to your Supabase Dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### 2. Configure the Password Reset Email Template

Find the "Reset Password" template and update it with the following HTML:

```html
<h2 style="color: #1e3a8a; font-family: Arial, sans-serif;">Reset Your Thrive Wellbeing Password</h2>

<p style="font-family: Arial, sans-serif; color: #374151;">Hello,</p>

<p style="font-family: Arial, sans-serif; color: #374151;">
  You requested to reset your password for your Thrive Wellbeing account. Click the button below to create a new password:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}"
     style="background: linear-gradient(to right, #1e3a8a, #dc2626);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            display: inline-block;">
    Reset Password
  </a>
</div>

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 14px;">
  Or copy and paste this link into your browser:
</p>

<p style="font-family: Arial, sans-serif; color: #3b82f6; font-size: 14px; word-break: break-all;">
  {{ .ConfirmationURL }}
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

<p style="font-family: Arial, sans-serif; color: #6b7280; font-size: 12px;">
  <strong>Thrive Wellbeing</strong> - Wellbeing Check-in Platform
</p>

<p style="font-family: Arial, sans-serif; color: #9ca3af; font-size: 11px;">
  If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
</p>

<p style="font-family: Arial, sans-serif; color: #9ca3af; font-size: 11px;">
  This link will expire in 60 minutes for security purposes.
</p>
```

### 3. Update Email Settings

In the **Authentication** → **Settings** section:

1. **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
2. **Redirect URLs**: Add your production URL to the allowed list
3. **Email Settings**:
   - **Sender Name**: `Thrive Wellbeing`
   - **Sender Email**: Use your custom domain email if available

### 4. Test the Flow

1. Go to your login page
2. Click "Forgot password?"
3. Enter a test email address
4. Check inbox for the branded email
5. Click the reset link
6. Enter a new password
7. Verify you can log in with the new password

## Email Branding Elements

The email template includes:
- **Blue (#1e3a8a) header** matching the Thrive Wellbeing brand
- **Blue-to-red gradient button** matching the app's primary CTA styling
- **Clear sender identification** showing "Thrive Wellbeing"
- **Security messaging** about link expiration and ignoring unwanted emails
- **Professional layout** with proper spacing and typography

## Troubleshooting

### Email not received?
- Check spam/junk folders
- Verify email address is correct
- Check Supabase logs for sending errors
- Ensure email service is configured in Supabase

### Reset link doesn't work?
- Verify redirect URLs are configured correctly
- Check that the link hasn't expired (60 minute limit)
- Ensure the app is accessible at the configured URL

### Styling issues?
- Some email clients may strip certain CSS
- The template uses inline styles for maximum compatibility
- Test with multiple email clients (Gmail, Outlook, etc.)

## Security Notes

- Reset links expire after 60 minutes
- Links can only be used once
- User must confirm email ownership to reset password
- Old password remains valid until new password is set
