import { AuthCard } from "@sidekiq/components/auth/auth-card";
import { SignUpForm } from "@sidekiq/components/auth/sign-up-form";
import { OAuthButtons } from "@sidekiq/components/auth/oauth-buttons";

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Get started with Sidekiq today"
      footer={{
        text: "Already have an account?",
        linkText: "Sign in",
        linkHref: "/sign-in",
      }}
    >
      <div className="space-y-6">
        <SignUpForm />
        <OAuthButtons />
      </div>
    </AuthCard>
  );
}
