---
status: complete
phase: 11-workspace-authorization
source: 11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md
started: 2026-01-29T17:00:00Z
updated: 2026-01-29T17:08:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Thread List Workspace Scoping
expected: Open the app and navigate to the sidebar. The thread list should show only threads belonging to your current active workspace (personal workspace shows your threads only). No threads from other workspaces should appear.
result: pass

### 2. Sidekiq List Workspace Scoping
expected: The sidekiq list in the sidebar or sidekiq picker should show only sidekiqs belonging to the active workspace. Personal workspace shows only your own sidekiqs.
result: pass

### 3. Create New Chat Thread
expected: Start a new chat conversation. The thread should be created successfully and appear in the thread list. The thread is assigned to the currently active workspace (you can verify it shows up in the list).
result: pass

### 4. Create New Sidekiq
expected: Create a new sidekiq (custom assistant). It should save successfully and appear in the sidekiq list within the current workspace. The sidekiq is associated with the active workspace.
result: pass

### 5. Chat Route Workspace Authorization
expected: Send a message in a chat thread. The message should be processed normally by the /api/chat endpoint. The AI responds as expected. Workspace authorization happens transparently -- no errors or interruptions.
result: pass

### 6. Thread SSR Page Access
expected: Navigate directly to a thread URL (e.g., /chat/[threadId]) that belongs to your workspace. The page should load and display the thread with its messages. The page title in the browser tab should show the thread name.
result: pass

### 7. New Chat with Sidekiq
expected: Start a new chat using a specific sidekiq (click a sidekiq to start chatting). The new chat page should load with that sidekiq's context (name, instructions) pre-configured. The conversation should use the sidekiq's personality.
result: pass

### 8. Query Cache Refresh on Workspace Switch
expected: If you have access to multiple workspaces (personal + team), switch between them using the workspace switcher. After switching, the thread list and sidekiq list should immediately update to show only the new workspace's content. No page reload needed.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
