---
status: complete
phase: 08-team-foundation
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-04-SUMMARY.md, 08-06-SUMMARY.md, 08-07-SUMMARY.md
started: 2026-01-25T17:55:00Z
updated: 2026-01-25T18:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Create a Team
expected: Navigate to Settings > Teams. If no teams exist, see empty state with "Create Your First Team" CTA. Click it, enter name, create. Dialog closes and redirects to team settings.
result: issue
reported: "it works but the loading takes a while and i get these errors in next js - team.list query shows console error"
severity: major

### 2. View Team Members
expected: On team settings page, see member list showing yourself as owner with crown icon. Shows "1/50 members" count format.
result: skipped
reason: cant test because no teams available

### 3. Invite Member via Email
expected: Click "Invite" button in team settings. Dialog shows with email/link tabs. Enter an email address and click Send Invite. Toast confirms invite sent.
result: skipped
reason: blocked by team.list query failure - no teams available

### 4. View Pending Invites
expected: After sending invite, see Pending Invites section (visible to owner/admin). Shows invited email with expiry time and Revoke/Resend actions.
result: skipped
reason: blocked by team.list query failure - no teams available

### 5. Copy Invite Link
expected: In invite dialog, click "Copy Link" tab. Generate link and copy to clipboard. Toast confirms link copied.
result: skipped
reason: blocked by team.list query failure - no teams available

### 6. Team Appears in Sidebar
expected: Created team appears in sidebar Teams section between Sidekiqs and Search. Shows team avatar and name.
result: skipped
reason: blocked by team.list query failure - no teams available

### 7. Switch Active Team
expected: In sidebar header, team dropdown appears. Click it and see "Personal" option plus your teams. Select different option and dropdown updates to show selection.
result: skipped
reason: blocked by team.list query failure - no teams available

### 8. Active Team Persists
expected: Select a team, refresh the page. Selected team remains active (not reset to Personal).
result: skipped
reason: blocked by team.list query failure - no teams available

### 9. Create Team from Sidebar
expected: In sidebar Teams section, click "+" or "Create Team" button. Same create dialog opens as from settings.
result: skipped
reason: blocked by team.list query failure - no teams available

### 10. Edit Team Name
expected: On team settings page, click on team name to edit inline. Change name, save. Name updates immediately.
result: skipped
reason: blocked by team.list query failure - no teams available

### 11. Edit Team Avatar
expected: On team settings page, click avatar to edit. Avatar picker opens with color/emoji options. Select new avatar, it updates immediately.
result: skipped
reason: blocked by team.list query failure - no teams available

### 12. Role Icons Display
expected: In member list, owner shows crown icon (amber), admin shows shield icon (blue), regular member shows no icon.
result: skipped
reason: blocked by team.list query failure - no teams available

## Summary

total: 12
passed: 0
issues: 1
pending: 0
skipped: 11

## Gaps

- truth: "Team list loads without console errors and teams are retrievable"
  status: failed
  reason: "User reported: team.list query shows console error, loading takes a while, teams not available for testing - blocks all team features"
  severity: blocker
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
