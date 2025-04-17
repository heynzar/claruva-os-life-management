"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, Flag, RotateCcw } from "lucide-react";
import TagsSelect from "@/components/task-dialog/tags-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PrioritySelect from "./task-dialog/priority-select";

type Day = {
  id: string;
  label: string;
};

export interface HomePreferences {
  selectedDays: string[];
  showCompleted: boolean;
  showHabits: boolean;
  selectedTags: string[];
  selectedPriority: "high" | "medium" | "low" | null;
  duplicateWhenDragging?: boolean; // New preference for drag behavior
}

// Default preferences
export const defaultPreferences: HomePreferences = {
  selectedDays: ["yesterday", "today", "tomorrow", "week", "month"],
  showCompleted: true,
  showHabits: true,
  selectedTags: [],
  selectedPriority: null,
  duplicateWhenDragging: false, // Default to false (move instead of duplicate)
};

interface HomePreferencePopoverProps {
  children: React.ReactNode;
  preferences?: HomePreferences;
  onPreferencesChange: (preferences: HomePreferences) => void;
}

export default function HomePreferencePopover({
  children,
  preferences = defaultPreferences,
  onPreferencesChange,
}: HomePreferencePopoverProps) {
  const days: Day[] = [
    { id: "yesterday", label: "Yesterday" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
    { id: "life", label: "Life" },
  ];

  const priorities = [
    { id: "high", label: "High", color: "text-red-500" },
    { id: "medium", label: "Medium", color: "text-yellow-500" },
    { id: "low", label: "Low", color: "text-blue-400" },
  ];

  const [selectedDays, setSelectedDays] = useState<string[]>(
    preferences.selectedDays
  );
  const [showCompleted, setShowCompleted] = useState(preferences.showCompleted);
  const [showHabits, setShowHabits] = useState(preferences.showHabits);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    preferences.selectedTags
  );
  const [selectedPriority, setSelectedPriority] = useState<
    "high" | "medium" | "low" | null
  >(preferences.selectedPriority);
  const [duplicateWhenDragging, setDuplicateWhenDragging] = useState(
    preferences.duplicateWhenDragging || false
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);

  // Track changes to enable/disable save button
  useEffect(() => {
    const hasChanged =
      JSON.stringify(selectedDays) !==
        JSON.stringify(preferences.selectedDays) ||
      showCompleted !== preferences.showCompleted ||
      showHabits !== preferences.showHabits ||
      JSON.stringify(selectedTags) !==
        JSON.stringify(preferences.selectedTags) ||
      selectedPriority !== preferences.selectedPriority ||
      duplicateWhenDragging !== preferences.duplicateWhenDragging;

    setHasChanges(hasChanged);
  }, [
    selectedDays,
    showCompleted,
    showHabits,
    selectedTags,
    selectedPriority,
    duplicateWhenDragging,
    preferences,
  ]);

  // Check if any filters are applied
  useEffect(() => {
    setHasFilters(
      !showCompleted ||
        !showHabits ||
        selectedTags.length > 0 ||
        selectedPriority !== null
    );
  }, [showCompleted, showHabits, selectedTags, selectedPriority]);

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        if (prev.length < 5) {
          return [...prev, dayId];
        }
        return prev;
      }
    });
  };

  const savePreferences = () => {
    // Apply preferences
    onPreferencesChange({
      selectedDays,
      showCompleted,
      showHabits,
      selectedTags,
      selectedPriority,
      duplicateWhenDragging,
    });

    setHasChanges(false);
  };

  const resetAllFilters = () => {
    setShowCompleted(true);
    setShowHabits(true);
    setSelectedTags([]);
    setSelectedPriority(null);
    setHasChanges(true);
  };

  const isBoardCountInvalid = selectedDays.length !== 5;
  const isMaxSelected = selectedDays.length === 5;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-2"
        align="end"
        aria-label="Preferences Popover"
      >
        <div className="rounded-lg flex flex-col">
          <label
            htmlFor="board-selection"
            className="text-xs font-bold m-1 mt-0"
          >
            Boards View
          </label>
          <div
            id="board-selection"
            className="flex justify-between mb-2.5"
            role="group"
            aria-label="Select up to 5 Boards"
          >
            {days.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              const isDisabled = !isSelected && isMaxSelected;

              return (
                <Button
                  key={day.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="flex-1 border w-8 h-28 mx-0.5 rounded-sm"
                  onClick={() => toggleDay(day.id)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  aria-disabled={isDisabled}
                  aria-label={`Select board: ${day.id}`}
                >
                  <span className="rotate-90 uppercase">{day.id}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between">
            <div className="w-full flex items-center gap-1 text-sm text-muted-foreground">
              <Info className="size-3 mt-0.5" aria-hidden="true" />
              <span>Select exactly 5 boards to display</span>
            </div>
          </div>

          {isBoardCountInvalid && (
            <div className="text-xs text-red-500" role="alert">
              Please select exactly 5 boards.
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-completed">Show completed tasks</Label>
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
                aria-label="Toggle completed tasks"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-habits">Show habits (repeated tasks)</Label>
              <Switch
                id="show-habits"
                checked={showHabits}
                onCheckedChange={setShowHabits}
                aria-label="Toggle habits"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="duplicate-when-dragging">
                Duplicate when dragging
              </Label>
              <Switch
                id="duplicate-when-dragging"
                checked={duplicateWhenDragging}
                onCheckedChange={setDuplicateWhenDragging}
                aria-label="Toggle duplicate when dragging"
              />
            </div>
          </div>

          <Separator className="mt-4" />

          <label
            htmlFor="board-selection"
            className="text-xs font-bold m-1 my-2"
          >
            Filter
          </label>

          <div className="flex flex-col gap-2">
            <div>
              <Label id="tags-label" className="sr-only">
                Filter by Tags
              </Label>
              <TagsSelect
                type="preference"
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            </div>
            <div className="flex justify-between items-center">
              <Label id="priority-label" className="sr-only">
                Priority
              </Label>
              <RadioGroup
                value={selectedPriority || ""}
                onValueChange={(value) =>
                  setSelectedPriority(
                    value ? (value as "high" | "medium" | "low") : null
                  )
                }
                className="flex w-full gap-2"
              >
                {priorities.map((priority) => (
                  <div key={priority.id} className="flex flex-1 items-center">
                    <RadioGroupItem
                      value={priority.id}
                      id={`priority-${priority.id}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`priority-${priority.id}`}
                      className={
                        buttonVariants({
                          variant:
                            selectedPriority === priority.id
                              ? "secondary"
                              : "outline",
                          size: "sm",
                        }) + "w w-full border"
                      }
                    >
                      <Flag className={`size-4 ${priority.color}`} />
                      <span className="text-xs">{priority.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <Separator className="mt-4 mb-2" />

          <div className="flex justify-between gap-2">
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1"
                onClick={resetAllFilters}
              >
                <RotateCcw className="size-3" />
                Reset
              </Button>
            )}
            <Button
              disabled={isBoardCountInvalid || !hasChanges}
              variant="default"
              size="sm"
              className="h-8 px-6 ml-auto"
              onClick={savePreferences}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
