import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReminderEmailRequest {
  studentEmail: string;
  studentName: string;
  reminderTime: string;
}

Deno.serve(async (req: Request) => {
  console.log("=== Reminder Email Function Called ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);
    
    const body = JSON.parse(rawBody) as ReminderEmailRequest;
    const { studentEmail, studentName, reminderTime } = body;
    
    console.log("Parsed request:", { studentEmail, studentName, reminderTime });

    if (!studentEmail) {
      console.error("Missing studentEmail");
      return new Response(
        JSON.stringify({ error: "Student email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Email content
    const subject = "Thrive Wellbeing - Daily Wellbeing Check-in Reminder";
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #1e3a8a, #dc2626); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏃‍♂️ Thrive Wellbeing</h1>
            <p>Daily Wellbeing Check-in</p>
          </div>
          <div class="content">
            <h2>Hi ${studentName || "there"}! 👋</h2>
            <p>This is your daily reminder to complete your wellbeing questionnaire.</p>
            <p>Taking a few minutes each day to check in with yourself helps:</p>
            <ul>
              <li>Track your wellbeing progress over time</li>
              <li>Identify patterns in your mood and energy</li>
              <li>Alert coaches if you need support</li>
              <li>Build healthy self-awareness habits</li>
            </ul>
            <p>Your scheduled reminder time: <strong>${reminderTime}</strong></p>
            <center>
              <a href="${Deno.env.get("SUPABASE_URL") || "#"}" class="button">
                Complete Check-in Now
              </a>
            </center>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              This reminder will only be sent if you haven't completed your daily check-in yet.
            </p>
          </div>
          <div class="footer">
            <p>BDC High Performance Sport Program</p>
            <p>To change your notification settings, log in to the app and visit Settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Thrive Wellbeing - Daily Wellbeing Check-in

Hi ${studentName || "there"}!

This is your daily reminder to complete your wellbeing questionnaire.

Your scheduled reminder time: ${reminderTime}

Complete your check-in by visiting: ${Deno.env.get("SUPABASE_URL") || "#"}

This reminder will only be sent if you haven't completed your daily check-in yet.

---
BDC High Performance Sport Program
To change your notification settings, log in to the app and visit Settings.
    `;

    // Send email using Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = "Thrive Wellbeing <ccherry@thrivewellbeing.me>";

    console.log("Checking RESEND_API_KEY...");
    console.log("API Key exists:", !!RESEND_API_KEY);
    console.log("API Key length:", RESEND_API_KEY?.length || 0);

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

    console.log("Sending reminder email to:", studentEmail);
    console.log("From:", FROM_EMAIL);
    console.log("Subject:", subject);
    console.log("Reminder time:", reminderTime);

    try {
      console.log("Calling Resend API...");
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: studentEmail,
          subject: subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      console.log("Resend API response status:", emailResponse.status);
      const emailData = await emailResponse.json();
      console.log("Resend API response data:", emailData);

      if (!emailResponse.ok) {
        console.error("Resend API error:", emailData);
        console.error("Response status:", emailResponse.status);

        let errorMessage = "Failed to send email via Resend";
        if (emailResponse.status === 403) {
          errorMessage = "Email domain not verified in Resend. Please verify your domain in your Resend account.";
        } else if (emailResponse.status === 422) {
          errorMessage = "Invalid email request. Check email addresses and content.";
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

      console.log("✅ Email sent successfully:", emailData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Reminder email sent successfully",
          email: studentEmail,
          emailId: emailData.id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      console.error("❌ Error calling Resend API:", fetchError);
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
    console.error("❌ Error in reminder email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send reminder email",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});