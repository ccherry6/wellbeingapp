import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LowMetricAlertRequest {
  studentName: string;
  studentEmail: string;
  studentId: string;
  sport: string;
  entryDate: string;
  alerts: string[];
  notes?: string;
  injurySicknessNotes?: string;
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
      studentName,
      studentEmail,
      studentId,
      sport,
      entryDate,
      alerts,
      notes,
      injurySicknessNotes,
    }: LowMetricAlertRequest = await req.json();

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No alerts provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const COACH_EMAIL = "ccherry@thrivewellbeing.me";
    const FROM_EMAIL = "BDC Wellbeing <ccherry@thrivewellbeing.me>";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          details: "RESEND_API_KEY environment variable is missing",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const alertsList = alerts.map(alert => `<li style="margin: 8px 0; color: #dc2626; font-weight: 600;">${alert}</li>`).join('');
    
    const notesSection = notes ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">📝 Student Notes:</h3>
        <p style="margin: 0; color: #78350f; white-space: pre-wrap;">${notes}</p>
      </div>
    ` : '';

    const injurySection = injurySicknessNotes ? `
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px;">🚨 Injury/Sickness Details:</h3>
        <p style="margin: 0; color: #7f1d1d; white-space: pre-wrap;">${injurySicknessNotes}</p>
      </div>
    ` : '';

    const subject = `🚨 WELLNESS ALERT: ${studentName} - ${alerts.length} Critical Metric${alerts.length > 1 ? 's' : ''}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .alert-box { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .student-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #1e3a8a; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🚨 WELLNESS ALERT</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Critical Metrics Detected</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2 style="margin: 0 0 15px 0; color: #991b1b;">⚠️ ${alerts.length} Critical Metric${alerts.length > 1 ? 's' : ''} Detected</h2>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${alertsList}
              </ul>
            </div>
            
            <div class="student-info">
              <h3 style="margin: 0 0 10px 0; color: #1e3a8a;">Student Information</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${studentName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${studentEmail}</p>
              <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
              <p style="margin: 5px 0;"><strong>Sport:</strong> ${sport}</p>
              <p style="margin: 5px 0;"><strong>Entry Date:</strong> ${entryDate}</p>
            </div>

            ${notesSection}
            ${injurySection}

            <div style="background: #e0f2fe; padding: 15px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #0284c7;">
              <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">📋 Recommended Actions:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #075985;">
                <li>Follow up with the student within 24 hours</li>
                <li>Review their recent wellness entry history for patterns</li>
                <li>Consider adjusting training load if fatigue metrics are high</li>
                <li>Refer to wellbeing support services if needed</li>
                <li>Document your intervention in the student's file</li>
              </ul>
            </div>

            <p style="margin-top: 30px; text-align: center;">
              <a href="${Deno.env.get("SUPABASE_URL") || "#"}" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a, #dc2626); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Student Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>BDC High Performance Sport Program - Wellness Monitoring System</p>
            <p>This is an automated alert. Please respond promptly to ensure student wellbeing.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
WELLNESS ALERT - Critical Metrics Detected

${alerts.length} CRITICAL METRIC${alerts.length > 1 ? 'S' : ''} DETECTED:
${alerts.map(alert => `- ${alert}`).join('\n')}

STUDENT INFORMATION:
Name: ${studentName}
Email: ${studentEmail}
Student ID: ${studentId}
Sport: ${sport}
Entry Date: ${entryDate}

${notes ? `STUDENT NOTES:\n${notes}\n\n` : ''}
${injurySicknessNotes ? `INJURY/SICKNESS DETAILS:\n${injurySicknessNotes}\n\n` : ''}
RECOMMENDED ACTIONS:
- Follow up with the student within 24 hours
- Review their recent wellness entry history for patterns
- Consider adjusting training load if fatigue metrics are high
- Refer to wellbeing support services if needed
- Document your intervention in the student's file

View the student dashboard: ${Deno.env.get("SUPABASE_URL") || "#"}

---
BDC High Performance Sport Program - Wellness Monitoring System
This is an automated alert. Please respond promptly to ensure student wellbeing.
    `;

    console.log("Sending low metric alert email to:", COACH_EMAIL);
    console.log("Student:", studentName);
    console.log("Alerts:", alerts);

    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: COACH_EMAIL,
          subject: subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error("Resend API error:", emailData);
        console.error("Response status:", emailResponse.status);

        let errorMessage = "Failed to send alert email via Resend";
        if (emailResponse.status === 403) {
          errorMessage = "Email domain not verified in Resend. Please verify your domain.";
        }

        return new Response(
          JSON.stringify({
            error: errorMessage,
            details: emailData,
            status: emailResponse.status,
          }),
          {
            status: emailResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Alert email sent successfully:", emailData);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Alert email sent successfully",
          studentName: studentName,
          alertCount: alerts.length,
          emailId: emailData.id,
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
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error sending low metric alert:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send low metric alert",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});