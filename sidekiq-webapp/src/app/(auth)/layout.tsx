import { redirect } from "next/navigation";
import Link from "next/link";

import { getSession } from "@sidekiq/auth/api/server";

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
    redirect("/chat");
  }

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Link
          href="/"
          className="text-foreground hover:text-muted-foreground text-3xl font-bold tracking-tight"
        >
          sidekiq
        </Link>
      </div>
      {children}
    </main>
  );
}
