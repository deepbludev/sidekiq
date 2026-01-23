---
status: diagnosed
trigger: "Model picker button doesn't open dropdown when clicked - nothing happens"
created: 2026-01-23T00:00:00Z
updated: 2026-01-23T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - ModelPickerTrigger does not forward necessary props from PopoverTrigger
test: Verified component composition chain
expecting: N/A - root cause found
next_action: Report findings

## Symptoms

expected: Clicking the model picker button should open a Popover dropdown showing available models grouped by provider
actual: Nothing happens when clicking the button
errors: None reported
reproduction: Click on model picker button in chat interface
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-01-23T00:01:00Z
  checked: model-picker.tsx lines 72-81
  found: PopoverTrigger uses `asChild` prop and wraps ModelPickerTrigger
  implication: Radix expects to pass onClick/aria props to child via ref forwarding

- timestamp: 2026-01-23T00:02:00Z
  checked: model-picker-trigger.tsx lines 21-50
  found: ModelPickerTrigger uses forwardRef but does NOT spread additional props to Button
  implication: Props like onClick, aria-expanded from PopoverTrigger are lost

- timestamp: 2026-01-23T00:03:00Z
  checked: model-picker-trigger.tsx line 24
  found: Component signature is `({ selectedModel, disabled, className }, ref)` - destructures only known props
  implication: All other props (onClick, onPointerDown, aria-* from PopoverTrigger) are discarded

- timestamp: 2026-01-23T00:04:00Z
  checked: Radix asChild pattern requirements
  found: When using `asChild`, child must accept and forward all props to the underlying DOM element
  implication: This is the root cause - ModelPickerTrigger must spread rest props to Button

## Resolution

root_cause: ModelPickerTrigger (model-picker-trigger.tsx line 24) does not spread rest props to the Button component. When PopoverTrigger uses `asChild`, it passes onClick, onPointerDown, aria-expanded and other critical props to its child. ModelPickerTrigger destructures only { selectedModel, disabled, className } and discards all other props, so the click handler from PopoverTrigger never reaches the DOM button element.

fix: Add ...props rest spread to ModelPickerTrigger interface and pass them to Button
verification:
files_changed: []
