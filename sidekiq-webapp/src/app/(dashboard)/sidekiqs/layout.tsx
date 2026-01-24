import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sidekiqs | Sidekiq",
  description: "Manage your custom AI assistants",
};

/**
 * Layout for the Sidekiqs section.
 * Provides metadata for all /sidekiqs routes.
 */
export default function SidekiqsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
