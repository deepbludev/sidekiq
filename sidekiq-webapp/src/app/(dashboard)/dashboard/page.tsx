import { redirect } from "next/navigation";

import { getSession } from "@sidekiq/server/better-auth/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sidekiq/components/ui/card";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-white">
            Welcome, {session.user.name}!
          </CardTitle>
          <CardDescription>
            You are signed in as {session.user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-zinc-400">
            Phase 0.1 Authentication Complete
          </p>
          <SignOutButton />
        </CardContent>
      </Card>
    </main>
  );
}
