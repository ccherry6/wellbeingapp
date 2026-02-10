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

    // Get the coach's profile to verify they're a coach
    const { data: coachProfile, error: coachError } = await supabaseClient
      .from("profiles")
      .select("actual_role")
      .eq("id", user.id)
      .single()

    if (coachError || !coachProfile) {
      throw new Error("Could not verify user profile")
    }

    // Verify the user is a coach or admin
    if (!["coach", "admin"].includes(coachProfile.actual_role)) {
      throw new Error("Only coaches and admins can delete students")
    }

    // Get the student ID from the request body
    const { studentId } = await req.json()
    if (!studentId) {
      throw new Error("Student ID is required")
    }

    console.log(`Coach ${user.id} attempting to delete student: ${studentId}`)

    // Verify the target is a student
    const { data: studentProfile, error: studentError } = await supabaseClient
      .from("profiles")
      .select("actual_role, full_name, email")
      .eq("id", studentId)
      .single()

    if (studentError || !studentProfile) {
      throw new Error("Student not found")
    }

    if (studentProfile.actual_role !== "student") {
      throw new Error("Can only delete student accounts")
    }

    console.log(`Deleting student: ${studentProfile.full_name} (${studentProfile.email})`)

    // Delete all related data
    // Most tables have CASCADE foreign keys, but we'll delete explicitly for logging

    // 1. Delete resource_deployments
    await supabaseClient
      .from("resource_deployments")
      .delete()
      .eq("student_id", studentId)

    // 2. Delete wellness_alerts
    await supabaseClient
      .from("wellness_alerts")
      .delete()
      .eq("user_id", studentId)

    // 3. Delete coach_alerts
    await supabaseClient
      .from("coach_alerts")
      .delete()
      .eq("student_id", studentId)

    // 4. Delete auto_alert_logs
    await supabaseClient
      .from("auto_alert_logs")
      .delete()
      .eq("student_id", studentId)

    // 5. Delete notification_settings
    await supabaseClient
      .from("notification_settings")
      .delete()
      .eq("user_id", studentId)

    // 6. Delete data_access_log
    await supabaseClient
      .from("data_access_log")
      .delete()
      .eq("user_id", studentId)

    // 7. Delete consent_log
    await supabaseClient
      .from("consent_log")
      .delete()
      .eq("user_id", studentId)

    // 8. Delete wellbeing_correlations
    await supabaseClient
      .from("wellbeing_correlations")
      .delete()
      .eq("student_id", studentId)

    // 9. Delete student_risk_scores
    await supabaseClient
      .from("student_risk_scores")
      .delete()
      .eq("student_id", studentId)

    // 10. Delete wellness_activities
    await supabaseClient
      .from("wellness_activities")
      .delete()
      .eq("user_id", studentId)

    // 11. Delete user_goals
    await supabaseClient
      .from("user_goals")
      .delete()
      .eq("user_id", studentId)

    // 12. Delete login_sessions
    await supabaseClient
      .from("login_sessions")
      .delete()
      .eq("user_id", studentId)

    // 13. Delete coach_invitations
    await supabaseClient
      .from("coach_invitations")
      .delete()
      .eq("invited_user_id", studentId)

    // 14. Delete password_reset_tokens
    await supabaseClient
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", studentId)

    // 15. Delete wellness_entries
    await supabaseClient
      .from("wellness_entries")
      .delete()
      .eq("user_id", studentId)

    // 16. Delete weekly_summaries
    await supabaseClient
      .from("weekly_summaries")
      .delete()
      .eq("user_id", studentId)

    // 17. Delete profile
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", studentId)

    if (profileError) {
      console.error("Error deleting student profile:", profileError)
      throw new Error(`Failed to delete student profile: ${profileError.message}`)
    }

    // 18. Finally, delete the auth user using admin API
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(studentId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      throw new Error(`Failed to delete auth user: ${authError.message}`)
    }

    console.log(`Successfully deleted student: ${studentId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Student ${studentProfile.full_name} deleted successfully`
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Student deletion error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to delete student",
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
