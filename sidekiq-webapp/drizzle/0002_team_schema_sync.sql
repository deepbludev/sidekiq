-- Schema Sync Migration
-- Syncs database schema with schema.ts definitions added after 0001_core_models.sql
--
-- Changes:
-- 1. Add 'admin' value to team_role enum
-- 2. Add avatar and member_limit columns to team table
-- 3. Add missing sidekiq columns (conversation_starters, default_model, avatar, is_favorite, last_used_at, thread_count)
-- 4. Add missing sidekiq indexes (sidekiq_favorite_idx, sidekiq_owner_name_unique)
-- 5. Add deleted_sidekiq_name column to thread table

-- Add 'admin' value to team_role enum
-- Note: ALTER TYPE ADD VALUE cannot be run in a transaction block
ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'admin';

--> statement-breakpoint
-- Add avatar column to team table
ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "avatar" jsonb NOT NULL DEFAULT '{"type":"initials","color":"#6366f1"}'::jsonb;

--> statement-breakpoint
-- Add member_limit column to team table
ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "member_limit" integer NOT NULL DEFAULT 50;

--> statement-breakpoint
-- Add conversation_starters column to sidekiq table
ALTER TABLE "sidekiq" ADD COLUMN IF NOT EXISTS "conversation_starters" jsonb NOT NULL DEFAULT '[]'::jsonb;

--> statement-breakpoint
-- Add default_model column to sidekiq table
ALTER TABLE "sidekiq" ADD COLUMN IF NOT EXISTS "default_model" varchar(100);

--> statement-breakpoint
-- Add avatar column to sidekiq table
ALTER TABLE "sidekiq" ADD COLUMN IF NOT EXISTS "avatar" jsonb NOT NULL DEFAULT '{"type":"initials","color":"#6366f1"}'::jsonb;

--> statement-breakpoint
-- Add is_favorite column to sidekiq table
ALTER TABLE "sidekiq" ADD COLUMN IF NOT EXISTS "is_favorite" boolean NOT NULL DEFAULT false;

--> statement-breakpoint
-- Add last_used_at column to sidekiq table
ALTER TABLE "sidekiq" ADD COLUMN IF NOT EXISTS "last_used_at" timestamp;

--> statement-breakpoint
-- Add thread_count column to sidekiq table
ALTER TABLE "sidekiq" ADD COLUMN IF NOT EXISTS "thread_count" integer NOT NULL DEFAULT 0;

--> statement-breakpoint
-- Add deleted_sidekiq_name column to thread table
ALTER TABLE "thread" ADD COLUMN IF NOT EXISTS "deleted_sidekiq_name" varchar(100);

--> statement-breakpoint
-- Add sidekiq_favorite_idx index
CREATE INDEX IF NOT EXISTS "sidekiq_favorite_idx" ON "sidekiq" USING btree ("is_favorite");

--> statement-breakpoint
-- Add sidekiq_owner_name_unique unique index (case-insensitive name uniqueness per owner)
CREATE UNIQUE INDEX IF NOT EXISTS "sidekiq_owner_name_unique" ON "sidekiq" USING btree ("owner_id", LOWER("name"));
