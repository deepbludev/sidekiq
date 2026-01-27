"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sidekiq/ui/breadcrumb";
import { Button } from "@sidekiq/ui/button";
import { SidekiqForm } from "@sidekiq/components/sidekiq/sidekiq-form";
import { StarterTemplates } from "@sidekiq/components/sidekiq/starter-templates";
import type { SidekiqFormValues } from "@sidekiq/lib/validations/sidekiq";

/**
 * Create Sidekiq page.
 *
 * Two-step flow:
 * 1. Template selection - user picks a template or starts from scratch
 * 2. Form editing - form pre-filled with template data
 *
 * Breadcrumb: Sidekiqs > Create New
 */
export default function CreateSidekiqPage() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<Partial<SidekiqFormValues> | null>(null);

  const handleSelectTemplate = (values: Partial<SidekiqFormValues>) => {
    setSelectedTemplate(values);
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
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
            <BreadcrumbPage>Create New</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Sidekiq</h1>
        <p className="text-muted-foreground mt-1">
          {selectedTemplate
            ? "Customize your AI assistant's personality and behavior"
            : "Choose a template to get started quickly"}
        </p>
      </div>

      {/* Step 1: Template selection */}
      {!selectedTemplate && (
        <StarterTemplates onSelectTemplate={handleSelectTemplate} />
      )}

      {/* Step 2: Form with template data */}
      {selectedTemplate && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={handleBackToTemplates}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to templates
          </Button>
          <SidekiqForm mode="create" initialData={selectedTemplate} />
        </div>
      )}
    </div>
  );
}
