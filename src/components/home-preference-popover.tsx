"use client";

import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Day = {
  id: string;
  label: string;
};

type Goal = {
  id: string;
  label: string;
};

export default function HomePreferencePopover({
  children,
}: {
  children: React.ReactNode;
}) {
  const days: Day[] = [
    { id: "yesterday", label: "Y" },
    { id: "today", label: "T" },
    { id: "tomorrow", label: "T" },
    { id: "week", label: "W" },
    { id: "month", label: "M" },
    { id: "year", label: "Y" },
    { id: "life", label: "L" },
  ];

  const goals: Goal[] = [
    { id: "health", label: "Health" },
    { id: "work", label: "Work" },
    { id: "learning", label: "Learning" },
    { id: "social", label: "Social" },
    { id: "finance", label: "Finance" },
    { id: "personal", label: "Personal" },
    { id: "family", label: "Family" },
    { id: "creativity", label: "Creativity" },
    { id: "fitness", label: "Fitness" },
    { id: "mindfulness", label: "Mindfulness" },
  ];

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showHabits, setShowHabits] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false);

  useEffect(() => {
    setSelectedDays(days.slice(0, 5).map((d) => d.id));
  }, []);

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

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const isBoardCountInvalid = selectedDays.length !== 5;
  const isMaxSelected = selectedDays.length === 5;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-2"
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

            <Button
              disabled={isBoardCountInvalid}
              variant="default"
              size="sm"
              className="h-6"
            >
              save
            </Button>
          </div>

          {isBoardCountInvalid && (
            <div className="text-xs text-red-500" role="alert">
              Please select exactly 5 boards.
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-completed">Show completed Task</Label>
              <Switch
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
                aria-label="Toggle completed tasks"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-habits">Show Habits (Repeated tasks)</Label>
              <Switch
                id="show-habits"
                checked={showHabits}
                onCheckedChange={setShowHabits}
                aria-label="Toggle habits"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label id="goals-label">Filter by Goals</Label>
            <Popover open={goalPopoverOpen} onOpenChange={setGoalPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  aria-haspopup="listbox"
                  aria-labelledby="goals-label"
                >
                  {selectedGoals.length > 0
                    ? `${selectedGoals.length} selected`
                    : "Select goals"}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="!w-[300px] p-0">
                <Command className="w-full max-h-44">
                  <CommandInput placeholder="Search goals..." />
                  <CommandEmpty>No goal found.</CommandEmpty>
                  <CommandGroup className="overflow-auto">
                    {goals.map((goal) => (
                      <CommandItem
                        key={goal.id}
                        onSelect={() => toggleGoal(goal.id)}
                        className="flex justify-between"
                        role="option"
                        aria-selected={selectedGoals.includes(goal.id)}
                      >
                        {goal.label}
                        {selectedGoals.includes(goal.id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
