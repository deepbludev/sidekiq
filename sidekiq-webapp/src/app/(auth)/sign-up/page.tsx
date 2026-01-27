import { AuthCard } from "@sidekiq/auth/components/auth-card";
import { SignUpForm } from "@sidekiq/auth/components/sign-up-form";
import { OAuthButtons } from "@sidekiq/auth/components/oauth-buttons";

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl } = await searchParams;
  const callbackURL = callbackUrl ?? "/chat";

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
        <SignUpForm callbackURL={callbackURL} />
        <OAuthButtons callbackURL={callbackURL} />
      </div>
    </AuthCard>
  );
}
