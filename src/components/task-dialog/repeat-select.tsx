"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Task } from "@/stores/useTaskStore";

// Days of the week for repeat options
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface RepeatSelectProps {
  disabled: boolean;
  repeatedDays: string[];
  onRepeatedDaysChange: (days: string[]) => void;
  type?: Task["type"];
}

const RepeatSelect = ({
  disabled,
  repeatedDays,
  onRepeatedDaysChange,
  type = "daily",
}: RepeatSelectProps) => {
  const [open, setOpen] = useState(false);

  // If it's not a daily task, handle goal repetition differently
  if (type !== "daily") {
    // Life goals don't repeat
    if (type === "life") {
      return null;
    }

    // For other goal types, show a toggle button
    const isRepeating = repeatedDays.includes(type);

    const handleToggle = () => {
      if (isRepeating) {
        onRepeatedDaysChange([]);
      } else {
        onRepeatedDaysChange([type]);
      }
    };

    // Get the display text based on the type and whether it's repeating
    const getButtonText = () => {
      if (!isRepeating) return "Repeat";

      switch (type) {
        case "weekly":
          return "Weekly";
        case "monthly":
          return "Monthly";
        case "yearly":
          return "Yearly";
        default:
          return "Repeat";
      }
    };

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className={isRepeating ? "text-primary" : ""}
      >
        <Repeat
          className={`${
            isRepeating ? "text-primary" : "opacity-70"
          } size-4 mr-1`}
        />
        {getButtonText()}
      </Button>
    );
  }

  // For daily tasks, use the original functionality with days of week
  const toggleDay = (day: string) => {
    if (repeatedDays.includes(day)) {
      onRepeatedDaysChange(repeatedDays.filter((d) => d !== day));
    } else {
      onRepeatedDaysChange([...repeatedDays, day]);
    }
  };

  // Handle "Everyday" selection
  const toggleEveryday = () => {
    if (repeatedDays.length === DAYS_OF_WEEK.length) {
      // If all days are selected, clear the selection
      onRepeatedDaysChange([]);
    } else {
      // Otherwise select all days
      onRepeatedDaysChange([...DAYS_OF_WEEK]);
    }
  };

  // Determine the repeat status text
  const getRepeatStatusText = () => {
    if (repeatedDays.length === 0) {
      return "Repeat";
    } else if (repeatedDays.length === DAYS_OF_WEEK.length) {
      return "Daily";
    }
    return "";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} asChild>
        <Button variant="outline" size="sm">
          <Repeat
            className={`${
              repeatedDays.length ? "text-primary" : "opacity-70"
            } size-4 mr-1`}
          />

          {repeatedDays.length > 0 &&
          repeatedDays.length < DAYS_OF_WEEK.length ? (
            <span className="flex">
              {repeatedDays.map((day) =>
                repeatedDays.length === 1 ? day : day[0]
              )}
            </span>
          ) : (
            <span>{getRepeatStatusText()}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44">
        <div className="space-y-1 flex flex-wrap items-center gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <Button
              key={day}
              type="button"
              variant={repeatedDays.includes(day) ? "default" : "outline"}
              onClick={() => toggleDay(day)}
              className={`
                flex-1 h-8 px-2 my-0
                ${
                  repeatedDays.includes(day) &&
                  "bg-primary hover:bg-primary/80 border text-white"
                } 
              `}
            >
              {day.slice(0, 3)}
            </Button>
          ))}
          <Button
            type="button"
            variant={
              repeatedDays.length === DAYS_OF_WEEK.length
                ? "default"
                : "outline"
            }
            onClick={toggleEveryday}
            className={`
              w-full h-8 px-2 my-0
              ${
                repeatedDays.length === DAYS_OF_WEEK.length &&
                "bg-primary hover:bg-primary/80 border text-white"
              } 
            `}
          >
            Everyday
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RepeatSelect;
