# Phase 2: Basic Chat Interface - Research

**Researched:** 2026-01-22
**Domain:** React Chat UI, Glassmorphism CSS, Theme System, Markdown Rendering, Toast Notifications
**Confidence:** HIGH

## Summary

Phase 2 builds upon the Phase 1 streaming infrastructure to create a polished chat interface with glassmorphism aesthetics, dark/light/system theme toggle, markdown rendering with syntax highlighting, and optimistic UI with proper error handling. The research confirms that Streamdown (Vercel's streaming markdown library) is the optimal choice for rendering AI responses, as it's purpose-built for handling incomplete markdown during streaming. next-themes provides the theme system with flash prevention built-in. Sonner is already installed and configured for toast notifications.

The existing Phase 1 implementation already has basic message display with `useChat`, so Phase 2 focuses on: (1) replacing basic text display with full markdown rendering, (2) adding message actions (copy, edit, regenerate), (3) implementing glassmorphism styling with Tailwind CSS, (4) adding theme toggle with next-themes, and (5) creating an empty state with categorized prompts.

**Primary recommendation:** Use Streamdown with `@streamdown/code` for markdown/code rendering, Radix UI `ToggleGroup` for the theme segmented control, and extend existing Tailwind theme variables with glassmorphism classes. Leverage Sonner's existing `toast.error()` for error rollback notifications.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `streamdown` | ^1.x | Streaming markdown rendering | Built by Vercel specifically for AI streaming, handles incomplete markdown |
| `@streamdown/code` | ^1.x | Syntax highlighting plugin for Streamdown | Uses Shiki, dual theme support, lazy loading |
| `next-themes` | ^0.4.6 | Theme system (dark/light/system) | Already installed, no-flash, SSR-safe |
| `sonner` | ^2.0.7 | Toast notifications | Already installed and configured |
| `@radix-ui/react-toggle-group` | ^1.x | Segmented control for theme toggle | Accessible, works with existing Radix setup |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.562.0 | Icons for actions (copy, edit, etc.) | Already installed |
| `clsx` / `tailwind-merge` | installed | Class composition | Already in use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Streamdown | react-markdown + rehype-highlight | More control but requires manual incomplete markdown handling |
| Shiki (via @streamdown/code) | Prism / highlight.js | Shiki is more accurate (TextMate grammar), better theme support |
| ToggleGroup | Tabs or custom buttons | ToggleGroup is semantically correct for single-select options |

**Installation:**
```bash
pnpm add streamdown @streamdown/code @radix-ui/react-toggle-group
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx    # Update: integrate markdown renderer
│   │   ├── message-item.tsx      # Update: use Streamdown, add actions
│   │   ├── message-actions.tsx   # NEW: copy, edit, regenerate buttons
│   │   ├── message-list.tsx      # Keep existing
│   │   ├── chat-input.tsx        # Keep existing
│   │   ├── empty-state.tsx       # NEW: categorized prompts
│   │   └── ...
│   ├── ui/
│   │   ├── toggle-group.tsx      # NEW: from shadcn/ui
│   │   └── ...
│   └── theme/
│       ├── theme-provider.tsx    # NEW: wrapper for next-themes
│       └── theme-toggle.tsx      # NEW: segmented control component
├── styles/
│   └── globals.css               # Update: glassmorphism variables
└── app/
    └── layout.tsx                # Update: wrap with ThemeProvider
```

### Pattern 1: Streaming Markdown with Streamdown
**What:** Drop-in replacement for react-markdown designed for AI streaming
**When to use:** Rendering all AI assistant messages
**Example:**
```typescript
// Source: https://context7.com/vercel/streamdown
import { Streamdown } from 'streamdown';
import { code, createCodePlugin } from '@streamdown/code';

// Configure dual themes for light/dark mode
const codePlugin = createCodePlugin({
  themes: ['github-light', 'github-dark'],
});

export function MessageContent({
  content,
  isStreaming
}: {
  content: string;
  isStreaming: boolean;
}) {
  return (
    <Streamdown
      plugins={{ code: codePlugin }}
      isAnimating={isStreaming}
      className="prose dark:prose-invert prose-sm max-w-none"
    >
      {content}
    </Streamdown>
  );
}
```

### Pattern 2: Theme Toggle with Segmented Control
**What:** Three-way toggle for Light/Dark/System using ToggleGroup
**When to use:** Header/navbar theme selection
**Example:**
```typescript
// Source: https://context7.com/pacocoursey/next-themes + Radix ToggleGroup
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <ToggleGroup type="single" value={theme} onValueChange={setTheme}>
      <ToggleGroupItem value="light" aria-label="Light mode">
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark mode">
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System preference">
        <Monitor className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

### Pattern 3: Glassmorphism with Tailwind CSS
**What:** Translucent panels with backdrop blur and subtle borders
**When to use:** Chat container, input area, modals, cards
**Example:**
```css
/* globals.css - Glass effect utilities */
@layer components {
  .glass {
    @apply bg-white/60 dark:bg-zinc-900/60
           backdrop-blur-xl
           border border-white/20 dark:border-white/10
           shadow-lg shadow-black/5;
  }

  .glass-subtle {
    @apply bg-white/40 dark:bg-zinc-900/40
           backdrop-blur-md
           border border-white/10 dark:border-white/5;
  }

  .glass-input {
    @apply bg-white/80 dark:bg-zinc-800/80
           backdrop-blur-sm
           border border-zinc-200/50 dark:border-zinc-700/50;
  }
}
```

### Pattern 4: Optimistic UI with Error Rollback
**What:** Show user message immediately, roll back on error with toast
**When to use:** Message sending
**Example:**
```typescript
// Source: AI SDK useChat hook + Sonner toast
'use client';

import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';

const { messages, sendMessage, status, error } = useChat({
  api: '/api/chat',
  body: { threadId },
  onError: (err) => {
    // Error toast at bottom-center (near input)
    toast.error('Failed to send message', {
      description: err.message || 'Please try again',
      duration: 5000,
      position: 'bottom-center',
    });
  },
});

// useChat already provides optimistic UI:
// - User message appears immediately when sendMessage() is called
// - On error, the message remains but error callback fires
// - For true rollback, track pending messages separately
```

### Pattern 5: Message Actions Component
**What:** Hover-visible actions for copy, edit, regenerate
**When to use:** Each message item
**Example:**
```typescript
'use client';

import { Copy, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MessageActionsProps {
  role: 'user' | 'assistant';
  content: string;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

export function MessageActions({
  role,
  content,
  onEdit,
  onRegenerate
}: MessageActionsProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {role === 'user' && onEdit && (
        <Button variant="ghost" size="icon-sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {role === 'assistant' && onRegenerate && (
        <Button variant="ghost" size="icon-sm" onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Using react-markdown for streaming content:** It doesn't handle incomplete markdown gracefully. Use Streamdown instead.
- **Forgetting mounted check for theme toggle:** Will cause hydration mismatch. Always check `mounted` before rendering theme-dependent UI.
- **Heavy blur on low-power devices:** Backdrop blur is expensive. Consider reducing or disabling on mobile/low-spec devices.
- **Showing timestamps always:** Per CONTEXT.md, show on hover only to reduce visual noise.
- **Using bubbles/cards for messages:** Per CONTEXT.md, use minimal lines style with subtle background tints.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming markdown | Custom parser + react-markdown | Streamdown | Handles incomplete blocks, code fences, lists gracefully |
| Syntax highlighting | regex-based highlighter | Shiki via @streamdown/code | TextMate grammar accuracy, 200+ languages, dual themes |
| Theme system | Custom localStorage + CSS | next-themes | Handles SSR, flash prevention, system detection |
| Copy to clipboard | Custom Clipboard API wrapper | navigator.clipboard + toast | Built-in, just add success feedback |
| Segmented control | Custom radio group | Radix ToggleGroup | Accessible, keyboard nav, styling flexibility |
| Error toasts | Custom toast component | Sonner | Already installed, position control, auto-dismiss |

**Key insight:** The glassmorphism aesthetic and theme system are primarily CSS/styling concerns. The complexity lies in getting streaming markdown right (Streamdown) and preventing hydration issues (next-themes mounted check).

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with Theme Toggle
**What goes wrong:** React hydration error on page load
**Why it happens:** Server renders one theme, client detects different system theme
**How to avoid:** Use `mounted` state pattern - render null or skeleton until `useEffect` runs
**Warning signs:** Console warning about hydration mismatch, flashing UI

### Pitfall 2: Markdown Renders Partially During Streaming
**What goes wrong:** Broken markdown syntax shows (e.g., unclosed code fences)
**Why it happens:** react-markdown expects complete markdown
**How to avoid:** Use Streamdown which is designed for incomplete markdown
**Warning signs:** Visible markdown syntax during streaming, jumpy rendering

### Pitfall 3: Blur Performance on Mobile/Low-Spec Devices
**What goes wrong:** Laggy scrolling, janky animations
**Why it happens:** `backdrop-filter: blur()` is GPU-intensive
**How to avoid:** Consider `@media (prefers-reduced-motion)` to reduce effects, or use solid backgrounds on mobile
**Warning signs:** Low FPS during scroll, battery drain complaints

### Pitfall 4: Theme Transition Flash
**What goes wrong:** Brief flash of wrong theme on page load
**Why it happens:** CSS loads before JS hydration
**How to avoid:** next-themes injects script in `<head>` automatically. Ensure `suppressHydrationWarning` on `<html>` tag.
**Warning signs:** White flash in dark mode, dark flash in light mode

### Pitfall 5: Code Theme Doesn't Match App Theme
**What goes wrong:** Dark code block in light mode or vice versa
**Why it happens:** Single theme specified for Shiki
**How to avoid:** Use dual themes in @streamdown/code: `themes: ['github-light', 'github-dark']`
**Warning signs:** High contrast mismatch between code and surrounding UI

### Pitfall 6: Edit/Regenerate Doesn't Sync with Backend
**What goes wrong:** UI updates but database doesn't reflect edit
**Why it happens:** Editing is frontend-only by default in useChat
**How to avoid:** On edit/regenerate, call API to update/delete messages, then re-send
**Warning signs:** Refreshing page shows old messages

## Code Examples

Verified patterns from official sources:

### ThemeProvider Setup in App Router
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
// src/components/theme/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// src/app/layout.tsx
import { ThemeProvider } from '@/components/theme/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Empty State with Categorized Prompts
```typescript
// Based on CONTEXT.md decision: categorized prompts like Claude's interface
'use client';

const PROMPT_CATEGORIES = [
  {
    name: 'Creative',
    icon: Sparkles,
    prompts: [
      'Write a short story about...',
      'Help me brainstorm ideas for...',
      'Create a poem about...',
    ],
  },
  {
    name: 'Coding',
    icon: Code,
    prompts: [
      'Explain how to implement...',
      'Debug this code...',
      'Write a function that...',
    ],
  },
  {
    name: 'Research',
    icon: Search,
    prompts: [
      'Summarize the key points of...',
      'Compare and contrast...',
      'What are the pros and cons of...',
    ],
  },
];

export function EmptyState({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h2 className="text-2xl font-semibold mb-2">Start your first conversation</h2>
      <p className="text-muted-foreground mb-8">Choose a prompt or type your own</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        {PROMPT_CATEGORIES.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <category.icon className="h-4 w-4" />
              {category.name}
            </div>
            {category.prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onPromptSelect(prompt)}
                className="w-full text-left p-3 rounded-lg glass-subtle hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Message Item with Minimal Lines Style
```typescript
// Based on CONTEXT.md: minimal lines, no bubbles, subtle tint
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

interface MessageItemProps {
  message: UIMessage;
  isStreaming: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

export function MessageItem({ message, isStreaming, onEdit, onRegenerate }: MessageItemProps) {
  const isUser = message.role === 'user';
  const content = extractTextContent(message);
  const [showTimestamp, setShowTimestamp] = useState(false);

  return (
    <div
      className={cn(
        'group py-4 px-4 -mx-4',
        isUser ? 'bg-transparent' : 'bg-muted/30 dark:bg-muted/10'
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            ) : (
              <Streamdown
                plugins={{ code }}
                isAnimating={isStreaming}
                className="prose dark:prose-invert prose-sm max-w-none"
              >
                {content}
              </Streamdown>
            )}
          </div>
          <MessageActions
            role={message.role}
            content={content}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
          />
        </div>

        {/* Timestamp on hover */}
        {showTimestamp && message.createdAt && (
          <time className="text-xs text-muted-foreground mt-1 block">
            {formatTime(message.createdAt)}
          </time>
        )}
      </div>
    </div>
  );
}
```

### Toast for Error Rollback
```typescript
// Source: https://context7.com/emilkowalski/sonner
import { toast } from 'sonner';

// In useChat onError callback
onError: (error) => {
  toast.error('Failed to send message', {
    description: error.message || 'Please check your connection and try again',
    duration: 5000,
    position: 'bottom-center', // Near input where action occurred
    action: {
      label: 'Retry',
      onClick: () => handleRetry(),
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-markdown for AI chat | Streamdown | 2025 | Built for streaming, handles incomplete markdown |
| Custom theme toggle | next-themes | Stable since 2023 | No-flash, SSR-safe, system detection |
| highlight.js | Shiki | 2024+ | TextMate accuracy, dual themes, better performance |
| CSS modules for glass | Tailwind backdrop utilities | Tailwind v3+ | `backdrop-blur-*` built-in, composable |

**Deprecated/outdated:**
- Custom flash prevention scripts: next-themes handles this automatically
- Single-theme code highlighting: Shiki/Streamdown support dual themes for light/dark
- CSS houdini for backdrop blur: Native CSS `backdrop-filter` has broad support now

## Open Questions

Things that couldn't be fully resolved:

1. **Streamdown Version Compatibility**
   - What we know: Streamdown is a Vercel package for AI streaming
   - What's unclear: Exact latest version and potential breaking changes
   - Recommendation: Install latest, verify API matches documentation

2. **Performance Impact of Glassmorphism on Older Devices**
   - What we know: backdrop-filter is GPU-intensive
   - What's unclear: Specific iOS/Android versions with issues
   - Recommendation: Test on target devices, have CSS fallback ready

3. **Edit Message API Design**
   - What we know: CONTEXT.md says editing triggers regeneration
   - What's unclear: Exact API flow for edit (delete + re-send vs. update)
   - Recommendation: Implement as delete affected messages + new request

## Sources

### Primary (HIGH confidence)
- Context7: /vercel/streamdown - Streaming markdown setup, code plugin, styling
- Context7: /pacocoursey/next-themes - Theme provider, useTheme hook, mounted pattern
- Context7: /emilkowalski/sonner - Toast API, positioning, duration, dismiss
- Context7: /shikijs/shiki - Dual themes, React integration

### Secondary (MEDIUM confidence)
- shadcn/ui dark mode docs: ThemeProvider wrapper pattern
- Radix UI ToggleGroup: Segmented control implementation

### Tertiary (LOW confidence)
- Glassmorphism CSS patterns: Training data (verify Tailwind v4 support)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Vercel/Radix packages, already installed dependencies
- Architecture: HIGH - Patterns from official docs, builds on Phase 1
- Glassmorphism: MEDIUM - CSS patterns are stable, specific Tailwind v4 syntax may vary
- Pitfalls: HIGH - Well-documented hydration and streaming issues

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - libraries are stable)
