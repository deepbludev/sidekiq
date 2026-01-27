---
phase: quick-019
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/lib/constants/emoji-data.ts
  - sidekiq-webapp/src/components/sidekiq/emoji-picker-popover.tsx
autonomous: true

must_haves:
  truths:
    - "User sees 150+ emojis organized across 8-10 categories"
    - "User can search emojis by name (e.g., typing 'dog' finds the dog emoji)"
    - "User can browse categories via visual section headers in the grid"
    - "User can scroll through the emoji grid without the popover growing too tall"
    - "Existing emoji selections on Sidekiqs remain valid (all 32 current emojis still present)"
  artifacts:
    - path: "sidekiq-webapp/src/lib/constants/emoji-data.ts"
      provides: "Emoji data with names and categories for search"
    - path: "sidekiq-webapp/src/components/sidekiq/emoji-picker-popover.tsx"
      provides: "Updated emoji picker with categories, scrollable grid, and name-based search"
  key_links:
    - from: "sidekiq-webapp/src/components/sidekiq/emoji-picker-popover.tsx"
      to: "sidekiq-webapp/src/lib/constants/emoji-data.ts"
      via: "import of emoji data constants"
      pattern: "import.*emoji-data"
---

<objective>
Extend the Sidekiq avatar emoji picker from 32 emojis to 150+ emojis with meaningful search and category navigation.

Purpose: Users need more emoji variety to personalize their Sidekiq avatars. The current picker has only 32 options and a search feature that cannot actually find emojis by name.

Output: A comprehensive emoji picker with named emojis, functional keyword search, category section headers, and a scrollable layout.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/components/sidekiq/emoji-picker-popover.tsx
@sidekiq-webapp/src/components/sidekiq/avatar-picker.tsx
@sidekiq-webapp/src/components/sidekiq/sidekiq-avatar.tsx
@sidekiq-webapp/src/lib/utils/avatar.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create emoji data module with named entries and categories</name>
  <files>sidekiq-webapp/src/lib/constants/emoji-data.ts</files>
  <action>
Create a new file `sidekiq-webapp/src/lib/constants/emoji-data.ts` that exports emoji data with searchable names.

Structure:
```typescript
export interface EmojiEntry {
  emoji: string;
  name: string;         // Lowercase, searchable (e.g., "robot", "fire", "light bulb")
  keywords: string[];   // Additional search terms (e.g., ["bot", "android"] for robot)
}

export interface EmojiCategory {
  id: string;
  label: string;
  emojis: EmojiEntry[];
}
```

Create `EMOJI_CATEGORIES` as an array of `EmojiCategory` with these categories (aim for 15-20 emojis per category):

1. **Smileys & People** (id: "smileys") - Faces and hand gestures useful for assistant personas:
   Include all 8 existing faces emojis PLUS: 🙂, 🤗, 🧐, 😇, 🥳, 😏, 🤓, 🤩, 😴, 🤯, 🥸, 🫡, 👋, 🤝, 👍, 💪

2. **Animals & Nature** (id: "animals") - Animals and plants for themed assistants:
   🐶, 🐱, 🐭, 🐹, 🐰, 🦊 (existing), 🐻, 🐼, 🐨, 🐯, 🦁, 🐸, 🐵, 🐙, 🦋, 🐝, 🦄, 🐲, 🦅, 🦉

3. **Food & Drink** (id: "food") - Culinary themed:
   🍎, 🍕, 🍔, 🌮, 🍣, 🍰, 🧁, 🍩, 🍪, 🥐, 🌶️, 🍫, 🍿, 🥑, ☕, 🍵, 🧃, 🍷

4. **Activities & Sports** (id: "activities") - Action-oriented:
   ⚽, 🏀, 🎾, 🏈, 🎳, 🎮, 🎲 (existing), 🎯 (existing), 🎸, 🎹, 🎤, 🎬, 🎨 (existing), 🎵 (existing), 🏆 (existing), 🥇, 🎪 (existing), 🎁 (existing)

5. **Travel & Places** (id: "travel") - Location and transport themed:
   🚀 (existing), 🌍, 🗺️, 🏠, 🏢, 🏫, 🏥, ✈️, 🚗, 🚢, 🏔️, 🏖️, 🌋, 🗼, 🎡, 🏕️

6. **Objects & Tools** (id: "objects") - Work and utility themed:
   💡 (existing), 📚 (existing), ✏️ (existing), 🔧 (existing), 💻 (existing), 📱, 🖥️, ⌨️, 🔬, 🔭, 🧪, 🩺, 📷, 🎧, 📝, 🗂️, 📌, 🔑, 🧲, 💼

7. **Symbols & Hearts** (id: "symbols") - Abstract and symbolic:
   ❤️ (existing), ⭐ (existing), 💎 (existing), 🌟 (existing), 🔥 (existing), ⚡ (existing), 🌈 (existing), 🌊 (existing), 🌸 (existing), 🍀 (existing), 🌙 (existing), ✨, 💫, 🔮, 🧿, ☯️, ♾️, 🎗️, 💝, 🫧

8. **Flags & Signs** (id: "flags") - Symbolic markers:
   🏳️, 🏴, 🚩, 🏁, ♻️, ⚠️, ✅, ❌, ❓, 💯, 🆕, 🔴, 🟢, 🔵, 🟡, 🟣

Also export a flat helper:
```typescript
export const ALL_EMOJI_ENTRIES: EmojiEntry[] = EMOJI_CATEGORIES.flatMap(c => c.emojis);
```

And a search function:
```typescript
/**
 * Search emojis by name and keywords.
 * Returns matching entries, case-insensitive.
 */
export function searchEmojis(query: string): EmojiEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ALL_EMOJI_ENTRIES.filter(
    (e) => e.name.includes(q) || e.keywords.some((k) => k.includes(q))
  );
}
```

Each emoji MUST have a descriptive `name` and at least 1-2 `keywords`. For example:
- { emoji: "🤖", name: "robot", keywords: ["bot", "android", "machine"] }
- { emoji: "🔥", name: "fire", keywords: ["flame", "hot", "lit"] }
- { emoji: "💡", name: "light bulb", keywords: ["idea", "bright", "tip"] }

IMPORTANT: Every emoji from the current `EMOJI_CATEGORIES` in `emoji-picker-popover.tsx` must appear in the new data (backward compatibility). Specifically preserve all 32: 😀, 😊, 🤔, 😎, 🤖, 👻, 🎭, 🦊, 💡, 🎯, 📚, ✏️, 🔧, 🎨, 🎵, 💻, 🌟, 🔥, ⚡, 🌈, 🌊, 🌸, 🍀, 🌙, ❤️, ⭐, 💎, 🏆, 🎪, 🎲, 🎁, 🚀.
  </action>
  <verify>
    - File exists at `sidekiq-webapp/src/lib/constants/emoji-data.ts`
    - TypeScript compiles: `cd sidekiq-webapp && npx tsc --noEmit src/lib/constants/emoji-data.ts` (or full project check)
    - All 32 original emojis are present (grep for each)
    - Total emoji count is 150+ (count ALL_EMOJI_ENTRIES length)
    - `searchEmojis("robot")` returns at least the robot emoji entry
  </verify>
  <done>Emoji data module exports 150+ named emojis across 8 categories with functional search, all 32 original emojis preserved.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite emoji-picker-popover to use new data with categories and search</name>
  <files>sidekiq-webapp/src/components/sidekiq/emoji-picker-popover.tsx</files>
  <action>
Rewrite `sidekiq-webapp/src/components/sidekiq/emoji-picker-popover.tsx` to use the new emoji data module.

Key changes:

1. **Remove inline EMOJI_CATEGORIES and ALL_EMOJIS constants.** Import from `@sidekiq/lib/constants/emoji-data` instead.

2. **Search by name/keywords:** Replace the current `.filter((emoji) => emoji.toLowerCase().includes(search.toLowerCase()))` with a call to `searchEmojis(search)`. When search is active, show a flat grid of results (no category headers). When search is empty, show the categorized view.

3. **Category headers in the grid:** When NOT searching, render each category with:
   - A small `text-xs font-medium text-muted-foreground` label (the category `label`)
   - Followed by its emoji grid (keep the 8-column grid layout)
   - Small `gap-2` between categories

4. **Scrollable container:** Wrap the emoji area in a `div` with `max-h-[280px] overflow-y-auto` so the popover doesn't grow excessively. Keep the search input OUTSIDE the scroll area (pinned at top).

5. **Widen the popover slightly:** Change `w-72` to `w-80` to give more breathing room for 8 columns plus category headers.

6. **Remove the bottom "Categories:" text** (lines 106-110 in current file). Categories are now visible as section headers.

7. **Preserve the component API exactly.** The `EmojiPickerPopoverProps` interface, the component name, and the behavior (open/close popover, select emoji, trigger children) must remain identical. Only the internal rendering changes.

8. **Emit the emoji string (not the EmojiEntry object)** when user clicks -- `handleSelect(entry.emoji)` so the parent receives a plain string as before.

Layout structure:
```tsx
<PopoverContent className="w-80 p-3" align="start">
  <div className="space-y-3">
    {/* Search - pinned */}
    <Input ... />

    {/* Scrollable emoji area */}
    <div className="max-h-[280px] overflow-y-auto">
      {search ? (
        {/* Flat search results grid */}
        <div className="grid grid-cols-8 gap-1">
          {searchResults.map(entry => <button>...</button>)}
        </div>
      ) : (
        {/* Categorized grid */}
        <div className="space-y-3">
          {EMOJI_CATEGORIES.map(category => (
            <div key={category.id}>
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                {category.label}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {category.emojis.map(entry => <button>...</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* "No emojis found" for empty search results */}
  </div>
</PopoverContent>
```

Keep the same button styling with `cn()` for selected state. Use `entry.emoji` as the key for each button (same as current). Add `title={entry.name}` attribute on each emoji button for hover tooltips showing the emoji name.

Do NOT install any external emoji library. This is a curated, hand-picked set appropriate for avatar selection.
  </action>
  <verify>
    - `cd sidekiq-webapp && npx tsc --noEmit` passes (full project type check)
    - `cd sidekiq-webapp && npm run build` succeeds (or `pnpm build` -- check package.json scripts)
    - Manually verify: Open the Sidekiq creation flow, click emoji picker:
      - Emojis display in categorized sections with headers
      - Scrolling works within the emoji grid
      - Typing "robot" in search shows the robot emoji
      - Typing "fire" shows the fire emoji
      - Clearing search returns to categorized view
      - Selecting an emoji still works (popover closes, emoji appears on avatar)
      - Previously selected emojis from existing Sidekiqs still display correctly
  </verify>
  <done>
    Emoji picker popover shows 150+ emojis across 8 labeled categories with a scrollable grid, functional name-based search, and hover tooltips. Component API is unchanged. All existing emoji selections remain valid.
  </done>
</task>

</tasks>

<verification>
1. `cd sidekiq-webapp && npx tsc --noEmit` -- full TypeScript check passes
2. `cd sidekiq-webapp && pnpm build` (or `npm run build`) -- production build succeeds
3. Open Sidekiq creation page in browser:
   - Avatar picker -> Emoji type -> emoji picker popover opens
   - See 8 category sections with headers
   - Grid is scrollable, popover stays manageable height
   - Search "dog" -> shows dog emoji
   - Search "code" or "computer" -> shows relevant emojis
   - Clear search -> categories return
   - Select any emoji -> popover closes, emoji shown in avatar preview
4. Open an existing Sidekiq with emoji avatar -> emoji still displays correctly
</verification>

<success_criteria>
- 150+ emojis available (up from 32)
- 8 categories with visible section headers
- Search works by emoji name and keywords (not just character matching)
- Scrollable emoji area prevents popover overflow
- All 32 original emojis preserved (backward compatible)
- Component API unchanged (no changes needed in avatar-picker.tsx or other consumers)
- TypeScript compiles, build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/019-extend-available-emoji-options-for-sidek/019-SUMMARY.md`
</output>
