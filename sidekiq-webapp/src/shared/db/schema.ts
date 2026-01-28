import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Enums
 */
export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
]);
export const workspaceTypeEnum = pgEnum("workspace_type", ["personal", "team"]);
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

/**
 * User preferences stored as JSONB.
 * Extensible structure for user-specific settings.
 */
export interface UserPreferences {
  /** User's default model for new threads */
  defaultModel?: string;
  /** Array of model IDs the user has favorited */
  favoriteModels?: string[];
  // Prepared for Phase 6/7: sidekiqDefaults?: Record<string, string>;
}

/**
 * Sidekiq avatar configuration.
 * Supports either text initials or emoji with customizable background color.
 */
export interface SidekiqAvatar {
  type: "initials" | "emoji";
  color: string;
  emoji?: string;
}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  preferences: jsonb("preferences").$type<UserPreferences>().default({}),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

/**
 * Workspaces - Unified organizational unit (personal or team)
 *
 * Every user has exactly one personal workspace (enforced by partial unique index).
 * Team workspaces support collaboration with multiple members.
 */
export const workspaces = pgTable(
  "workspace",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    /** Workspace type discriminator: 'personal' for single-user, 'team' for collaborative */
    type: workspaceTypeEnum("type").notNull(),
    /** Optional workspace description */
    description: varchar("description", { length: 500 }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Avatar configuration (initials or emoji with color), same as Sidekiq */
    avatar: jsonb("avatar")
      .$type<SidekiqAvatar>()
      .default({ type: "initials", color: "#6366f1" })
      .notNull(),
    /** Maximum number of members allowed in this workspace */
    memberLimit: integer("member_limit").notNull().default(50),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("workspace_owner_idx").on(t.ownerId),
    index("workspace_type_idx").on(t.type),
    uniqueIndex("workspace_personal_unique")
      .on(t.ownerId)
      .where(sql`"type" = 'personal'`),
  ],
);

/**
 * Workspace Members - Junction table for workspace membership
 */
export const workspaceMembers = pgTable(
  "workspace_member",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("workspace_member_workspace_idx").on(t.workspaceId),
    index("workspace_member_user_idx").on(t.userId),
    uniqueIndex("workspace_member_unique").on(t.workspaceId, t.userId),
  ],
);

/**
 * Workspace Invites - Secure token-based workspace invitations
 */
export const workspaceInvites = pgTable(
  "workspace_invite",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    token: text("token").notNull().unique(),
    role: workspaceRoleEnum("role").notNull().default("member"),
    acceptedAt: timestamp("accepted_at"),
    rejectedAt: timestamp("rejected_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("workspace_invite_workspace_idx").on(t.workspaceId),
    index("workspace_invite_email_idx").on(t.email),
    index("workspace_invite_token_idx").on(t.token),
  ],
);

/**
 * Sidekiqs - Custom AI assistants
 */
export const sidekiqs = pgTable(
  "sidekiq",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),
    instructions: text("instructions").notNull(),
    /** Array of conversation starter prompts */
    conversationStarters: jsonb("conversation_starters")
      .$type<string[]>()
      .default([])
      .notNull(),
    /** Default model ID to use for new chats with this Sidekiq */
    defaultModel: varchar("default_model", { length: 100 }),
    /** Avatar configuration (initials or emoji with color) */
    avatar: jsonb("avatar")
      .$type<SidekiqAvatar>()
      .default({ type: "initials", color: "#6366f1" })
      .notNull(),
    /** Whether this Sidekiq is favorited (appears at top of sidebar) */
    isFavorite: boolean("is_favorite").notNull().default(false),
    /** Last time this Sidekiq was used to start a chat */
    lastUsedAt: timestamp("last_used_at"),
    /** Denormalized count of threads using this Sidekiq */
    threadCount: integer("thread_count").notNull().default(0),
    isPublic: boolean("is_public").notNull().default(false),
    canTeamEdit: boolean("can_team_edit").notNull().default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("sidekiq_owner_idx").on(t.ownerId),
    index("sidekiq_workspace_idx").on(t.workspaceId),
    index("sidekiq_favorite_idx").on(t.isFavorite),
    uniqueIndex("sidekiq_owner_name_unique").on(
      t.ownerId,
      sql`LOWER(${t.name})`,
    ),
  ],
);

/**
 * Threads - Conversation containers
 */
export const threads = pgTable(
  "thread",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sidekiqId: text("sidekiq_id").references(() => sidekiqs.id, {
      onDelete: "set null",
    }),
    /** Preserved name if the associated Sidekiq was deleted */
    deletedSidekiqName: varchar("deleted_sidekiq_name", { length: 100 }),
    title: varchar("title", { length: 255 }),
    activeModel: varchar("active_model", { length: 100 }),
    isPinned: boolean("is_pinned").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    lastActivityAt: timestamp("last_activity_at")
      .$defaultFn(() => new Date())
      .notNull(),
    messageCount: integer("message_count").notNull().default(0),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("thread_user_idx").on(t.userId),
    index("thread_workspace_idx").on(t.workspaceId),
    index("thread_sidekiq_idx").on(t.sidekiqId),
    index("thread_last_activity_idx").on(t.lastActivityAt),
    index("thread_pinned_activity_idx").on(t.isPinned, t.lastActivityAt),
  ],
);

/**
 * Messages - Individual chat messages with branching support
 */
export const messages = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    parentMessageId: text("parent_message_id"),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    model: varchar("model", { length: 100 }),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("message_thread_idx").on(t.threadId),
    index("message_parent_idx").on(t.parentMessageId),
    index("message_created_idx").on(t.createdAt),
  ],
);

/**
 * Relations
 */
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  ownedWorkspaces: many(workspaces),
  workspaceMemberships: many(workspaceMembers),
  sidekiqs: many(sidekiqs),
  threads: many(threads),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(user, { fields: [workspaces.ownerId], references: [user.id] }),
  members: many(workspaceMembers),
  invites: many(workspaceInvites),
  sidekiqs: many(sidekiqs),
  threads: many(threads),
}));

export const workspaceMemberRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(user, {
      fields: [workspaceMembers.userId],
      references: [user.id],
    }),
  }),
);

export const workspaceInviteRelations = relations(
  workspaceInvites,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvites.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

export const sidekiqRelations = relations(sidekiqs, ({ one, many }) => ({
  owner: one(user, { fields: [sidekiqs.ownerId], references: [user.id] }),
  workspace: one(workspaces, {
    fields: [sidekiqs.workspaceId],
    references: [workspaces.id],
  }),
  threads: many(threads),
}));

export const threadRelations = relations(threads, ({ one, many }) => ({
  user: one(user, { fields: [threads.userId], references: [user.id] }),
  workspace: one(workspaces, {
    fields: [threads.workspaceId],
    references: [workspaces.id],
  }),
  sidekiq: one(sidekiqs, {
    fields: [threads.sidekiqId],
    references: [sidekiqs.id],
  }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: "messageBranches",
  }),
  childMessages: many(messages, { relationName: "messageBranches" }),
}));
