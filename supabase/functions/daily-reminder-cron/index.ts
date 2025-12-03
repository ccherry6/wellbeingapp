import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily reminder cron job...");

    // Get current date and time in Australia/Sydney timezone
    const now = new Date();
    const sydneyTime = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const todayDate = new Date().toISOString().split('T')[0];
    console.log("Current Sydney time:", sydneyTime);
    console.log("Today's date:", todayDate);

    // Get all users who:
    // 1. Have email notifications enabled
    // 2. Haven't completed today's check-in
    // 3. Their notification time matches current time (within a 5-minute window)

    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select(`
        user_id,
        email_notifications,
        notification_time,
        user_profiles!inner (
          email,
          full_name
        )
      `)
      .eq('email_notifications', true);

    if (settingsError) {
      console.error("Error fetching notification settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} users with email notifications enabled`);

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No users with email notifications enabled",
          processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check which users haven't completed today's check-in
    const { data: todayEntries, error: entriesError } = await supabase
      .from('wellness_entries')
      .select('user_id')
      .eq('entry_date', todayDate);

    if (entriesError) {
      console.error("Error fetching wellness entries:", entriesError);
      throw entriesError;
    }

    const completedUserIds = new Set(todayEntries?.map(e => e.user_id) || []);
    console.log(`${completedUserIds.size} users have already completed today's check-in`);

    // Filter users who need reminders
    const usersNeedingReminders = settings.filter(setting => {
      // Skip if user already completed check-in
      if (completedUserIds.has(setting.user_id)) {
        return false;
      }

      // Check if notification time matches current time (within 5-minute window)
      const notificationTime = setting.notification_time;
      const [notifHour, notifMinute] = notificationTime.split(':').map(Number);
      const [currentHour, currentMinute] = sydneyTime.split(':').map(Number);

      // Check if within 5-minute window
      const timeDiff = Math.abs((notifHour * 60 + notifMinute) - (currentHour * 60 + currentMinute));
      return timeDiff <= 5;
    });

    console.log(`${usersNeedingReminders.length} users need reminders right now`);

    // Send reminder emails
    const emailResults = [];
    for (const user of usersNeedingReminders) {
      try {
        const profile = user.user_profiles as any;
        const email = profile.email;
        const name = profile.full_name || email;

        console.log(`Sending reminder to: ${email}`);

        // Call the send-reminder-email function
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-reminder-email',
          {
            body: {
              studentEmail: email,
              studentName: name,
              reminderTime: user.notification_time
            }
          }
        );

        if (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          emailResults.push({ email, success: false, error: emailError.message });
        } else {
          console.log(`Successfully sent email to ${email}`);
          emailResults.push({ email, success: true });
        }
      } catch (error) {
        console.error(`Error processing user:`, error);
        emailResults.push({ 
          email: 'unknown', 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.length - successCount;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Daily reminder cron job completed",
        processed: emailResults.length,
        successful: successCount,
        failed: failureCount,
        results: emailResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in daily reminder cron:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process daily reminders",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});