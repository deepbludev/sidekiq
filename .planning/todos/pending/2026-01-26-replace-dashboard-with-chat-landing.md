---
created: 2026-01-26T12:00
title: Replace dashboard with /chat as default landing page
area: ui
files: []
---

## Problem

The dashboard page is currently useless — it doesn't provide meaningful value when users land in the app. The /chat page is a much better default landing experience since Sidekiq is fundamentally a chat application. The dashboard should be removed entirely and /chat should become the entry point.

## Solution

- Remove the dashboard page/route
- Make /chat the default landing page (redirect "/" to "/chat" or make /chat the index route)
- Clean up any navigation references to the dashboard
- Ensure the empty state on /chat is welcoming and functional as a landing experience
