---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/002-analyze-convex-migration-as-postgresql-r/002-ANALYSIS.md
autonomous: true

must_haves:
  truths:
    - "Analysis covers feature parity between PostgreSQL/Drizzle and Convex"
    - "Cost implications are modeled for expected scale"
    - "Migration complexity is assessed with effort estimate"
    - "Clear recommendation is provided with rationale"
  artifacts:
    - path: ".planning/quick/002-analyze-convex-migration-as-postgresql-r/002-ANALYSIS.md"
      provides: "Comprehensive Convex migration analysis"
      min_lines: 150
---

<objective>
Analyze Convex as a potential PostgreSQL replacement for Sidekiq

Purpose: Evaluate whether migrating from PostgreSQL/Drizzle to Convex would provide net benefits (real-time sync, simplified architecture, reduced ops) that outweigh costs (migration effort, vendor lock-in, feature parity gaps).

Output: A comprehensive analysis document with clear recommendation
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# Current data layer
@sidekiq-webapp/src/server/db/schema.ts
@sidekiq-webapp/src/server/api/routers/thread.ts
@sidekiq-webapp/src/server/api/routers/user.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Research Convex capabilities and constraints</name>
  <files>.planning/quick/002-analyze-convex-migration-as-postgresql-r/002-ANALYSIS.md (partial)</files>
  <action>
Research Convex platform capabilities via official documentation:
1. Use Context7 or WebFetch to gather current Convex documentation on:
   - Data modeling (schema definition, relationships, nested objects)
   - Query capabilities (filters, joins/relations, aggregations, complex queries)
   - Transaction support and consistency guarantees
   - Real-time subscriptions mechanism
   - Serverless functions (queries, mutations, actions)
   - Authentication integration (better-auth compatibility)
   - File storage capabilities
   - Pricing model and limits

2. Document findings in analysis structure:
   - Feature comparison table (Convex vs PostgreSQL/Drizzle)
   - Limitations relevant to Sidekiq (e.g., no raw SQL, limited aggregations)
   - Strengths for chat apps (real-time, optimistic updates)

Focus on features used by current schema: users, threads, messages, sidekiqs, teams, team members, team invites.
  </action>
  <verify>Analysis document exists with Convex capabilities section populated</verify>
  <done>Convex features and limitations documented with comparison to current stack</done>
</task>

<task type="auto">
  <name>Task 2: Assess migration complexity and produce recommendation</name>
  <files>.planning/quick/002-analyze-convex-migration-as-postgresql-r/002-ANALYSIS.md (complete)</files>
  <action>
Complete the analysis document with:

1. **Schema Migration Assessment**
   - Map current PostgreSQL schema (8 tables) to Convex equivalents
   - Identify problematic patterns: self-referential relations (message branches), JSONB fields, enums
   - Assess index requirements and Convex equivalent strategies
   - Note foreign key cascade behavior differences

2. **tRPC Layer Impact**
   - Current: 3 routers (health, thread, user) with tRPC mutations
   - Convex: Would replace with Convex functions (queries/mutations)
   - Assess effort to rewrite router logic
   - Consider: Convex can work alongside tRPC or replace it

3. **Real-time Analysis**
   - Current approach: SSE for AI streaming (works well)
   - Convex benefit: Real-time subscriptions for thread lists, team collaboration
   - Question: Is real-time thread sync worth migration cost?
   - Phase 8-9 team features: Would Convex simplify collaborative features?

4. **Cost Modeling**
   - Convex pricing: Function calls, bandwidth, storage, compute
   - Estimate for chat app: ~1000 users, ~100 messages/user/day
   - Compare to: Vercel PostgreSQL + Drizzle (included in Pro plan)
   - Factor in reduced operational overhead value

5. **Risk Assessment**
   - Vendor lock-in (Convex proprietary vs PostgreSQL standard)
   - Migration disruption to roadmap (currently Phase 4/13)
   - Learning curve for development team
   - Rollback complexity if issues arise

6. **Final Recommendation**
   - MIGRATE / DEFER / REJECT with clear rationale
   - If DEFER: conditions that would trigger reconsideration
   - If MIGRATE: high-level migration phases
   - Impact on current roadmap phases

Write complete 002-ANALYSIS.md with all sections.
  </action>
  <verify>cat .planning/quick/002-analyze-convex-migration-as-postgresql-r/002-ANALYSIS.md | wc -l shows 150+ lines</verify>
  <done>Complete analysis document with clear recommendation and supporting rationale</done>
</task>

</tasks>

<verification>
- [ ] 002-ANALYSIS.md exists and is comprehensive (150+ lines)
- [ ] Feature comparison table present
- [ ] Cost modeling section with estimates
- [ ] Migration complexity assessed
- [ ] Clear recommendation with rationale
- [ ] Impact on roadmap phases addressed
</verification>

<success_criteria>
Analysis document provides enough information to make an informed decision about Convex migration, with quantified costs, benefits, and risks.
</success_criteria>

<output>
After completion, create `.planning/quick/002-analyze-convex-migration-as-postgresql-r/002-SUMMARY.md`
</output>
