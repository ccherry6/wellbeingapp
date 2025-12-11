import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.57.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      throw new Error("No authorization header")
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error("Invalid user token")
    }

    const userId = user.id

    console.log(`Starting account deletion for user: ${userId}`)

    // Delete data in the correct order to respect foreign key constraints
    // Start with tables that depend on other tables

    // 1. Delete resource_deployments (depends on wellness_entries and user_profiles)
    await supabaseClient
      .from("resource_deployments")
      .delete()
      .eq("student_id", userId)

    // 2. Delete wellness_alerts (depends on wellness_entries)
    await supabaseClient
      .from("wellness_alerts")
      .delete()
      .eq("user_id", userId)

    // 3. Delete coach_alerts (depends on user_profiles)
    await supabaseClient
      .from("coach_alerts")
      .delete()
      .eq("coach_id", userId)

    await supabaseClient
      .from("coach_alerts")
      .delete()
      .eq("student_id", userId)

    // 4. Delete auto_alert_logs
    await supabaseClient
      .from("auto_alert_logs")
      .delete()
      .eq("student_id", userId)

    // 5. Delete notification_settings
    await supabaseClient
      .from("notification_settings")
      .delete()
      .eq("user_id", userId)

    // 6. Delete data_access_log
    await supabaseClient
      .from("data_access_log")
      .delete()
      .eq("user_id", userId)

    // 7. Delete consent_log
    await supabaseClient
      .from("consent_log")
      .delete()
      .eq("user_id", userId)

    // 8. Delete wellbeing_correlations
    await supabaseClient
      .from("wellbeing_correlations")
      .delete()
      .eq("student_id", userId)

    // 9. Delete student_risk_scores
    await supabaseClient
      .from("student_risk_scores")
      .delete()
      .eq("student_id", userId)

    // 10. Delete wellness_activities
    await supabaseClient
      .from("wellness_activities")
      .delete()
      .eq("user_id", userId)

    // 11. Delete user_goals
    await supabaseClient
      .from("user_goals")
      .delete()
      .eq("user_id", userId)

    // 12. Delete wellbeing_resources created by user
    await supabaseClient
      .from("wellbeing_resources")
      .delete()
      .eq("created_by", userId)

    // 13. Delete resources created by user
    await supabaseClient
      .from("resources")
      .delete()
      .eq("created_by", userId)

    // 14. Delete login_sessions
    await supabaseClient
      .from("login_sessions")
      .delete()
      .eq("user_id", userId)

    // 15. Delete coach_invitations sent by user
    await supabaseClient
      .from("coach_invitations")
      .delete()
      .eq("invited_by", userId)

    // Also delete invitations for this user
    await supabaseClient
      .from("coach_invitations")
      .delete()
      .eq("invited_user_id", userId)

    // 16. Delete invitation_tokens sent by user
    await supabaseClient
      .from("invitation_tokens")
      .delete()
      .eq("invited_by", userId)

    // 17. Delete password_reset_tokens
    await supabaseClient
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", userId)

    // 18. Delete research_exports
    await supabaseClient
      .from("research_exports")
      .delete()
      .eq("exported_by", userId)

    // 19. Delete wellness_entries (depends on user_profiles)
    await supabaseClient
      .from("wellness_entries")
      .delete()
      .eq("user_id", userId)

    // 20. Delete user_profiles (depends on auth.users)
    const { error: profileError } = await supabaseClient
      .from("user_profiles")
      .delete()
      .eq("id", userId)

    if (profileError) {
      console.error("Error deleting user profile:", profileError)
      throw new Error(`Failed to delete user profile: ${profileError.message}`)
    }

    // 21. Finally, delete the auth user using admin API
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      throw new Error(`Failed to delete auth user: ${authError.message}`)
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Account deletion error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to delete account",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})
