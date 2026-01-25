import type { ReactNode } from "react";

interface InviteLayoutProps {
  children: ReactNode;
}

/**
 * Layout for invite pages.
 * Simple centered layout without sidebar.
 */
export default function InviteLayout({ children }: InviteLayoutProps) {
  return (
    <div className="from-background to-muted/30 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      {children}
    </div>
  );
}
