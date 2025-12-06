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
    console.log("🔄 Password reset request received");

    const { email } = await req.json();

    if (!email) {
      console.error("❌ No email provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📧 Processing reset for:", email);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log("⚠️ User not found, returning success anyway (security)");
      return new Response(
        JSON.stringify({
          success: true,
          message: "If that email exists, a reset link has been sent"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ User found:", user.id);

    // Generate secure token
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log("🔑 Generated token, expires:", expiresAt.toISOString());

    // Delete any existing unused tokens for this user
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("used", false);

    // Store new token
    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("❌ Token creation error:", tokenError);
      throw new Error("Failed to create reset token");
    }

    console.log("💾 Token stored in database");

    // Always use production URL for reset links
    const resetUrl = `https://thrivewellbeing.me/#reset=${token}`;

    console.log("🔗 Reset URL:", resetUrl);

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured");
      throw new Error("Email service not configured");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .button:hover {
              opacity: 0.9;
            }
            .link-box {
              background: #f9fafb;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              word-break: break-all;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px 16px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>You requested to reset your password for <strong>BDC Thrive Wellbeing</strong>.</p>
              <p>Click the button below to create a new password:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>

              <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 20px 0;">
                Or copy and paste this link into your browser:
              </p>

              <div class="link-box">
                <a href="${resetUrl}" style="color: #1e3a8a; font-size: 13px;">${resetUrl}</a>
              </div>

              <div class="warning">
                <strong>⏰ This link expires in 1 hour</strong>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you didn't request this password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>

              <div class="footer">
                <p><strong>BDC Thrive Wellbeing</strong></p>
                <p>This is an automated email, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("📨 Sending email via Resend...");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BDC Thrive <noreply@thrivewellbeing.me>",
        to: [email],
        subject: "Reset Your Password - BDC Thrive",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("❌ Resend error:", errorText);
      throw new Error("Failed to send email");
    }

    const emailResult = await emailResponse.json();
    console.log("✅ Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully"
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
