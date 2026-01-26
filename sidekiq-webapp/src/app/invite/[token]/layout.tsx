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
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      {children}
    </div>
  );
}
