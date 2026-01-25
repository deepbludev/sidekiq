---
created: 2026-01-25T16:20
title: Sidekiq voice tone / personality feature
area: ui
files:
  - src/app/sidekiqs/[id]/edit/page.tsx
  - src/app/sidekiqs/new/page.tsx
  - src/components/sidekiqs/sidekiq-form.tsx
  - src/server/db/schema/sidekiqs.ts
---

## Problem

Sidekiqs currently lack a dedicated way to configure their communication style or personality. While users can write tone instructions in the system prompt, this requires manual effort and knowledge of prompt engineering.

A simple, user-friendly way to set the Sidekiq's voice/tone would improve the creation experience and make personalities more consistent.

## Solution

Add a "Voice / Personality" section to the Sidekiq form:

1. **Preset options list** — Common tones users can select:
   - Professional
   - Friendly & Casual
   - Concise & Direct
   - Detailed & Thorough
   - Creative & Playful
   - Technical & Precise
   - (potentially more)

2. **Custom option** — "Type your own" with a character limit (e.g., 200-300 chars max) for users who want specific personality traits

3. **Implementation considerations:**
   - Add `voiceTone` field to sidekiq schema (nullable string)
   - Inject voice tone into system message at runtime (alongside existing instructions)
   - UI: Radio/select for presets + expandable text input for custom
   - Consider showing a preview of how the tone affects responses
