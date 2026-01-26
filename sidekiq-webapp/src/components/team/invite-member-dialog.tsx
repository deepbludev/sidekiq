"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Copy, Mail, Link2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sidekiq/components/ui/dialog";
import { Button } from "@sidekiq/components/ui/button";
import { Input } from "@sidekiq/components/ui/input";
import { Label } from "@sidekiq/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sidekiq/components/ui/tabs";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (
    email: string,
    sendEmail: boolean,
  ) => Promise<{ inviteUrl: string }>;
  teamName: string;
  isInviting?: boolean;
}

/**
 * Dialog for inviting team members.
 * Supports both email invite and copyable link generation.
 * Per CONTEXT.md: Both options available.
 *
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @param props.onInvite - Callback when invite is triggered (returns invite URL)
 * @param props.teamName - Name of the team to display
 * @param props.isInviting - Whether invite is in progress
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  teamName,
  isInviting = false,
}: InviteMemberDialogProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "link">("email");

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setInviteUrl(null);
      setCopied(false);
      setActiveTab("email");
    }
    onOpenChange(open);
  };

  const handleInvite = async (sendEmail: boolean) => {
    const email = form.getValues("email");
    if (!email || form.formState.errors.email) return;

    try {
      const result = await onInvite(email, sendEmail);
      setInviteUrl(result.inviteUrl);
      if (!sendEmail) {
        setActiveTab("link");
      }
    } catch {
      // Error handling done by parent
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAnother = () => {
    form.reset();
    setInviteUrl(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {teamName}</DialogTitle>
          <DialogDescription>
            Send an email invitation or generate a shareable link.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-4 py-4">
            <div className="text-primary flex items-center gap-2 text-sm">
              <Check className="size-4" />
              <span>Invite created successfully!</span>
            </div>

            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="text-primary size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                This link expires in 7 days.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleSendAnother}>
                Invite Another
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "email" | "link")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email Invite
                </TabsTrigger>
                <TabsTrigger value="link" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Copy Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    {...form.register("email")}
                    disabled={isInviting}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  We&apos;ll send an email with a link to join the team.
                </p>
              </TabsContent>

              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-email">Email address</Label>
                  <Input
                    id="link-email"
                    type="email"
                    placeholder="colleague@example.com"
                    {...form.register("email")}
                    disabled={isInviting}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Generate a link to share manually. The invite is still tied to
                  this email.
                </p>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                onClick={() => handleInvite(activeTab === "email")}
                disabled={isInviting || !form.formState.isValid}
              >
                {isInviting
                  ? "Creating..."
                  : activeTab === "email"
                    ? "Send Invite"
                    : "Generate Link"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
