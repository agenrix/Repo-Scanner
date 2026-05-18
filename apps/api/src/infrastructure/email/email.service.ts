import { Resend } from "resend";
import { env } from "~/infrastructure/config/env.config";

const resend = new Resend(env.email.resendApiKey);

interface SendInvitationEmailOptions {
  toEmail: string;
  inviterName: string;
  organizationName: string;
  invitationId: string;
  role: string;
}

export async function sendInvitationEmail({
  toEmail,
  inviterName,
  organizationName,
  invitationId,
  role,
}: SendInvitationEmailOptions): Promise<void> {
  const acceptUrl = `${env.http.baseUrl}/v1/organizations/invitations/${invitationId}/accept`;

  const html = buildInvitationEmailHtml({
    inviterName,
    organizationName,
    role,
    acceptUrl,
    toEmail,
  });

  const { error } = await resend.emails.send({
    from: env.email.fromAddress,
    to: toEmail,
    subject: `${inviterName} invited you to join ${organizationName} on Agenrix`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}

function buildInvitationEmailHtml({
  inviterName,
  organizationName,
  role,
  acceptUrl,
  toEmail,
}: {
  inviterName: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
  toEmail: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${organizationName}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f11;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f11;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;border:1px solid #2e2e38;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9 0%,#4f46e5 100%);padding:32px 40px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Agenrix</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">AI Agent Discovery Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#ffffff;">You're invited!</h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1aa;">
                <strong style="color:#c4b5fd;">${inviterName}</strong> has invited you to join
                <strong style="color:#c4b5fd;">${organizationName}</strong> on Agenrix as a
                <strong style="color:#c4b5fd;">${role}</strong>.
              </p>

              <p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:#71717a;">
                Click the button below to accept the invitation and start collaborating on AI agent discovery.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6d28d9 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:32px 0;">
                <tr>
                  <td style="border-top:1px solid #2e2e38;"></td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#52525b;">Or copy and paste this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#6d28d9;word-break:break-all;">${acceptUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2e2e38;background-color:#16161b;">
              <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
                This invitation was sent to ${toEmail}. If you weren't expecting this, you can safely ignore this email.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#52525b;text-align:center;">
                This invitation expires in <strong style="color:#71717a;">7 days</strong>.
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
