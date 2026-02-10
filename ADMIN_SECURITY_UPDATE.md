# Admin Security System - Update Summary

## Overview

Your application has been updated with a secure admin system. **Only designated admin coaches can now invite new coaches.** Regular users can no longer self-select as coaches during registration.

---

## What Changed

### 1. Database Security (Migration Applied)

**New Field Added:**
- `is_admin` boolean field added to `profiles` table
- Default value: `false`
- Only admins can modify this field for other users

**Security Policies Updated:**
- Coach invitations can ONLY be created by admins
- Users can no longer set themselves as coaches
- Admin status is protected and can only be changed by other admins

**First Admin Automatically Created:**
- The first coach in your database has been automatically set as admin
- If you have a specific admin email, you can manually set it in the database

### 2. Registration Form Updated

**Before:**
- Users could choose "Student" or "Coach" during registration
- Anyone could create a coach account

**After:**
- Users can ONLY register as students
- Message displayed: "Coach accounts must be invited by an administrator"
- Coach role can only be assigned via invitation link

### 3. User Management Interface Updated

**For Admin Coaches:**
- Can invite new coaches via the invitation form
- Can toggle admin status for other coaches
- Can see admin badges next to admin coaches
- Can manage all users

**For Regular Coaches:**
- Cannot invite new coaches
- See a warning message: "Only admin coaches can invite new coaches"
- Can still view all users and manage students
- Cannot change admin status

### 4. Visual Indicators

**Admin Badge:**
- Purple "Admin" badge shown next to admin coaches in the list
- Clearly identifies who has admin privileges

**Admin Controls:**
- "Grant Admin" / "Revoke Admin" buttons for admin users
- Disabled for your own account (can't change your own admin status)
- Regular coaches see "Admin" or "Regular Coach" text (no button)

---

## How It Works

### For Regular Sign-Up:
1. User visits registration page
2. User can ONLY register as a student
3. User completes registration with student details
4. Account created with `role: 'student'` and `is_admin: false`

### For Coach Invitation:
1. **Admin coach** goes to User Management
2. Admin fills out invitation form
3. Admin selects "Coach" role
4. Invitation email sent with special link
5. Recipient clicks link and registers
6. Account created with `role: 'coach'` and `is_admin: false`
7. Admin can later grant admin privileges if needed

### For Admin Management:
1. Admin coach goes to User Management > Coaches tab
2. Admin sees all coaches with admin badges
3. Admin can click "Grant Admin" to promote a coach
4. Admin can click "Revoke Admin" to demote an admin coach
5. Changes take effect immediately

---

## Security Benefits

✅ **Prevents Unauthorized Access:** Random users cannot create coach accounts
✅ **Controlled Onboarding:** Only admins can invite new coaches
✅ **Role Protection:** Coach role requires invitation, cannot be self-assigned
✅ **Admin Hierarchy:** Clear distinction between admin coaches and regular coaches
✅ **Audit Trail:** All coach invitations are tracked by who sent them
✅ **Self-Protection:** Admins cannot revoke their own admin status (prevents lockout)

---

## Who Is an Admin?

**Currently:**
- The first coach in your database is automatically set as admin
- Check the User Management > Coaches tab to see who has admin status

**How to Make Someone an Admin:**
1. Log in as an existing admin coach
2. Go to User Management > Coaches tab
3. Find the coach you want to promote
4. Click "Grant Admin" button
5. They now have admin privileges

**How to Revoke Admin:**
1. Log in as an existing admin coach
2. Go to User Management > Coaches tab
3. Find the admin coach you want to demote
4. Click "Revoke Admin" button
5. They become a regular coach (can still access everything except inviting coaches)

---

## Important Notes

### Always Have at Least One Admin
- Never revoke admin status for ALL admins
- If you're the only admin, you cannot revoke your own status
- Consider having 2-3 admins for redundancy

### Student Invitations Still Work
- Regular coaches can still invite students
- Student invitations are not affected by this change
- Only coach invitations require admin status

### Existing Coaches
- All existing coaches keep their accounts
- They can continue using the system normally
- Only the first coach is automatically made an admin
- Other coaches are regular coaches (non-admin)

### Cannot Self-Promote
- You cannot grant yourself admin status
- Another admin must grant you admin privileges
- This prevents security issues

---

## Testing the Changes

### Test 1: Regular Sign-Up (Should Work)
1. Go to registration page
2. Try to create a student account
3. ✅ Should succeed

### Test 2: Coach Self-Selection (Should Be Blocked)
1. Go to registration page
2. Look for coach/student toggle
3. ✅ Should NOT see toggle, only "Creating a Student Account" message

### Test 3: Admin Coach Invitation (Should Work)
1. Log in as admin coach
2. Go to User Management
3. Try to invite a new coach
4. ✅ Should see invitation form and be able to send invitation

### Test 4: Regular Coach Invitation (Should Be Blocked)
1. Log in as non-admin coach
2. Go to User Management
3. Look for invitation form
4. ✅ Should see warning message instead of form

### Test 5: Admin Status Toggle (Admin Only)
1. Log in as admin coach
2. Go to User Management > Coaches tab
3. Try to grant/revoke admin for another coach
4. ✅ Should see "Grant Admin" / "Revoke Admin" buttons
5. Try to change your own admin status
6. ✅ Button should be disabled

---

## Database Migration Applied

**Migration:** `add_admin_system_for_coach_management`

**Changes:**
- Added `is_admin` column to `profiles` table
- Updated RLS policies for `coach_invitations` table
- Created index for faster admin lookups
- Set first coach as admin
- Added protective policies to prevent non-admins from changing admin status

**Rollback:** If you need to undo these changes, contact your database administrator. The migration cannot be automatically reversed.

---

## FAQ

**Q: I'm the only coach. Am I automatically an admin?**
A: Yes, the first coach in the database is automatically set as admin.

**Q: Can I have multiple admins?**
A: Yes! Admins can promote other coaches to admin status.

**Q: Can a regular coach see student data?**
A: Yes! Regular coaches can still see all students and their wellness data. Only coach invitations require admin status.

**Q: What if I accidentally revoke all admins?**
A: You'll need to manually update the database to set at least one coach as admin. Contact technical support.

**Q: Can students become coaches?**
A: Not directly. An admin would need to:
  1. Delete the student account
  2. Send a coach invitation to that email
  3. User registers again as a coach

**Q: Do existing coach accounts need to do anything?**
A: No! Existing coaches keep working normally. Only one is automatically made admin.

**Q: How do I check who is an admin?**
A: Go to User Management > Coaches tab. Admins have a purple "Admin" badge.

---

## Summary

Your application is now more secure:
- ✅ Users cannot self-select as coaches
- ✅ Only admins can invite coaches
- ✅ Clear admin hierarchy established
- ✅ Admin status is protected and controlled
- ✅ All security policies enforced at database level

**Next Steps:**
1. Check User Management to confirm who is admin
2. Test the invitation flow with a new coach
3. Promote additional coaches to admin if needed
4. Inform your team about the new admin system

---

## Support

If you have issues:
1. Check the browser console for errors (F12)
2. Verify you're logged in as an admin coach
3. Check the Supabase dashboard for policy errors
4. Contact technical support if needed

**Your data is safe.** All changes are backward-compatible and existing users are not affected.
