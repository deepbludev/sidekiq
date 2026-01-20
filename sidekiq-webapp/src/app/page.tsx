import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@sidekiq/server/better-auth";
import { getSession } from "@sidekiq/server/better-auth/server";
import { Button } from "@sidekiq/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sidekiq/components/ui/card";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Sidekiq
        </h1>
        <p className="max-w-md text-center text-lg text-zinc-400">
          Your premium AI chat companion with custom assistants
        </p>

        <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900/50">
          <CardHeader className="text-center">
            <CardTitle className="text-white">
              {session ? `Welcome, ${session.user?.name}` : "Get Started"}
            </CardTitle>
            <CardDescription>
              {session
                ? "You're signed in and ready to chat"
                : "Sign in to start chatting with AI"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {!session ? (
              <form>
                <Button
                  variant="outline"
                  className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                  formAction={async () => {
                    "use server";
                    const res = await auth.api.signInSocial({
                      body: {
                        provider: "github",
                        callbackURL: "/",
                      },
                    });
                    if (!res.url) {
                      throw new Error("No URL returned from signInSocial");
                    }
                    redirect(res.url);
                  }}
                >
                  Sign in with GitHub
                </Button>
              </form>
            ) : (
              <form>
                <Button
                  variant="outline"
                  className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                  formAction={async () => {
                    "use server";
                    await auth.api.signOut({
                      headers: await headers(),
                    });
                    redirect("/");
                  }}
                >
                  Sign out
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-zinc-500">
          Phase 0.0 Foundation Complete
        </p>
      </div>
    </main>
  );
}
