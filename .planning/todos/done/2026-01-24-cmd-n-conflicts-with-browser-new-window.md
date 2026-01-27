---
created: 2026-01-24T15:30
title: Fix Cmd+N shortcut conflicting with browser new window
area: ui
files:
  - src/components/sidebar/*
---

## Problem

The keyboard shortcut Cmd+N is currently used to create a new chat, but this conflicts with the standard browser hotkey for opening a new browser window. Users on macOS (and Ctrl+N on Windows/Linux) will have their browser intercept this shortcut before the app can handle it.

## Solution

Change the "new chat" shortcut to a non-conflicting key combination. Common alternatives:
- Cmd+Shift+N (matches Chrome's "new incognito window" pattern but less common)
- Cmd+K then N (command palette style)
- Cmd+O (for "open new" - though less intuitive)
- Or simply remove the shortcut and rely on the UI button

TBD - decide on the best alternative shortcut that feels intuitive but doesn't conflict.
