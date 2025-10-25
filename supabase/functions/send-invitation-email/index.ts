import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvitationEmailRequest {
  inviteeName: string;
  inviteeEmail: string;
  role: string;
  registrationCode: string;
  inviteUrl: string;
  inviterName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      inviteeName,
      inviteeEmail,
      role,
      registrationCode,
      inviteUrl,
      inviterName
    }: InvitationEmailRequest = await req.json();

    if (!inviteeEmail || !inviteUrl) {
      return new Response(
        JSON.stringify({ error: "Email and invitation URL are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const roleName = role === 'coach' ? 'Coach' : 'Student-Athlete';
    const subject = `You're Invited to Join BDC Thrive as a ${roleName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a, #dc2626);
            color: white;
            padding: 40px 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            background: #ffffff;
            padding: 40px 30px;
          }
          .content h2 {
            color: #1e3a8a;
            margin-top: 0;
            font-size: 22px;
          }
          .info-box {
            background: #f3f4f6;
            border-left: 4px solid #1e3a8a;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .info-box strong {
            color: #1e3a8a;
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-box .value {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 10px 15px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1e3a8a, #dc2626);
            color: white !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .steps {
            background: #f9fafb;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .steps h3 {
            color: #1e3a8a;
            margin-top: 0;
            font-size: 18px;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            margin: 12px 0;
            line-height: 1.8;
          }
          .footer {
            background: #f3f4f6;
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .footer p {
            margin: 8px 0;
          }
          .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://thrivewellbeing.me/BDC%20Logo.jpg" alt="BDC Logo" class="logo" />
            <h1>🏃‍♂️ BDC Thrive</h1>
            <p>Wellbeing & Performance Tracking Platform</p>
          </div>

          <div class="content">
            <h2>Hi ${inviteeName}! 👋</h2>

            <p>You've been invited to join <strong>BDC Thrive</strong> as a <span class="highlight">${roleName}</span>.</p>

            <p>BDC Thrive is our comprehensive wellbeing and performance tracking platform designed specifically for the BDC High Performance Sport Program. ${role === 'coach' ? 'As a coach, you\'ll have access to student progress tracking, analytics, and wellbeing monitoring tools.' : 'Track your daily wellbeing, monitor your progress, and stay connected with your coaching team.'}</p>

            <center>
              <a href="${inviteUrl}" class="button">
                Accept Invitation & Sign Up
              </a>
            </center>

            <div class="steps">
              <h3>Getting Started:</h3>
              <ol>
                <li>Click the button above to accept your invitation</li>
                <li>Create your account using the email: <strong>${inviteeEmail}</strong></li>
                <li>Enter the registration code when prompted</li>
                <li>Complete your profile setup</li>
                <li>Start ${role === 'coach' ? 'monitoring your athletes\' wellbeing' : 'tracking your wellbeing journey'}!</li>
              </ol>
            </div>

            <div class="info-box">
              <strong>Registration Code:</strong>
              <div class="value">${registrationCode}</div>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              <strong>Important:</strong> This invitation link is unique to you. Please do not share it with others. If you have any questions or issues signing up, please contact your program administrator.
            </p>
          </div>

          <div class="footer">
            <p><strong>BDC High Performance Sport Program</strong></p>
            <p>Building champions through holistic wellbeing</p>
            ${inviterName ? `<p style="margin-top: 15px;">Invited by ${inviterName}</p>` : ''}
            <p style="margin-top: 15px;">Need help? Contact <a href="mailto:ccherry@thrivewellbeing.me" style="color: #1e3a8a;">ccherry@thrivewellbeing.me</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
BDC Thrive - Invitation to Join as ${roleName}

Hi ${inviteeName}!

You've been invited to join BDC Thrive as a ${roleName}.

BDC Thrive is our comprehensive wellbeing and performance tracking platform designed specifically for the BDC High Performance Sport Program.

Getting Started:
1. Visit the invitation link: ${inviteUrl}
2. Create your account using: ${inviteeEmail}
3. Enter registration code: ${registrationCode}
4. Complete your profile setup
5. Start ${role === 'coach' ? 'monitoring your athletes\' wellbeing' : 'tracking your wellbeing journey'}!

Important: This invitation link is unique to you. Please do not share it with others.

---
BDC High Performance Sport Program
Building champions through holistic wellbeing
${inviterName ? `Invited by ${inviterName}` : ''}

Need help? Contact ccherry@thrivewellbeing.me
    `;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = "BDC Thrive <ccherry@thrivewellbeing.me>";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          details: "RESEND_API_KEY environment variable is missing"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Sending invitation email to:", inviteeEmail);
    console.log("Role:", roleName);
    console.log("Invite URL:", inviteUrl);

    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: inviteeEmail,
          subject: subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error("Resend API error:", emailData);
        console.error("Response status:", emailResponse.status);

        let errorMessage = "Failed to send invitation email via Resend";
        if (emailResponse.status === 403) {
          errorMessage = "Email domain not verified in Resend. Please verify your domain in your Resend account.";
        }

        return new Response(
          JSON.stringify({
            error: errorMessage,
            details: emailData,
            status: emailResponse.status
          }),
          {
            status: emailResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Invitation email sent successfully:", emailData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Invitation email sent successfully",
          email: inviteeEmail,
          emailId: emailData.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      console.error("Error calling Resend API:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Failed to call Resend API",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send invitation email",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});