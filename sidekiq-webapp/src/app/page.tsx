import { redirect } from "next/navigation";
import Link from "next/link";

import { getSession } from "@sidekiq/server/better-auth/server";
import { Button } from "@sidekiq/components/ui/button";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          sidekiq
        </h1>
        <p className="text-muted-foreground max-w-md text-center text-lg">
          Your premium AI chat companion with custom assistants
        </p>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-border hover:bg-accent bg-transparent"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Phase 0.1 Authentication Complete
        </p>
      </div>
    </main>
  );
}
