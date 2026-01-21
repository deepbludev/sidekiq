import { redirect } from "next/navigation";
import Link from "next/link";

import { getSession } from "@sidekiq/server/better-auth/server";

/**
 * Auth layout with centered content and redirect for authenticated users
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 px-4">
      <div className="mb-8">
        <Link
          href="/"
          className="text-3xl font-bold tracking-tight text-white hover:text-zinc-200"
        >
          Sidekiq
        </Link>
      </div>
      {children}
    </main>
  );
}
