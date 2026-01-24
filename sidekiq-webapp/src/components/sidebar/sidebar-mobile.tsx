"use client";

import { useState, cloneElement, type ReactElement } from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@sidekiq/components/ui/sheet";
import { Button } from "@sidekiq/components/ui/button";

interface SidebarMobileProps {
  /** Sidebar component to render inside the drawer */
  children: ReactElement<{ onThreadSelect?: () => void }>;
}

/**
 * Mobile sidebar drawer wrapper.
 *
 * Wraps sidebar content in a Sheet that slides from left.
 * Provides a hamburger menu trigger button for mobile viewports.
 * Closes automatically when a thread is selected via onThreadSelect callback.
 *
 * @example
 * ```tsx
 * <SidebarMobile>
 *   <Sidebar />
 * </SidebarMobile>
 * ```
 */
export function SidebarMobile({ children }: SidebarMobileProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        {/* Pass onThreadSelect to close drawer when thread is clicked */}
        {cloneElement(children, {
          onThreadSelect: () => setOpen(false),
        })}
      </SheetContent>
    </Sheet>
  );
}
