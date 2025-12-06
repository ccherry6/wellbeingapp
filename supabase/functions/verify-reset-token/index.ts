import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("🔄 Password reset verification request received");

    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      console.error("❌ Missing token or password");
      return new Response(
        JSON.stringify({ error: "Token and new password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      console.error("❌ Password too short");
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔑 Verifying token...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .maybeSingle();

    if (tokenError) {
      console.error("❌ Database error:", tokenError);
      throw new Error("Database error");
    }

    if (!tokenData) {
      console.error("❌ Token not found or already used");
      return new Response(
        JSON.stringify({
          error: "Invalid or expired reset token",
          details: "This reset link may have already been used or has expired. Please request a new one."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Token found for user:", tokenData.user_id);

    // Check if expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      console.error("❌ Token expired at:", expiresAt.toISOString());
      return new Response(
        JSON.stringify({
          error: "This reset link has expired",
          details: "Please request a new password reset link. Reset links expire after 1 hour."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("⏰ Token valid, expires:", expiresAt.toISOString());

    // Update user password
    console.log("🔄 Updating password...");

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("❌ Password update error:", updateError);
      throw new Error("Failed to update password: " + updateError.message);
    }

    console.log("✅ Password updated successfully");

    // Mark token as used
    const { error: markError } = await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", tokenData.id);

    if (markError) {
      console.error("⚠️ Warning: Could not mark token as used:", markError);
      // Don't fail the request, password was already updated
    } else {
      console.log("✅ Token marked as used");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully. You can now sign in with your new password."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: "Please try again or contact support if the problem persists"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
