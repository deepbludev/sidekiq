---
created: 2026-01-24T15:42
title: Sidekiq creation agent feature
area: ui
files: []
---

## Problem

Currently, creating a Sidekiq (custom assistant) requires manually filling out a form with name, description, and instructions. This is a less engaging user experience compared to competitors like OpenAI's GPT Builder, which allows users to create GPTs through a conversational interface.

Users should be able to create a Sidekiq by chatting with an AI agent that guides them through the process — asking about use cases, desired behavior, tone, and capabilities — then automatically generating the Sidekiq configuration from the conversation.

## Solution

TBD - Implement a conversational Sidekiq creation flow similar to OpenAI's GPT Builder:
- Dedicated chat interface for Sidekiq creation
- AI agent that asks clarifying questions about the assistant's purpose
- Auto-generate name, description, and system instructions from conversation
- Preview and refinement loop before saving
- Consider using a specialized prompt/agent for the creation flow
