"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, MessageSquare } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sidekiq/components/ui/breadcrumb";
import { Button } from "@sidekiq/components/ui/button";
import { SidekiqForm } from "@sidekiq/components/sidekiq/sidekiq-form";
import type { SidekiqAvatar } from "@sidekiq/lib/validations/sidekiq";
import { api } from "@sidekiq/shared/trpc/react";

/**
 * Edit Sidekiq page.
 * Loads existing Sidekiq data and pre-fills the form.
 * Breadcrumb: Sidekiqs > [Name] > Edit
 */
export default function EditSidekiqPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const {
    data: sidekiq,
    isLoading,
    error,
  } = api.sidekiq.getById.useQuery(
    { id },
    {
      enabled: !!id,
      staleTime: 30000, // Cache for 30s to avoid refetch on form interactions
    },
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto h-full max-w-4xl overflow-y-auto px-6 py-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !sidekiq) {
    return (
      <div className="mx-auto h-full max-w-4xl overflow-y-auto px-6 py-8">
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">
            {error?.message ?? "Sidekiq not found"}
          </p>
          <Button variant="outline" onClick={() => router.push("/sidekiqs")}>
            Back to Sidekiqs
          </Button>
        </div>
      </div>
    );
  }

  // Transform DB data to form format
  const initialData = {
    id: sidekiq.id,
    name: sidekiq.name,
    description: sidekiq.description ?? "",
    instructions: sidekiq.instructions,
    conversationStarters: sidekiq.conversationStarters,
    defaultModel: sidekiq.defaultModel,
    avatar: sidekiq.avatar as SidekiqAvatar,
  };

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto px-6 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/sidekiqs">Sidekiqs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="size-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/sidekiqs/${id}/edit`}>{sidekiq.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="size-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Sidekiq</h1>
          <p className="text-muted-foreground mt-1">
            Update your custom AI assistant&apos;s configuration
          </p>
        </div>
        <Button asChild>
          <Link href={`/chat?sidekiq=${id}`}>
            <MessageSquare className="mr-2 size-4" />
            Start Chat
          </Link>
        </Button>
      </div>

      {/* Form with preview */}
      <SidekiqForm mode="edit" initialData={initialData} />
    </div>
  );
}
