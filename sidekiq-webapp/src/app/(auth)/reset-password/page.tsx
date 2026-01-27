import { redirect } from "next/navigation";

import { AuthCard } from "@sidekiq/auth/components/auth-card";
import { ResetPasswordForm } from "@sidekiq/auth/components/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your new password below"
      footer={{
        text: "Remember your password?",
        linkText: "Sign in",
        linkHref: "/sign-in",
      }}
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
