import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Sidekiq | Sidekiq",
  description: "Edit your custom AI assistant",
};

export default function EditSidekiqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
