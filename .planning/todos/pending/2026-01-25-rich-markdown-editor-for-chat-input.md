---
created: 2026-01-25T16:55
title: Rich markdown editor for chat input
area: ui
files: []
---

## Problem

Currently, the chat input is a simple text area. Users who want to compose formatted messages (headings, bold, italics, code blocks, lists, etc.) must manually type markdown syntax. This creates friction for users unfamiliar with markdown and limits the "document-like" composition experience that power users expect.

Key pain points:
- Users can't easily format messages without knowing markdown syntax
- No visual feedback on formatting until message is sent
- No easy way to insert images or other media
- Composing long, structured prompts feels tedious compared to a word processor

## Solution

Add a toggleable rich markdown editor as an alternative to the simple text area:

**Core features:**
1. Toggle switch: Simple textarea ↔ Rich editor (user preference persisted)
2. Formatting toolbar with buttons: H1/H2/H3, Bold, Italic, Code, Code Block, Quote, Bullet List, Numbered List
3. Image button to insert/upload images
4. Raw markdown toggle to view/edit underlying markdown
5. WYSIWYG-style editing that feels like "working in a word file"

**Technical considerations:**
- Consider libraries like Tiptap, Lexical, or Milkdown for the rich editor
- Ensure markdown output is clean and compatible with AI model consumption
- Mobile-friendly toolbar (collapsible or scrollable)
- Keyboard shortcuts for common formatting (Cmd+B for bold, etc.)
- Preserve user's editor preference in localStorage or user preferences

**UX requirements:**
- Smooth toggle animation between simple and rich modes
- Toolbar should not feel overwhelming - keep it minimal
- Raw markdown view should be syntax-highlighted
- No content loss when toggling between modes
