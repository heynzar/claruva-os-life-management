"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Days of the week for repeat options
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Everyday",
];

interface RepeatSelectProps {
  disabled: boolean;
  repeatedDays: string[];
  onRepeatedDaysChange: (days: string[]) => void;
}

const RepeatSelect = ({
  disabled,
  repeatedDays,
  onRepeatedDaysChange,
}: RepeatSelectProps) => {
  const [open, setOpen] = useState(false);

  const toggleDay = (day: string) => {
    if (repeatedDays.includes(day)) {
      onRepeatedDaysChange(repeatedDays.filter((d) => d !== day));
    } else {
      onRepeatedDaysChange([...repeatedDays, day]);
    }
  };

  // Determine the repeat status text
  const getRepeatStatusText = () => {
    if (repeatedDays.length === 0) {
      return "Repeat";
    } else if (repeatedDays.length === 7) {
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
            } size-4`}
          />

          {repeatedDays.length > 0 && repeatedDays.length < 7 ? (
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
                  "bg-primary  hover:bg-primary/80 border  text-white"
                } 
                ${day === "Everyday" ? "px-6" : "px-2"}
                  
              `}
            >
              {day === "Everyday" ? day : day.slice(0, 3)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RepeatSelect;
