# How to Update and Improve Your App with Bolt

## Overview

Bolt is your AI-powered development environment that can help you continuously improve your wellbeing monitoring platform. This guide explains how to make updates safely and effectively.

## Accessing Your Project in Bolt

1. Open Bolt.new in your browser
2. Your project should already be loaded
3. All your files, database, and configurations are preserved

## Making Updates Safely

### Best Practices

**1. Be Specific with Requests**
- Good: "Add a filter to the coach dashboard to show only students with stress levels above 7 in the past week"
- Bad: "Make the dashboard better"

**2. Test After Each Change**
- Ask Bolt to test the changes after implementation
- Verify the app still builds: `npm run build`
- Check that existing features still work

**3. Request Documentation**
- After significant changes, ask: "Document the changes you just made"
- This helps you understand what was modified

**4. Make Incremental Changes**
- Tackle one feature or fix at a time
- Avoid requesting multiple complex changes simultaneously
- This makes it easier to identify and fix issues

## Common Update Scenarios

### Adding New Features

**Example Request:**
"Add a feature that allows coaches to add private notes about each student that only coaches can see"

Bolt will:
- Create a new database table with proper RLS policies
- Add UI components to the coach dashboard
- Ensure data security and privacy
- Test the implementation

### Fixing Issues

**Example Request:**
"Students are reporting that the sleep hours field doesn't accept decimal values like 7.5. Please fix this."

Bolt will:
- Identify the issue in the code
- Implement the fix
- Test to ensure it works
- Verify no other functionality is affected

### Improving User Experience

**Example Request:**
"Make the student questionnaire more mobile-friendly with larger touch targets and better spacing"

Bolt will:
- Update the styling and layout
- Test responsive design
- Ensure accessibility standards are met

### Database Changes

**Example Request:**
"Add a new metric to track hydration levels (1-10 scale) in the daily questionnaire"

Bolt will:
- Create a migration to add the column safely
- Update the questionnaire form
- Add the metric to charts and analytics
- Ensure proper validation

## Understanding Database Migrations

When Bolt makes database changes, it creates migration files in `supabase/migrations/`. These files:
- Are automatically numbered and timestamped
- Contain SQL commands that modify your database
- Are reversible and version-controlled
- Include detailed comments explaining changes

**Important**: Never manually edit migration files. Always ask Bolt to create new migrations.

## Deployment After Updates

After Bolt makes changes:

1. **Test Locally**: Changes are immediately reflected in your development environment
2. **Build**: Bolt will run `npm run build` to verify production readiness
3. **Deploy**: Your hosting platform (like Bolt's deployment) automatically deploys the changes

## Useful Commands to Ask Bolt

### Testing & Verification
- "Run the build to make sure everything compiles"
- "Test the student registration flow end-to-end"
- "Verify the coach dashboard loads correctly with sample data"

### Information & Understanding
- "Explain how the critical alert system works"
- "Show me all the RLS policies for the wellness_entries table"
- "What environment variables are configured?"

### Maintenance
- "Check for any security vulnerabilities in dependencies"
- "Update all npm packages to their latest versions"
- "Optimize database queries in the coach dashboard"

### Data Management
- "Export the database schema as documentation"
- "Show me statistics about current users and entries"
- "Create a data backup script"

## Troubleshooting with Bolt

If something breaks:

1. **Describe the Issue Clearly**
   - "When students submit the questionnaire, they get an error message: [paste error]"
   - Include any error messages you see
   - Explain what you expected to happen

2. **Let Bolt Investigate**
   - Bolt can read error logs
   - Bolt can check database connections
   - Bolt can review recent changes

3. **Ask for a Fix**
   - Bolt will identify the root cause
   - Implement the fix
   - Test to ensure it's resolved

## Advanced Updates

### Adding Third-Party Integrations

**Example:**
"Integrate with Microsoft Teams to send coach alerts directly to a Teams channel"

### Custom Analytics

**Example:**
"Create a weekly report that shows which metrics have the strongest correlation with overall wellbeing"

### Automation

**Example:**
"Set up an automatic weekly email summary for each coach showing their students' average scores"

## Data Safety

Bolt is programmed to:
- Never delete user data without explicit confirmation
- Always use proper migration strategies for database changes
- Enable Row Level Security (RLS) on all tables
- Follow security best practices

If you need to make risky changes, Bolt will:
- Warn you about potential data loss
- Recommend creating backups first
- Ask for explicit confirmation

## Getting Help from Bolt

If you're unsure how to request something:

**Ask for suggestions:**
"What improvements would you recommend for the student dashboard?"

**Ask for clarification:**
"Can you explain the difference between the wellness_entries and wellness_activities tables?"

**Ask for examples:**
"Show me examples of what kind of custom reports I could add"

## Best Practices Summary

1. Make one change at a time
2. Test after each change
3. Be specific in your requests
4. Ask Bolt to explain changes you don't understand
5. Request documentation for major updates
6. Never manually edit database migrations
7. Always verify the build succeeds after changes
8. Keep backups (Bolt can help with this)

## Your Project Structure

```
project/
├── src/
│   ├── components/     # React components (UI)
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and Supabase client
├── supabase/
│   └── migrations/     # Database changes (auto-managed)
├── public/             # Static assets
└── package.json        # Dependencies
```

When requesting changes, you can reference these locations to be more specific.

## Example Conversation with Bolt

**You:** "I want to add a feature where students can set personal goals"

**Bolt:** "I'll create a goal-setting feature for students. This will include:
1. A new section in the student dashboard
2. Database table for storing goals
3. Ability to create, edit, and mark goals as complete
4. Progress tracking

Would you like coaches to be able to see these goals too?"

**You:** "Yes, but students should choose whether to share each goal with coaches"

**Bolt:** "Perfect. I'll add a privacy toggle for each goal. Let me implement this..."

[Bolt implements the feature]

**Bolt:** "The feature is complete. Students can now set goals and choose whether to share them with coaches. Would you like me to test this functionality?"

**You:** "Yes please"

**Bolt:** [Runs tests and verifies everything works]

---

**Remember**: Bolt is your development partner. Don't hesitate to ask questions, request changes, or seek clarification. The more you communicate what you need, the better Bolt can help you create the perfect wellbeing monitoring platform for your students.
