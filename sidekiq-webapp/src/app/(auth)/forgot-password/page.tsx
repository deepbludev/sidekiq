import { AuthCard } from "@sidekiq/components/auth/auth-card";
import { ForgotPasswordForm } from "@sidekiq/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
      footer={{
        text: "Remember your password?",
        linkText: "Sign in",
        linkHref: "/sign-in",
      }}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
