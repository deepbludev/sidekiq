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

TBD - Requires analysis of:
1. Feature comparison (transactions, complex queries, migrations)
2. Cost modeling at expected scale
3. Migration path complexity
4. Impact on existing roadmap phases
5. Real-time benefits vs current SSE approach
