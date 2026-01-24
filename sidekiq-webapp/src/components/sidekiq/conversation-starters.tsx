"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

import { Button } from "@sidekiq/components/ui/button";
import { Input } from "@sidekiq/components/ui/input";
import { cn } from "@sidekiq/lib/utils";

interface StarterItem {
  id: string;
  text: string;
}

interface ConversationStartersProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
  maxLength?: number;
}

/**
 * Drag-and-drop reorderable conversation starters.
 * Uses @dnd-kit for accessible drag-and-drop with keyboard support.
 *
 * @param value - Array of starter strings
 * @param onChange - Callback when starters change
 * @param maxItems - Maximum number of starters (default 6)
 * @param maxLength - Maximum length per starter (default 200)
 */
export function ConversationStarters({
  value,
  onChange,
  maxItems = 6,
  maxLength = 200,
}: ConversationStartersProps) {
  // Convert strings to items with IDs for dnd-kit
  const [items, setItems] = useState<StarterItem[]>(() =>
    value.map((text) => ({ id: nanoid(), text })),
  );

  // Sync internal state when external value changes (e.g., form reset)
  useEffect(() => {
    // Only sync if the text arrays differ (to avoid infinite loops)
    const currentTexts = items.map((item) => item.text);
    if (JSON.stringify(currentTexts) !== JSON.stringify(value)) {
      setItems(value.map((text) => ({ id: nanoid(), text })));
    }
  }, [value, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onChange(newItems.map((item) => item.text));
    }
  };

  const handleAdd = () => {
    if (items.length >= maxItems) return;
    const newItems = [...items, { id: nanoid(), text: "" }];
    setItems(newItems);
    onChange(newItems.map((item) => item.text));
  };

  const handleRemove = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    onChange(newItems.map((item) => item.text));
  };

  const handleUpdate = (id: string, text: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, text } : item,
    );
    setItems(newItems);
    onChange(newItems.map((item) => item.text));
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableStarterItem
                key={item.id}
                item={item}
                maxLength={maxLength}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="mr-2 size-4" />
          Add starter ({items.length}/{maxItems})
        </Button>
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground py-2 text-center text-sm">
          Add conversation starters to help users begin chatting
        </p>
      )}
    </div>
  );
}

interface SortableStarterItemProps {
  item: StarterItem;
  maxLength: number;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

function SortableStarterItem({
  item,
  maxLength,
  onUpdate,
  onRemove,
}: SortableStarterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background flex items-center gap-2 rounded-md border p-2",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground focus:ring-ring cursor-grab touch-none rounded p-1 focus:ring-2 focus:outline-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Input */}
      <Input
        value={item.text}
        onChange={(e) => onUpdate(item.id, e.target.value)}
        placeholder="e.g., Help me write a blog post about..."
        maxLength={maxLength}
        className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
      />

      {/* Character count */}
      <span
        className={cn(
          "shrink-0 text-xs tabular-nums",
          item.text.length >= maxLength
            ? "text-destructive"
            : item.text.length >= maxLength * 0.8
              ? "text-amber-500"
              : "text-muted-foreground",
        )}
      >
        {item.text.length}/{maxLength}
      </span>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(item.id)}
        className="text-muted-foreground hover:text-destructive shrink-0"
        aria-label="Remove starter"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
