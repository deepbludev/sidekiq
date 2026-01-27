import { Resend } from "resend";
import { env } from "@sidekiq/shared/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendTeamInviteEmailParams {
  to: string;
  teamName: string;
  inviterName: string;
  inviteToken: string;
}

/**
 * Send team invitation email via Resend.
 * Falls back to console logging in development when RESEND_API_KEY not set.
 *
 * @param params - Email parameters including recipient, team name, inviter, and token
 * @returns The invite URL (useful for copyable link feature)
 */
export async function sendTeamInviteEmail({
  to,
  teamName,
  inviterName,
  inviteToken,
}: SendTeamInviteEmailParams): Promise<string> {
  const baseUrl = env.BETTER_AUTH_URL;
  const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

  console.log(`[Team] Invite created for ${to} to join ${teamName}`);
  console.log(`[Team] Invite URL: ${inviteUrl}`);

  if (!resend) {
    console.log(`[Team] Resend not configured - email not sent`);
    return inviteUrl;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      subject: `You're invited to join ${teamName} on Sidekiq`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #18181b; margin-bottom: 16px;">Join ${teamName}</h1>
          <p style="color: #52525b; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join their team on Sidekiq.
          </p>
          <p style="color: #52525b; line-height: 1.6;">
            Sidekiq is a premium AI chat application with custom assistants and team collaboration.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 24px 0; font-weight: 500;">
            Accept Invitation
          </a>
          <p style="color: #71717a; font-size: 14px;">
            This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br />
            <a href="${inviteUrl}" style="color: #6366f1;">${inviteUrl}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(`[Team] Resend error:`, error);
      throw new Error(error.message);
    }

    console.log(`[Team] Invite email sent successfully. ID: ${data?.id}`);
  } catch (err) {
    console.error(`[Team] Failed to send invite email:`, err);
    throw err;
  }

  return inviteUrl;
}
