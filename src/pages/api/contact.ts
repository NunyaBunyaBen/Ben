import type { APIRoute } from "astro";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, business, message } = await request.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Nunya Bunya Website <ben@nunyabunya.com>",
      to: "ben@nunyabunya.com",
      replyTo: email,
      subject: `New enquiry from ${name}${business ? ` — ${business}` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;padding:32px;border-radius:12px;">
          <h2 style="color:#00E5CC;margin:0 0 24px;">New Contact Enquiry</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#999;width:120px;">Name</td><td style="padding:8px 0;color:#fff;">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;color:#fff;"><a href="mailto:${email}" style="color:#00E5CC;">${email}</a></td></tr>
            ${business ? `<tr><td style="padding:8px 0;color:#999;">Business</td><td style="padding:8px 0;color:#fff;">${business}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px;padding:16px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #00E5CC;">
            <p style="color:#999;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Message</p>
            <p style="color:#fff;margin:0;line-height:1.7;">${message.replace(/\n/g, "<br>")}</p>
          </div>
          <p style="color:#444;font-size:12px;margin-top:24px;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
