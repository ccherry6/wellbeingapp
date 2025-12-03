# Authentication Flow Guide

## Overview

This document explains how authentication, login, logout, and user switching works in the BDC Thrive application.

## Key Features

### 1. User Login
- Email and password authentication via Supabase Auth
- Automatic profile loading after successful login
- Session persistence across page reloads
- Clear error messages for invalid credentials

### 2. User Logout
- Complete session cleanup
- Clears local storage and session storage
- Forces page reload to reset all state
- Redirects to login page

### 3. Multiple Users on Same Device
- Clean logout ensures no data from previous user
- Each login starts fresh with new session
- No cross-contamination between user sessions

### 4. Session Management
- Automatic session refresh via Supabase
- Handles expired tokens gracefully
- Detects and clears invalid refresh tokens
- Maintains user state across app navigation

## Technical Implementation

### Auth State Management (useAuth hook)

**Shared State Pattern:**
- Uses a singleton pattern to share auth state across all components
- Prevents multiple simultaneous auth initializations
- Efficient re-renders with listener pattern

**Key Functions:**

1. **signIn(email, password)**
   ```typescript
   // Signs in user with email/password
   // Automatically fetches user profile after successful login
   // Clears URL parameters (like invitation tokens)
   ```

2. **signUp(email, password, userData)**
   ```typescript
   // Creates new user account
   // Triggers database trigger to create user profile
   // Automatically signs in new user
   ```

3. **signOut()**
   ```typescript
   // Clears all auth state immediately
   // Signs out from Supabase
   // Clears local storage and session storage
   // Forces page reload and redirects to home
   ```

4. **switchRole(newRole)**
   ```typescript
   // Allows coaches/admins to switch between coach and student views
   // Updates role in database
   // Reloads page to reflect new role
   ```

### Auth State Change Handler

The app listens for auth state changes:

- **SIGNED_IN**: Fetches user profile
- **SIGNED_OUT**: Clears all state
- **TOKEN_REFRESHED**: Updates session (automatic)
- **USER_UPDATED**: Refetches profile data

### Session Persistence

**Storage:**
- Supabase handles session storage automatically
- Tokens stored in `localStorage` by default
- Session includes access token and refresh token

**Cleanup:**
- Logout explicitly clears `supabase.auth.token` from localStorage
- Clears all sessionStorage data
- Forces hard reload with `window.location.href = '/'`

## Common Scenarios

### Scenario 1: Normal Login

1. User enters email and password
2. App calls `signIn(email, password)`
3. Supabase validates credentials
4. On success, session is created
5. App fetches user profile from database
6. User redirected to appropriate dashboard (student/coach)

### Scenario 2: User Logout

1. User clicks "Sign Out" button
2. App calls `signOut()`
3. Shared auth state cleared immediately
4. Supabase session destroyed
5. Local storage cleared
6. Page reloads, showing login form

### Scenario 3: Switching Users on Same Device

**User A logs out:**
1. User A clicks "Sign Out"
2. All session data cleared
3. Page reloads to login screen

**User B logs in:**
1. User B enters their credentials
2. Fresh session created
3. User B's profile loaded
4. No data from User A accessible

### Scenario 4: Session Expiration

1. User's refresh token expires (after 7 days by default)
2. App detects "Refresh Token Not Found" error
3. Automatically signs out user
4. Clears all state
5. Shows login form with no error message (graceful handling)

### Scenario 5: Page Reload

1. User reloads page
2. App calls `supabase.auth.getSession()`
3. If valid session exists, restores user
4. Fetches fresh profile data
5. User continues where they left off

### Scenario 6: Invitation Signup

1. User receives invitation email with token
2. Clicks invitation link (URL includes token)
3. Signup form pre-filled with email and role
4. User enters password and name
5. After signup, URL parameters cleared
6. User logged in automatically

## Troubleshooting

### Issue: Can't log back in after logout

**Fixed in current version:**
- Logout now forces complete state cleanup
- Hard reload ensures fresh start
- Local storage explicitly cleared

**To verify fix:**
1. Log in as User A
2. Click "Sign Out"
3. Page should reload to login screen
4. Enter User B credentials
5. Should successfully log in as User B

### Issue: Session persists after logout

**Solution:**
- Added explicit localStorage clearing
- Added sessionStorage clearing
- Force page reload with `window.location.href = '/'`

### Issue: Stale profile data after login

**Solution:**
- Profile always fetched fresh on login
- Auth state change handler refetches profile
- Retry logic if profile not found immediately (handles database trigger delay)

## Security Considerations

1. **Token Storage**: Supabase handles secure token storage
2. **Password Requirements**: Enforced by Supabase Auth
3. **Session Timeout**: Configurable in Supabase (default 7 days)
4. **HTTPS Only**: All auth requests over HTTPS in production
5. **Row Level Security**: Database policies enforce data access

## Best Practices

### For Users:
- Always log out on shared devices
- Don't share login credentials
- Use strong passwords

### For Developers:
- Never store sensitive data in localStorage directly
- Always clear state on logout
- Handle session expiration gracefully
- Test auth flow on multiple devices
- Monitor Supabase auth logs for issues

## Auth Flow Diagram

```
┌─────────────────┐
│   Login Page    │
└────────┬────────┘
         │
         │ Enter credentials
         ▼
┌─────────────────┐
│  signIn()       │◄──── Supabase Auth
└────────┬────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│ fetchProfile()  │◄──── Database query
└────────┬────────┘
         │
         │ Profile loaded
         ▼
┌─────────────────┐
│   Dashboard     │
└────────┬────────┘
         │
         │ User clicks "Sign Out"
         ▼
┌─────────────────┐
│  signOut()      │◄──── Clear all state
└────────┬────────┘
         │
         │ Cleanup complete
         ▼
┌─────────────────┐
│  Reload Page    │───► Back to Login Page
└─────────────────┘
```

## Testing Checklist

- [ ] User can log in with valid credentials
- [ ] User sees error with invalid credentials
- [ ] User can log out successfully
- [ ] After logout, login page is shown
- [ ] After logout, previous user data not accessible
- [ ] Can log in as different user on same device
- [ ] Session persists after page reload
- [ ] Session cleared after logout
- [ ] No console errors during auth flow
- [ ] Profile data loads correctly after login
- [ ] URL parameters cleared after successful signup
- [ ] Expired sessions handled gracefully

## Contact

For issues with authentication:
- Check browser console for detailed logs
- Verify Supabase project is accessible
- Check auth.users and user_profiles tables
- Review Supabase Auth logs in dashboard
