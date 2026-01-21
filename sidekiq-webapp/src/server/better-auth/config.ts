import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";

import { env } from "@sidekiq/env";
import { db } from "@sidekiq/server/db";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[Auth] Password reset requested for ${user.email}`);
      console.log(`[Auth] Reset URL: ${url}`);

      if (!resend) {
        console.log(`[Auth] Resend not configured - email not sent`);
        return;
      }

      try {
        const { data, error } = await resend.emails.send({
          from: env.EMAIL_FROM ?? "onboarding@resend.dev",
          to: user.email,
          subject: "Reset your password - Sidekiq",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #18181b;">Reset your password</h1>
              <p style="color: #52525b;">
                We received a request to reset your password for your Sidekiq account.
                Click the button below to set a new password.
              </p>
              <a href="${url}" style="display: inline-block; background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Reset Password
              </a>
              <p style="color: #71717a; font-size: 14px;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
          `,
        });

        if (error) {
          console.error(`[Auth] Resend error:`, error);
          throw new Error(error.message);
        }

        console.log(`[Auth] Email sent successfully. ID: ${data?.id}`);
      } catch (err) {
        console.error(`[Auth] Failed to send reset email:`, err);
        throw err;
      }
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
  },
  socialProviders: {
    github: {
      clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
