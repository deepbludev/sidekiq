---
created: 2026-01-27
title: Include all available models in the Vercel AI Gateway
area: api
files: []
---

## Problem

The Vercel AI Gateway supports a wide range of models from multiple providers (OpenAI, Anthropic, Google, Meta, Mistral, etc.), but the app currently only exposes a subset of available models. Users should be able to select from the full catalog of models supported by the gateway, giving them maximum flexibility in choosing the right model for their use case.

## Solution

TBD — Audit the Vercel AI Gateway's supported model list and ensure all available models are included in the app's model selector. May involve updating model configuration, adding provider metadata (icons, labels), and ensuring the chat API correctly routes to each model.
