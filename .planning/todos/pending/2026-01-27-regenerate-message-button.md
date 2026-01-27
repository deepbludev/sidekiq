---
created: 2026-01-27T05:31
title: Regenerate message button
area: ui
files:
  - src/components/chat (chat message components)
---

## Problem

Users need the ability to regenerate an assistant response — re-sending the same prompt to get a new completion. The screenshot shows a "Regenerate" tooltip on a button in the message metadata area (next to copy), confirming this is an expected UX pattern. Currently the button is not functional or not yet implemented.

## Solution

TBD — Add a regenerate button to assistant messages that re-sends the preceding user message to the LLM and replaces (or appends) the assistant response. Consider: replace-in-place vs append new response, loading state, error handling.
