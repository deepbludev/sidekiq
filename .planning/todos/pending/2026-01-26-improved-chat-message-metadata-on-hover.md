---
created: 2026-01-26T20:29
title: Improved chat message metadata on hover
area: ui
files: []
---

## Problem

Currently chat messages only show a timestamp on hover. Modern AI chat apps like t3.chat display rich metadata below each assistant message, including:

- **Model name & ID** (e.g. "Kimi K2 (0905)")
- **Throughput** (e.g. "141.15 tok/sec")
- **Token count** (e.g. "59 tokens")
- **Time-to-first-token** (e.g. "Time-to-First: 0.22 sec")
- **Action icons**: copy message, cursor/select, regenerate

This metadata gives users transparency into model performance and quick actions without navigating away. Adding similar metadata would significantly improve the chat UX and match the premium feel of the product.

## Solution

TBD — Likely involves:
- Capturing streaming metrics from Vercel AI SDK (tokens/sec, TTFT, total tokens)
- Storing per-message metadata (model used, token counts, timing)
- Rendering a hover or always-visible metadata bar below assistant messages with icons + stats
- Reference t3.chat's design for layout inspiration (see attached screenshot)
