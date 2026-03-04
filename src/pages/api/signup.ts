import type { APIRoute } from "astro";
import { Resend } from "resend";

const packageNames: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  domination: "Domination",
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, package: selectedPackage } = await request.json();

    if (!name || !email || !selectedPackage) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact us directly." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(apiKey);
    const packageName = packageNames[selectedPackage] || selectedPackage;

    await resend.emails.send({
      from: "Ben @ Nunya Bunya <ben@nunyabunya.com>",
      to: email,
      subject: `Welcome to Nunya Bunya — ${packageName} Package`,
      html: buildWelcomeEmail(name, packageName),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

function buildWelcomeEmail(name: string, packageName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111111;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00E5CC 0%,#FF4DDD 100%);padding:40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#111111;letter-spacing:4px;">
                NUNYA BUNYA
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px 0;font-size:24px;font-weight:700;color:#00E5CC;text-transform:uppercase;">
                WELCOME ABOARD, ${name.toUpperCase()}.
              </h2>

              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#cccccc;">
                You've just signed up for the <strong style="color:#FF4DDD;">${packageName}</strong> package. Smart move.
              </p>

              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#cccccc;">
                Here's what happens next:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#00E5CC;font-weight:700;font-size:18px;">01</span>
                    <span style="color:#cccccc;font-size:14px;margin-left:12px;">We'll send you an onboarding questionnaire within 24 hours</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span style="color:#00E5CC;font-weight:700;font-size:18px;">02</span>
                    <span style="color:#cccccc;font-size:14px;margin-left:12px;">We'll schedule your kickoff strategy call</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#00E5CC;font-weight:700;font-size:18px;">03</span>
                    <span style="color:#cccccc;font-size:14px;margin-left:12px;">We get to work making your competitors uncomfortable</span>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0;font-size:16px;line-height:1.7;color:#cccccc;">
                If you have any questions in the meantime, just reply to this email. We're real people and we actually respond.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background-color:#00E5CC;border-radius:8px;">
                    <a href="https://nunyabunya.com/book" style="display:inline-block;padding:16px 32px;color:#111111;font-size:14px;font-weight:700;text-decoration:none;text-transform:uppercase;letter-spacing:2px;">
                      Book Your Kickoff Call
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;font-size:12px;color:#666666;text-align:center;">
                Nunya Bunya Pty Ltd &middot; Brisbane, Queensland, Australia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
