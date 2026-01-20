-- Core Models Migration
-- Creates: enums (team_role, message_role), teams, team_members, team_invites, sidekiqs, threads, messages
-- Drops: pg-drizzle_post (demo table)

-- Drop demo table
DROP TABLE IF EXISTS "pg-drizzle_post";
DROP SEQUENCE IF EXISTS "pg-drizzle_post_id_seq";

--> statement-breakpoint
-- Create enums
DO $$ BEGIN
  CREATE TYPE "team_role" AS ENUM ('owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "message_role" AS ENUM ('user', 'assistant', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
-- Create teams table
CREATE TABLE IF NOT EXISTS "team" (
  "id" text PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "owner_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Create team_member table (junction table)
CREATE TABLE IF NOT EXISTS "team_member" (
  "team_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" "team_role" NOT NULL DEFAULT 'member',
  "joined_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Create team_invite table
CREATE TABLE IF NOT EXISTS "team_invite" (
  "id" text PRIMARY KEY NOT NULL,
  "team_id" text NOT NULL,
  "email" varchar(255) NOT NULL,
  "token" text NOT NULL UNIQUE,
  "role" "team_role" NOT NULL DEFAULT 'member',
  "accepted_at" timestamp,
  "rejected_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Create sidekiq table
CREATE TABLE IF NOT EXISTS "sidekiq" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL,
  "team_id" text,
  "name" varchar(100) NOT NULL,
  "description" varchar(500),
  "instructions" text NOT NULL,
  "is_public" boolean NOT NULL DEFAULT false,
  "can_team_edit" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Create thread table
CREATE TABLE IF NOT EXISTS "thread" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "sidekiq_id" text,
  "title" varchar(255),
  "active_model" varchar(100),
  "is_pinned" boolean NOT NULL DEFAULT false,
  "is_archived" boolean NOT NULL DEFAULT false,
  "last_activity_at" timestamp NOT NULL DEFAULT now(),
  "message_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Create message table
CREATE TABLE IF NOT EXISTS "message" (
  "id" text PRIMARY KEY NOT NULL,
  "thread_id" text NOT NULL,
  "parent_message_id" text,
  "role" "message_role" NOT NULL,
  "content" text NOT NULL,
  "model" varchar(100),
  "input_tokens" integer,
  "output_tokens" integer,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- Add foreign key constraints
ALTER TABLE "team" ADD CONSTRAINT "team_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "sidekiq" ADD CONSTRAINT "sidekiq_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "sidekiq" ADD CONSTRAINT "sidekiq_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_sidekiq_id_sidekiq_id_fk" FOREIGN KEY ("sidekiq_id") REFERENCES "public"."sidekiq"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "team_owner_idx" ON "team" USING btree ("owner_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_member_team_idx" ON "team_member" USING btree ("team_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_member_user_idx" ON "team_member" USING btree ("user_id");

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_member_unique" ON "team_member" USING btree ("team_id", "user_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_invite_team_idx" ON "team_invite" USING btree ("team_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_invite_email_idx" ON "team_invite" USING btree ("email");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_invite_token_idx" ON "team_invite" USING btree ("token");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sidekiq_owner_idx" ON "sidekiq" USING btree ("owner_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sidekiq_team_idx" ON "sidekiq" USING btree ("team_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_user_idx" ON "thread" USING btree ("user_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_sidekiq_idx" ON "thread" USING btree ("sidekiq_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_last_activity_idx" ON "thread" USING btree ("last_activity_at");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thread_pinned_activity_idx" ON "thread" USING btree ("is_pinned", "last_activity_at");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_thread_idx" ON "message" USING btree ("thread_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_parent_idx" ON "message" USING btree ("parent_message_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_created_idx" ON "message" USING btree ("created_at");
