# Phase 8: Team Foundation - Research

**Researched:** 2026-01-25
**Domain:** Team management, member invites, role-based access control
**Confidence:** HIGH

## Summary

This phase implements team creation, member management, and an email-based invite system. The codebase already has the database schema defined (teams, teamMembers, teamInvites tables) and uses established patterns for CRUD operations, forms, and dialogs that can be extended for team management.

Key findings:
- **Database schema already exists**: teams, teamMembers, teamInvites tables with proper relations and indexes
- **Resend already integrated**: Password reset email pattern in `src/server/better-auth/config.ts` provides the template for invite emails
- **nanoid already in use**: Secure ID generation for entities; extend for invite tokens
- **Fuse.js pattern established**: `useThreadSearch` hook provides the pattern for member list search (threshold 0.4)
- **UI patterns established**: Avatar picker, delete dialogs, forms all exist and can be reused

**Primary recommendation:** Extend existing patterns. Use the Sidekiq router as a template for the team router. Reuse the avatar picker component for team avatars. Follow the delete dialog pattern for member removal and team deletion.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | ^6.8.0 | Email sending for invites | Already integrated in project for password reset |
| nanoid | ^5.1.6 | Secure token generation | Already used for IDs throughout codebase, cryptographically secure |
| fuse.js | ^7.1.0 | Member list fuzzy search | Already used for thread search with established patterns |
| date-fns | ^4.1.0 | Date calculations (expiration) | Already in project dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.24.2 | Input validation schemas | All API inputs and form validation |
| react-hook-form | ^7.71.1 | Form state management | Team creation/edit forms |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Member action menus | Three-dot action menu per member |
| @radix-ui/react-alert-dialog | ^1.1.15 | Confirmation dialogs | Member removal, team deletion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nanoid for tokens | crypto.randomBytes | nanoid is URL-safe out of box, already used in project |
| Resend | SendGrid/Postmark | Resend already configured, simple API |
| Fuse.js | Native filter | Fuse provides typo tolerance for member search |

**Installation:**
No new packages required - all dependencies already in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── server/api/routers/
│   └── team.ts                    # Team CRUD, member management, invites
├── lib/validations/
│   └── team.ts                    # Zod schemas for team operations
├── components/team/
│   ├── team-form.tsx              # Create/edit team form
│   ├── team-avatar.tsx            # Team avatar display (reuse sidekiq-avatar pattern)
│   ├── team-member-list.tsx       # Member list with search
│   ├── team-member-row.tsx        # Single member with actions
│   ├── invite-member-dialog.tsx   # Email invite form
│   ├── delete-team-dialog.tsx     # Type-to-confirm deletion
│   └── remove-member-dialog.tsx   # Confirmation for removal
├── components/sidebar/
│   └── sidebar-teams.tsx          # Team section in sidebar
├── hooks/
│   ├── use-team-actions.ts        # Team mutation hooks
│   └── use-member-search.ts       # Member list search (reuse thread search pattern)
├── app/(dashboard)/
│   └── settings/
│       └── teams/
│           └── page.tsx           # Team settings within user settings
└── app/invite/
    └── [token]/
        └── page.tsx               # Public invite acceptance page
```

### Pattern 1: Team Router (following sidekiq router)
**What:** tRPC router with protected procedures for team operations
**When to use:** All team-related API calls
**Example:**
```typescript
// Source: Existing pattern from src/server/api/routers/sidekiq.ts
export const teamRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createTeamSchema)
    .mutation(async ({ ctx, input }) => {
      const [team] = await ctx.db.insert(teams).values({
        id: nanoid(),
        name: input.name,
        ownerId: ctx.session.user.id,
        avatar: input.avatar,
      }).returning();

      // Auto-add owner as member with owner role
      await ctx.db.insert(teamMembers).values({
        teamId: team.id,
        userId: ctx.session.user.id,
        role: "owner",
      });

      return team;
    }),
});
```

### Pattern 2: Invite Token Generation
**What:** Secure URL-safe token for email invites
**When to use:** Creating new team invites
**Example:**
```typescript
// Source: Established nanoid pattern + security best practices
import { nanoid } from "nanoid";
import { addDays } from "date-fns";

const INVITE_TOKEN_LENGTH = 32; // 32 chars = ~192 bits of entropy
const INVITE_EXPIRY_DAYS = 7;

const token = nanoid(INVITE_TOKEN_LENGTH);
const expiresAt = addDays(new Date(), INVITE_EXPIRY_DAYS);

await ctx.db.insert(teamInvites).values({
  id: nanoid(),
  teamId: input.teamId,
  email: input.email.toLowerCase(),
  token,
  expiresAt,
});
```

### Pattern 3: Member Search Hook (following useThreadSearch)
**What:** Fuse.js fuzzy search for member list filtering
**When to use:** Filtering member list by name or email
**Example:**
```typescript
// Source: Pattern from src/hooks/use-thread-search.tsx
export function useMemberSearch(members: TeamMember[]) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const fuse = useMemo(
    () => new Fuse(members, {
      keys: ["name", "email"],
      threshold: 0.4, // Per CONTEXT.md
      ignoreLocation: true,
    }),
    [members],
  );

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return members;
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [fuse, debouncedQuery, members]);

  return { query, setQuery, results };
}
```

### Pattern 4: Invite Email (following password reset)
**What:** HTML email with invite link via Resend
**When to use:** Sending team invitations
**Example:**
```typescript
// Source: Pattern from src/server/better-auth/config.ts
const baseUrl = env.BETTER_AUTH_URL;
const inviteUrl = `${baseUrl}/invite/${token}`;

await resend.emails.send({
  from: env.EMAIL_FROM ?? "noreply@sidekiq.app",
  to: input.email,
  subject: `You're invited to join ${team.name} on Sidekiq`,
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #18181b;">Join ${team.name}</h1>
      <p style="color: #52525b;">
        ${inviter.name} has invited you to join their team on Sidekiq.
      </p>
      <a href="${inviteUrl}" style="display: inline-block; background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Accept Invitation
      </a>
      <p style="color: #71717a; font-size: 14px;">
        This invitation expires in 7 days.
      </p>
    </div>
  `,
});
```

### Anti-Patterns to Avoid
- **Storing plaintext tokens**: Store hashed tokens if security is critical. However, since tokens are single-use and short-lived (7 days), plaintext is acceptable here similar to password reset tokens.
- **Unlimited invites**: Implement rate limiting to prevent abuse (e.g., 20 pending invites per team)
- **No email validation**: Always lowercase and validate email format with Zod
- **Stale invite cleanup**: Don't query expired invites; filter by `expiresAt > now` in queries

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secure tokens | Math.random or UUID v4 | nanoid(32) | Cryptographically secure, URL-safe |
| Email sending | Direct SMTP | Resend SDK | Handles deliverability, retries, tracking |
| Fuzzy search | includes() filter | Fuse.js | Typo tolerance, consistent UX |
| Role icons | Custom SVG | Lucide icons | Crown, Shield already available |
| Date expiry | Manual math | date-fns addDays/isAfter | Handles edge cases, timezone-safe |

**Key insight:** All required functionality exists in already-installed dependencies. Focus on integration, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Race Condition on Invite Acceptance
**What goes wrong:** Two requests accept same invite simultaneously, creating duplicate members
**Why it happens:** No transaction or unique constraint on invite acceptance
**How to avoid:** Use database transaction; set acceptedAt atomically; add unique constraint on (teamId, userId) in teamMembers
**Warning signs:** Duplicate member entries in team member list

### Pitfall 2: Orphaned Invites After Team Deletion
**What goes wrong:** Pending invites remain valid after team is deleted
**Why it happens:** Foreign key cascade not properly configured
**How to avoid:** Already handled - schema has `onDelete: "cascade"` on teamInvites.teamId
**Warning signs:** Invite acceptance throws foreign key error

### Pitfall 3: Case-Sensitive Email Matching
**What goes wrong:** User signs up with different case than invite, can't join team
**Why it happens:** Email compared case-sensitively
**How to avoid:** Always lowercase emails in both invite creation and acceptance lookup
**Warning signs:** "Invite not found" for valid invites with different casing

### Pitfall 4: Owner Self-Removal
**What goes wrong:** Team owner removes themselves, leaving orphaned team
**Why it happens:** No check preventing owner from self-removal
**How to avoid:** Prevent owner removal; require ownership transfer first
**Warning signs:** Teams with no owner, inaccessible teams

### Pitfall 5: Stale Team Selection in localStorage
**What goes wrong:** User's selected team is deleted by owner, but persisted in localStorage
**Why it happens:** No validation of stored team ID on load
**How to avoid:** Validate stored team ID exists in user's teams on mount; fallback to null
**Warning signs:** 404 errors, missing team data after deletion

## Code Examples

Verified patterns from official sources and existing codebase:

### Team Creation Form (following sidekiq-form pattern)
```typescript
// Source: Pattern from src/components/sidekiq/sidekiq-form.tsx
const form = useForm<TeamFormValues>({
  resolver: zodResolver(teamFormSchema),
  defaultValues: {
    name: "",
    avatar: { type: "initials", color: "#6366f1" },
  },
  mode: "onChange",
});
```

### Role Permission Check
```typescript
// Source: Pattern for authorization checks
const canInvite = (userRole: TeamRole) =>
  userRole === "owner" || userRole === "admin";

const canRemoveMember = (userRole: TeamRole, targetRole: TeamRole) => {
  if (userRole === "owner") return targetRole !== "owner";
  if (userRole === "admin") return targetRole === "member";
  return false;
};

const canChangeRole = (userRole: TeamRole, targetRole: TeamRole, newRole: TeamRole) => {
  if (userRole === "owner") return true; // Owner can change any role
  if (userRole === "admin") {
    // Admin can promote member to admin, demote admin to member
    return (targetRole === "member" || targetRole === "admin") && newRole !== "owner";
  }
  return false;
};
```

### Invite Acceptance Flow
```typescript
// Source: Standard invite acceptance pattern
async function acceptInvite(token: string, userId: string) {
  const invite = await db.query.teamInvites.findFirst({
    where: and(
      eq(teamInvites.token, token),
      isNull(teamInvites.acceptedAt),
      gt(teamInvites.expiresAt, new Date()),
    ),
    with: { team: true },
  });

  if (!invite) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invite" });
  }

  // Transaction: mark invite accepted + add member
  await db.transaction(async (tx) => {
    await tx.update(teamInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(teamInvites.id, invite.id));

    await tx.insert(teamMembers).values({
      teamId: invite.teamId,
      userId,
      role: "member",
    });
  });

  return invite.team;
}
```

### Copyable Invite Link Generation
```typescript
// Source: Alternative to email-only invites per CONTEXT.md
// Generate link without sending email (for manual sharing)
async function generateInviteLink(teamId: string, email: string) {
  const token = nanoid(32);
  const expiresAt = addDays(new Date(), 7);

  await db.insert(teamInvites).values({
    id: nanoid(),
    teamId,
    email: email.toLowerCase(),
    token,
    expiresAt,
  });

  const baseUrl = env.BETTER_AUTH_URL;
  return `${baseUrl}/invite/${token}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session-based team context | localStorage + server validation | Current | Client-side team switching with server fallback |
| UUID v4 tokens | nanoid with higher entropy | 2023+ | Better security, shorter URLs |
| SMTP directly | Transactional email API (Resend) | 2022+ | Better deliverability, less infrastructure |

**Deprecated/outdated:**
- None identified for this domain in the current stack

## Open Questions

Things that couldn't be fully resolved:

1. **Team member limit enforcement**
   - What we know: Default 50 members per CONTEXT.md, displayed as "5/50 members"
   - What's unclear: Is this a hard limit or upgradeable? Stored per-team or global config?
   - Recommendation: Implement as column in teams table with default 50, check on invite creation

2. **Admin role granularity**
   - What we know: Admins can invite/remove members, change roles (except owner demotion)
   - What's unclear: Can admins remove other admins? (Clarified in CONTEXT: only owner can)
   - Recommendation: Already decided in CONTEXT.md - admins cannot remove other admins

3. **Resend fallback in development**
   - What we know: Password reset logs to console when RESEND_API_KEY not set
   - What's unclear: Should invites follow same pattern or fail explicitly?
   - Recommendation: Follow same pattern - log invite URL to console in dev, require key in prod

## Sources

### Primary (HIGH confidence)
- `/resend/resend-node` Context7 - Email sending patterns, error handling
- `/websites/fusejs_io` Context7 - Fuzzy search configuration
- Existing codebase patterns:
  - `src/server/api/routers/sidekiq.ts` - Router CRUD pattern
  - `src/server/better-auth/config.ts` - Email sending pattern
  - `src/hooks/use-thread-search.tsx` - Fuse.js search hook
  - `src/components/sidekiq/delete-sidekiq-dialog.tsx` - Type-to-confirm pattern
  - `src/server/db/schema.ts` - Existing team schema

### Secondary (MEDIUM confidence)
- [UUID vs Crypto.randomUUID vs NanoID](https://medium.com/@matynelawani/uuid-vs-crypto-randomuuid-vs-nanoid-313e18144d8c) - Token security comparison
- [System Design: inviting users to a group](https://medium.com/@itayeylon/system-design-inviting-users-to-a-group-98b1e0967b06) - Invite system architecture

### Tertiary (LOW confidence)
- None - all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in project
- Architecture: HIGH - Following established patterns from existing codebase
- Pitfalls: HIGH - Based on common patterns and database schema analysis

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain)
