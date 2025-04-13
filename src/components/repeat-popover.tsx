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
];

interface RepeatPopoverProps {
  repeatedDays: string[];
  onRepeatedDaysChange: (days: string[]) => void;
}

export default function RepeatPopover({
  repeatedDays,
  onRepeatedDaysChange,
}: RepeatPopoverProps) {
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
      return "No repeat";
    } else if (repeatedDays.length === 7) {
      return "Repeat Every day";
    }
    return "";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 justify-start">
          <Repeat className="h-4 w-4 mr-2 opacity-70" />

          {repeatedDays.length > 0 && repeatedDays.length < 7 ? (
            <div className="flex gap-1">
              {repeatedDays.map((day) => (
                <div
                  key={day}
                  className="w-6 h-6 bg-primary rounded text-white font-medium flex items-center justify-center text-xs"
                >
                  {day[0]}
                </div>
              ))}
            </div>
          ) : (
            <span>{getRepeatStatusText()}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="space-y-1">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center">
              <Button
                type="button"
                variant={repeatedDays.includes(day) ? "default" : "outline"}
                onClick={() => toggleDay(day)}
                className={cn(
                  "w-full justify-start",
                  repeatedDays.includes(day)
                    ? "bg-primary hover:bg-primary/80 border border-primary text-white"
                    : ""
                )}
                size="sm"
              >
                {day}
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
