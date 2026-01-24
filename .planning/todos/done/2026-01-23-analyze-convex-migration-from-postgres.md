---
created: 2026-01-23T15:42
title: Analyze Convex migration as PostgreSQL replacement
area: database
files: []
---

## Problem

The current stack uses PostgreSQL with Drizzle ORM for data persistence. Convex is a reactive backend platform that offers real-time sync, serverless functions, and built-in authentication. Need to evaluate whether migrating to Convex would provide benefits (real-time capabilities, simplified architecture, reduced operational overhead) that outweigh costs (migration effort, learning curve, vendor lock-in, feature parity).

Key considerations:
- Current PostgreSQL schema complexity (threads, messages, sidekiqs, teams, users)
- tRPC router layer that would need replacement
- Real-time requirements (streaming AI responses already use SSE)
- Team collaboration features coming in Phase 8-9
- Cost implications at scale
- Convex limitations vs PostgreSQL flexibility

## Solution

**DEFER** - Comprehensive analysis completed in quick task 002.

See: `.planning/quick/002-analyze-convex-migration-as-postgresql-r/002-ANALYSIS.md`

Key findings:
- Migration effort: 17-24 days (3-4 weeks)
- Cost: +$25/month for Convex Pro tier
- Current stack has no pain points
- Real-time benefits primarily relevant for Phase 8-9 (teams)
- High vendor lock-in risk with Convex

Recommendation: Continue with PostgreSQL/Drizzle. Reconsider at Phase 8-9 if real-time team features exceed targeted solutions (Supabase Realtime, Pusher).

**Completed:** 2026-01-24
