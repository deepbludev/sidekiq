---
created: 2026-01-24T09:32
title: Allow importing/exporting Sidekiq config from/to JSON file
area: ui
files: []
---

## Problem

Users should be able to share and backup their Sidekiq (custom assistant) configurations. Currently there's no way to export a Sidekiq's configuration to a portable format or import one from an external source.

This feature would enable:
- Sharing Sidekiq configurations with team members or publicly
- Backing up custom assistant setups
- Migrating Sidekiqs between accounts or instances
- Creating Sidekiq "templates" that can be distributed

## Solution

TBD - Consider:
- JSON schema for Sidekiq configuration export (name, description, instructions, model preferences, etc.)
- Export button in Sidekiq settings that downloads a `.json` file
- Import button/dropzone that validates and creates a new Sidekiq from JSON
- Handle conflicts (duplicate names, missing models)
- Potentially support importing from URL for easy sharing
