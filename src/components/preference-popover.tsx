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

type Day = {
  id: string;
  label: string;
};

// Base preferences interface that both home and goal preferences extend
export interface BasePreferences {
  showCompleted: boolean;
  showHabits: boolean;
  selectedTags: string[];
  selectedPriority: "high" | "medium" | "low" | null;
  duplicateWhenDragging: boolean;
}

// Home-specific preferences
export interface HomePreferences extends BasePreferences {
  selectedDays: string[];
}

// Goal-specific preferences
export interface GoalPreferences extends BasePreferences {
  // Any goal-specific preferences can be added here
}

// Default base preferences
export const defaultBasePreferences: BasePreferences = {
  showCompleted: true,
  showHabits: true,
  selectedTags: [],
  selectedPriority: null,
  duplicateWhenDragging: false,
};

// Default home preferences
export const defaultHomePreferences: HomePreferences = {
  ...defaultBasePreferences,
  selectedDays: ["yesterday", "today", "tomorrow", "week", "month"],
};

// Default goal preferences
export const defaultGoalPreferences: GoalPreferences = {
  ...defaultBasePreferences,
};

// Update the PreferencePopoverProps interface to use generic types
interface PreferencePopoverProps<T extends BasePreferences = BasePreferences> {
  children: React.ReactNode;
  preferences: T;
  onPreferencesChange: (preferences: T) => void;
  type: "home" | "goal";
  homePreferences?: HomePreferences;
  onHomePreferencesChange?: (preferences: HomePreferences) => void;
}

// Update the function signature to use the generic type
export default function PreferencePopover<
  T extends BasePreferences = BasePreferences
>({
  children,
  preferences,
  onPreferencesChange,
  type,
  homePreferences = defaultHomePreferences,
  onHomePreferencesChange,
}: PreferencePopoverProps<T>) {
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

  // Home-specific state
  const [selectedDays, setSelectedDays] = useState<string[]>(
    type === "home" ? homePreferences.selectedDays : []
  );

  // Common state for both types
  const [showCompleted, setShowCompleted] = useState(preferences.showCompleted);
  const [showHabits, setShowHabits] = useState(preferences.showHabits);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    preferences.selectedTags
  );
  const [selectedPriority, setSelectedPriority] = useState<
    "high" | "medium" | "low" | null
  >(preferences.selectedPriority);
  const [duplicateWhenDragging, setDuplicateWhenDragging] = useState(
    preferences.duplicateWhenDragging
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);

  // Track changes to enable/disable save button
  useEffect(() => {
    let hasChanged = false;

    // Check common preferences
    hasChanged =
      showCompleted !== preferences.showCompleted ||
      showHabits !== preferences.showHabits ||
      JSON.stringify(selectedTags) !==
        JSON.stringify(preferences.selectedTags) ||
      selectedPriority !== preferences.selectedPriority ||
      duplicateWhenDragging !== preferences.duplicateWhenDragging;

    // Check home-specific preferences
    if (type === "home" && onHomePreferencesChange) {
      hasChanged =
        hasChanged ||
        JSON.stringify(selectedDays) !==
          JSON.stringify(homePreferences.selectedDays);
    }

    setHasChanges(hasChanged);
  }, [
    selectedDays,
    showCompleted,
    showHabits,
    selectedTags,
    selectedPriority,
    duplicateWhenDragging,
    preferences,
    homePreferences,
    type,
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

  // Update the savePreferences function to handle the correct types
  const savePreferences = () => {
    // Common preferences for both types
    const basePrefs: BasePreferences = {
      showCompleted,
      showHabits,
      selectedTags,
      selectedPriority,
      duplicateWhenDragging,
    };

    // Apply preferences based on type
    if (type === "home" && onHomePreferencesChange) {
      onHomePreferencesChange({
        ...basePrefs,
        selectedDays,
      });
    } else {
      // Use type assertion to match the expected type
      onPreferencesChange(basePrefs as unknown as T);
    }

    setHasChanges(false);
  };

  const resetAllFilters = () => {
    setShowCompleted(true);
    setShowHabits(true);
    setSelectedTags([]);
    setSelectedPriority(null);
    setHasChanges(true);
  };

  // Home-specific validation
  const isBoardCountInvalid = type === "home" && selectedDays.length !== 5;
  const isMaxSelected = type === "home" && selectedDays.length === 5;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-2"
        align="end"
        aria-label="Preferences Popover"
      >
        <div className="rounded-lg flex flex-col">
          {/* Home-specific board selection */}
          {type === "home" && (
            <>
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
            </>
          )}

          {/* Common preferences for both types */}
          <div className="space-y-3 p-1">
            {type === "goal" && (
              <Label className="text-xs font-bold">Preference</Label>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="show-completed">
                Show completed {type === "goal" ? "goals" : "tasks"}
              </Label>
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
                aria-label={`Toggle completed ${
                  type === "goal" ? "goals" : "tasks"
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-habits">
                Show repeated {type === "goal" ? "goals" : "tasks"}
              </Label>
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

          {/* Filter section */}

          <Label className="text-xs font-bold m-1 my-2">Filter</Label>

          <div className="space-y-2">
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

            <div>
              <Label id="priority-label" className="sr-only">
                Filter by Priority
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
                      className={`
                       ${buttonVariants({
                         variant:
                           selectedPriority === priority.id
                             ? "secondary"
                             : "outline",
                         size: "sm",
                       })} w-full border ${
                        selectedPriority === priority.id && priority.color
                      }`}
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
                Reset Filters
              </Button>
            )}
            <Button
              disabled={(type === "home" && isBoardCountInvalid) || !hasChanges}
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
