import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Sidekiq | Sidekiq",
  description: "Create a new custom AI assistant",
};

export default function CreateSidekiqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
