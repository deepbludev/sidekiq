import { AuthCard } from "@sidekiq/components/auth/auth-card";
import { SignInForm } from "@sidekiq/components/auth/sign-in-form";
import { OAuthButtons } from "@sidekiq/components/auth/oauth-buttons";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  const callbackURL = callbackUrl ?? "/chat";

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={{
        text: "Don't have an account?",
        linkText: "Sign up",
        linkHref: "/sign-up",
      }}
    >
      <div className="space-y-6">
        <SignInForm callbackURL={callbackURL} />
        <OAuthButtons callbackURL={callbackURL} />
      </div>
    </AuthCard>
  );
}
