# Invitation System Guide

## Overview

The BDC Thrive platform uses a secure invitation system to onboard new coaches and student-athletes.

## How It Works

### For Coaches Sending Invitations

1. **Navigate to User Management**
   - Log in as a coach/admin
   - Go to the "User Management" section in the dashboard

2. **Send an Invitation**
   - Enter the invitee's full name
   - Enter their email address
   - Select their role (Coach or Student)
   - Click "Send Invitation Email"

3. **What Happens Next**
   - A unique invitation token is created in the database
   - An invitation email is sent via Resend email service
   - The email includes:
     - BDC logo at the top
     - Personalized welcome message
     - Clear "Accept Invitation & Sign Up" button
     - Registration code (BDC2026)
     - Step-by-step instructions
     - Contact information for support

### For Invitees Receiving Invitations

The invitation email contains:

1. **Unique invitation link** with token embedded
2. **Registration code**: BDC2026
3. **Step-by-step instructions**:
   - Click the invitation button
   - Create account using the email provided
   - Enter the registration code when prompted
   - Complete profile setup
   - Start using the platform

## Technical Details

### Database Table: `invitation_tokens`

- `id`: UUID primary key
- `email`: Email address of the invitee
- `token`: Unique invitation token (UUID)
- `role`: Role for the new user (coach/student)
- `invited_by`: UUID of the coach who sent the invitation
- `used`: Boolean flag (default: false)
- `created_at`: Timestamp

### Edge Function: `send-invitation-email`

**Endpoint**: `https://jxprvsxqknkbxthyuudv.supabase.co/functions/v1/send-invitation-email`

**Payload**:
```json
{
  "inviteeName": "John Doe",
  "inviteeEmail": "john@example.com",
  "role": "coach",
  "registrationCode": "BDC2026",
  "inviteUrl": "https://thrivewellbeing.me?token=xxx",
  "inviterName": "Chris Cherry"
}
```

**Requirements**:
- RESEND_API_KEY must be configured in Supabase edge function secrets
- Email domain must be verified in Resend account
- FROM_EMAIL: `BDC Thrive <ccherry@thrivewellbeing.me>`

### Authentication Flow

1. User clicks invitation link: `https://thrivewellbeing.me?token=xxx`
2. AuthForm component detects the token in URL parameters
3. During signup, the token is validated against the `invitation_tokens` table
4. Upon successful signup:
   - Token is marked as `used = true`
   - User profile is created with the correct role
   - Token metadata is used to pre-fill profile fields

## Email Service Configuration

### Resend Setup

1. **API Key**: Must be configured as `RESEND_API_KEY` in Supabase
2. **Domain Verification**: Verify `thrivewellbeing.me` in Resend dashboard
3. **From Address**: `ccherry@thrivewellbeing.me`

### Testing Email Delivery

To test the invitation system:

```bash
# Using curl
curl -X POST \
  https://jxprvsxqknkbxthyuudv.supabase.co/functions/v1/send-invitation-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "inviteeName": "Test User",
    "inviteeEmail": "test@example.com",
    "role": "coach",
    "registrationCode": "BDC2026",
    "inviteUrl": "https://thrivewellbeing.me?token=test-token",
    "inviterName": "Admin"
  }'
```

## Troubleshooting

### Email Not Sending

1. **Check Resend API Key**
   - Verify `RESEND_API_KEY` is set in Supabase edge function secrets
   - Check the key is valid and not expired

2. **Domain Verification**
   - Ensure `thrivewellbeing.me` is verified in Resend
   - Check DNS records are properly configured

3. **Check Edge Function Logs**
   - Go to Supabase Dashboard → Edge Functions → send-invitation-email → Logs
   - Look for error messages

### Invitation Link Not Working

1. **Token Validation**
   - Check if token exists in `invitation_tokens` table
   - Verify `used = false`
   - Ensure token hasn't expired (if expiration logic is added)

2. **URL Format**
   - Correct: `https://thrivewellbeing.me?token=xxx`
   - Token should be in query parameters

### User Can't Sign Up

1. **Registration Code**
   - Ensure they're entering: `BDC2026`
   - Code is case-sensitive

2. **Email Mismatch**
   - User must sign up with the exact email the invitation was sent to
   - Check the `invitation_tokens` table for the correct email

## Security Considerations

- Tokens are unique UUIDs - cannot be guessed
- Tokens can only be used once (marked as `used` after signup)
- Each invitation is tied to a specific email address
- Registration code provides additional verification
- Edge function uses CORS headers for security
- Email service credentials are stored securely in Supabase

## Future Enhancements

Potential improvements to consider:

1. **Token Expiration**: Add expiration time (e.g., 7 days)
2. **Resend Invitation**: Allow coaches to resend invitations
3. **Invitation History**: Track all invitations sent by each coach
4. **Email Verification**: Require email verification before full access
5. **Bulk Invitations**: Allow importing CSV of users to invite
6. **Custom Messages**: Let coaches add personal message to invitations

## Contact

For issues or questions about the invitation system:
- Email: ccherry@thrivewellbeing.me
- Check Supabase logs for technical details
- Review edge function deployment status
