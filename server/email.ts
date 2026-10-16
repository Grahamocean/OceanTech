import "dotenv/config";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const emailFrom = process.env.EMAIL_FROM || "OceanTech <onboarding@resend.dev>";

if (!apiKey) {
  throw new Error("RESEND_API_KEY is missing from the environment.");
}

const resend = new Resend(apiKey);

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const verificationUrl = new URL("/verify-email", frontendUrl);
  verificationUrl.searchParams.set("token", token);

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: [to],
    subject: "Verify your OceanTech email address",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Verify your OceanTech email</title>
        </head>
        <body style="margin: 0; padding: 32px 16px; background: #f5f5f5; font-family: Arial, sans-serif; color: #171717;">
          <div style="max-width: 560px; margin: 0 auto; padding: 32px; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
            <h1 style="margin-top: 0; font-size: 26px;">Welcome to OceanTech</h1>

            <p style="font-size: 15px; line-height: 1.7;">
              Thanks for creating an OceanTech account.
            </p>

            <p style="font-size: 15px; line-height: 1.7;">
              Verify your email address using the button below.
            </p>

            <p style="margin: 28px 0;">
              <a
                href="${verificationUrl.toString()}"
                style="display: inline-block; padding: 13px 22px; background: #171717; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: 600;"
              >
                Verify my email
              </a>
            </p>

            <p style="font-size: 13px; line-height: 1.7; color: #525252;">
              If the button doesn't work, copy this link into your browser:
            </p>

            <p style="font-size: 12px; line-height: 1.7; overflow-wrap: anywhere;">
              <a href="${verificationUrl.toString()}" style="color: #171717;">
                ${verificationUrl.toString()}
              </a>
            </p>

            <p style="font-size: 13px; line-height: 1.7; color: #737373;">
              This link contains a private verification token. Do not share it.
              If you didn't create an OceanTech account, you can ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("[Email] Resend rejected the verification email:", {
      name: error.name,
      message: error.message,
    });

    throw new Error(`Resend email failed: ${error.message}`);
  }

  console.info("[Email] Verification email accepted by Resend:", {
    to,
    emailId: data?.id,
  });
}
