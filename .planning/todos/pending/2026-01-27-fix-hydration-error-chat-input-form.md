---
created: 2026-01-27T07:15
title: Fix hydration error on ChatInput form
area: ui
files:
  - src/components/chat/chat-input.tsx:80
  - src/components/chat/chat-interface.tsx:330
  - src/app/(dashboard)/chat/[threadId]/page.tsx:124
---

## Problem

A hydration mismatch error appears in the Next.js 15.5.9 dev console on the chat thread page. The diff shows `data-np-autofill-form-type`, `data-np-checked`, and `data-np-watching` attributes on the `<form>` element in `ChatInput` — these are injected by a browser extension (likely a password manager like 1Password or NordPass) after SSR, causing React to report a mismatch.

This is **likely not critical** — the error is caused by the browser extension modifying the DOM before React hydrates, not by a bug in the application code. However, it produces noisy console errors during development.

Note: The user is unsure if this is critical. Worth investigating whether it causes any visible UI issues or if it can be safely ignored / suppressed.

## Solution

Potential approaches (TBD — investigate before deciding):

1. **Suppress with `suppressHydrationWarning`** on the `<form>` element — simplest fix but masks the warning
2. **Verify no app-side cause** — confirm the mismatch is purely from the browser extension and not from any server/client branching in the component tree
3. **Ignore** — if confirmed to be extension-only, this is a known React/Next.js issue with browser extensions and can be safely ignored
