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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Sidekiq
        </h1>
        <p className="max-w-md text-center text-lg text-zinc-400">
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
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          >
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>

        <p className="text-sm text-zinc-500">
          Phase 0.1 Authentication Complete
        </p>
      </div>
    </main>
  );
}
