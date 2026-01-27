"use client";

import { Copy, Pencil, RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@sidekiq/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sidekiq/components/ui/tooltip";
import { cn } from "@sidekiq/shared/lib/utils";

interface MessageActionsProps {
  /** The role of the message (user or assistant) */
  role: "user" | "assistant";
  /** The text content to copy */
  content: string;
  /** Callback when user clicks edit (user messages only) */
  onEdit?: () => void;
  /** Callback when user clicks regenerate (assistant messages only) */
  onRegenerate?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Message action buttons that appear on hover.
 * - Copy: Available for all messages
 * - Edit: Available for user messages only
 * - Regenerate: Available for assistant messages only
 */
export function MessageActions({
  role,
  content,
  onEdit,
  onRegenerate,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        "opacity-0 group-hover:opacity-100",
        "transition-opacity duration-200",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{copied ? "Copied!" : "Copy"}</p>
        </TooltipContent>
      </Tooltip>

      {role === "user" && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground h-7 w-7"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Edit</p>
          </TooltipContent>
        </Tooltip>
      )}

      {role === "assistant" && onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRegenerate}
              className="text-muted-foreground hover:text-foreground h-7 w-7"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Regenerate</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
