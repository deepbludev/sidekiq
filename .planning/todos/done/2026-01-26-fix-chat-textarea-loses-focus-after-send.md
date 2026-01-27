---
created: 2026-01-26T12:00
title: Fix chat textarea loses focus after sending message
area: ui
files:
  - src/components/chat/chat-input.tsx
  - src/components/chat/chat-interface.tsx
---

## Problem

When a user sends a message in the chat, the text area input loses focus. This means the user has to click back into the textarea to continue typing their next message. This breaks the conversational flow — users expect to be able to send a message and immediately start typing the next one without any extra clicks.

This is a common UX issue in chat applications, typically caused by:
- Component re-rendering that unmounts/remounts the textarea
- Focus not being restored after form submission or state update
- React key changes causing the input to lose its DOM identity

## Solution

TBD — needs investigation. Likely approaches:
1. Add a `ref` to the textarea and call `.focus()` after message submission completes
2. Check if the component is re-mounting unnecessarily (React key prop issue)
3. Ensure `useChat`'s `handleSubmit` doesn't cause a re-render that drops focus
4. Use `useEffect` or callback after send to restore focus to the input
