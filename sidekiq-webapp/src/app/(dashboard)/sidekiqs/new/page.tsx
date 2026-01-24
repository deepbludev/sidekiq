import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sidekiq/components/ui/breadcrumb";
import { SidekiqForm } from "@sidekiq/components/sidekiq/sidekiq-form";

/**
 * Create Sidekiq page.
 * Split layout with form on left, preview on right.
 * Breadcrumb: Sidekiqs > Create New
 */
export default function CreateSidekiqPage() {
  return (
    <div className="container max-w-6xl py-8">
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
            <BreadcrumbPage>Create New</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Sidekiq</h1>
        <p className="text-muted-foreground mt-1">
          Define your custom AI assistant&apos;s personality and behavior
        </p>
      </div>

      {/* Form with preview */}
      <SidekiqForm mode="create" />
    </div>
  );
}
