"use client";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import {
  format,
  getWeek,
  getYear,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addMonths,
  subMonths,
  isValid,
  addDays,
} from "date-fns";

import { Dispatch, SetStateAction, useState } from "react";

interface DateSelectProps {
  type: "daily" | "weekly" | "monthly" | "yearly" | "life";
  newDueDate?: Date | undefined;
  setNewDueDate?: Dispatch<SetStateAction<Date | undefined>>;
  timeFrameKey?: string;
  setTimeFrameKey?: Dispatch<SetStateAction<string | undefined>>;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DateSelect = ({
  type,
  newDueDate,
  setNewDueDate,
  timeFrameKey,
  setTimeFrameKey,
}: DateSelectProps) => {
  // Parse timeFrameKey to a date
  const getDateFromTimeFrameKey = (): Date => {
    if (!timeFrameKey) return new Date();

    try {
      switch (type) {
        case "weekly": {
          const parts = timeFrameKey.split("-W");
          const year = parseInt(parts[0]);
          const week = parseInt(parts[1]);
          // Create date for first day of the year, then add weeks
          const firstDayOfYear = new Date(year, 0, 1);
          const daysToAdd = (week - 1) * 7;
          return new Date(
            firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000
          );
        }
        case "monthly": {
          const [year, month] = timeFrameKey.split("-");
          return new Date(parseInt(year), parseInt(month) - 1, 1);
        }
        case "yearly":
          return new Date(parseInt(timeFrameKey), 0, 1);
        default:
          return new Date();
      }
    } catch (e) {
      return new Date();
    }
  };

  // For displaying date in button
  const getSelectedDateDisplay = () => {
    if (type === "daily" && newDueDate) {
      return format(newDueDate, "MMM d, yyyy");
    } else if (type === "daily") {
      return "Today";
    }

    if (!timeFrameKey) {
      return "Select period";
    }

    switch (type) {
      case "weekly": {
        const parts = timeFrameKey.split("-W");
        return `Week ${parts[1]}, ${parts[0]}`;
      }
      case "monthly": {
        const [year, month] = timeFrameKey.split("-");
        return format(
          new Date(parseInt(year), parseInt(month) - 1, 1),
          "MMM yyyy"
        );
      }
      case "yearly":
        return timeFrameKey;
      case "life":
        return "Life Goal";
      default:
        return "Select date";
    }
  };

  //life
  //2025
  //2025-02
  //2025-w14
  //

  // Convert selected date to timeFrameKey format
  const dateToTimeFrameKey = (date: Date) => {
    switch (type) {
      case "weekly": {
        const year = date.getFullYear();
        const week = getWeek(date, { weekStartsOn: 1 });
        return `${year}-W${week.toString().padStart(2, "0")}`;
      }
      case "monthly": {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        return `${year}-${month.toString().padStart(2, "0")}`;
      }
      case "yearly":
        return date.getFullYear().toString();
      default:
        return "";
    }
  };

  // Handler for date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (type === "daily") {
      setNewDueDate?.(date);
      setTimeFrameKey?.(format(date, "DD-MM-YYY"));
    } else if (setTimeFrameKey) {
      setTimeFrameKey(dateToTimeFrameKey(date));
    }
  };

  // Custom Weekly Calendar Component
  const WeeklyCalendar = () => {
    // Initialize with current month or from timeFrameKey
    const [viewMonth, setViewMonth] = useState<Date>(() => {
      if (timeFrameKey && timeFrameKey.includes("-W")) {
        const date = getDateFromTimeFrameKey();
        if (isValid(date)) return date;
      }
      return new Date();
    });

    // Get weeks of the current month
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const weeksOfMonth = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    // Navigate to previous/next month
    const previousMonth = () => setViewMonth(subMonths(viewMonth, 1));
    const nextMonth = () => setViewMonth(addMonths(viewMonth, 1));

    // Helper to generate short dates for week row display
    const getWeekDates = (weekStart: Date) => {
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        return format(day, "d");
      });
    };

    // Get week number with year
    const getWeekInfo = (date: Date) => {
      const year = getYear(date);
      const week = getWeek(date, { weekStartsOn: 1 });
      return {
        weekNumber: week,
        timeFrameKey: `${year}-W${week.toString().padStart(2, "0")}`,
      };
    };

    // Check if a week is the currently selected one
    const isSelectedWeek = (date: Date) => {
      if (!timeFrameKey) return false;

      const weekInfo = getWeekInfo(date);
      return timeFrameKey === weekInfo.timeFrameKey;
    };

    return (
      <div className="p-0 w-60">
        <div className="flex items-center justify-between p-1 border-b">
          <Button variant="ghost" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">{format(viewMonth, "MMMM yyyy")}</div>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-8 gap-1 px-1 pt-2">
          {["W.n", "M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div
              key={i}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks of the month */}
        <div className="p-1 space-y-2">
          {weeksOfMonth.map((weekStart) => {
            const weekInfo = getWeekInfo(weekStart);
            const weekDays = getWeekDates(weekStart);

            return (
              <div className="flex w-full items-center gap-2">
                <span className="text-xs font-medium">
                  W{weekInfo.weekNumber}
                </span>
                <div
                  key={weekInfo.timeFrameKey}
                  className={`
                  grid grid-cols-7 w-full items-center gap-1 rounded-md p-1 cursor-pointer text-center 
                  ${
                    isSelectedWeek(weekStart)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/80 hover:bg-secondary"
                  }
                `}
                  onClick={() => {
                    if (setTimeFrameKey) {
                      setTimeFrameKey(weekInfo.timeFrameKey);
                    }
                  }}
                >
                  {weekDays.map((day, i) => (
                    <div key={i}>
                      <span className="text-sm">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom Monthly Calendar Component with year navigation and grid display
  const MonthlyCalendar = () => {
    // Initialize view year from timeFrameKey or use current year
    const [viewYear, setViewYear] = useState<number>(() => {
      if (timeFrameKey && timeFrameKey.includes("-")) {
        try {
          const [year] = timeFrameKey.split("-");
          const parsedYear = parseInt(year);
          return !isNaN(parsedYear) ? parsedYear : new Date().getFullYear();
        } catch (e) {
          return new Date().getFullYear();
        }
      }
      return new Date().getFullYear();
    });

    // Navigate to previous/next year
    const previousYear = () => setViewYear((year) => year - 1);
    const nextYear = () => setViewYear((year) => year + 1);

    // Handle month selection
    const handleMonthSelect = (monthIndex: number) => {
      if (setTimeFrameKey) {
        const newTimeFrameKey = `${viewYear}-${(monthIndex + 1)
          .toString()
          .padStart(2, "0")}`;
        setTimeFrameKey(newTimeFrameKey);
      }
    };

    // Check if a month is selected
    const isSelectedMonth = (monthIndex: number) => {
      if (!timeFrameKey) return false;

      try {
        const [year, month] = timeFrameKey.split("-");
        return (
          parseInt(year) === viewYear && parseInt(month) === monthIndex + 1
        );
      } catch (e) {
        return false;
      }
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center p-1 justify-between border-b">
          <Button variant="ghost" size="sm" onClick={previousYear}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="font-medium">{viewYear}</div>
          <Button variant="ghost" size="sm" onClick={nextYear}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1">
          {MONTH_NAMES.map((month, index) => (
            <Button
              key={`month-${index}`}
              variant={isSelectedMonth(index) ? "default" : "outline"}
              className="w-full border"
              onClick={() => handleMonthSelect(index)}
            >
              {month}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Custom Yearly Calendar Component
  const YearlyCalendar = () => {
    const [baseYear, setBaseYear] = useState<number>(() => {
      // Try to parse the year from timeFrameKey or use current year
      if (timeFrameKey && /^\d{4}$/.test(timeFrameKey)) {
        const year = parseInt(timeFrameKey);
        if (!isNaN(year)) {
          return Math.floor(year / 10) * 10;
        }
      }
      return Math.floor(new Date().getFullYear() / 10) * 10;
    });

    // Navigate between decades
    const previousDecade = () => setBaseYear((prev) => prev - 10);
    const nextDecade = () => setBaseYear((prev) => prev + 10);

    // Select a year
    const selectYear = (year: number) => {
      if (setTimeFrameKey) {
        setTimeFrameKey(year.toString());
      }
    };

    // Generate valid years for grid display
    const years = Array.from({ length: 12 }, (_, i) => baseYear + i);

    return (
      <div className="space-y-1">
        {/* Year navigation */}
        <div className="flex items-center p-1 border-b justify-between">
          <Button variant="ghost" size="sm" onClick={previousDecade}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">Select a Year</div>
          <Button variant="ghost" size="sm" onClick={nextDecade}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Years grid */}
        <div className="grid grid-cols-3 gap-1 p-1">
          {years.map((year) => (
            <Button
              key={`year-${year}`}
              variant={timeFrameKey === year.toString() ? "default" : "outline"}
              className="w-full"
              onClick={() => selectYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Render different calendar UI based on type
  const renderCalendarContent = () => {
    switch (type) {
      case "daily":
        return (
          <Calendar
            className=""
            mode="single"
            required
            selected={newDueDate ? newDueDate : new Date()}
            onSelect={handleDateSelect}
            initialFocus
          />
        );
      case "weekly":
        return <WeeklyCalendar />;
      case "monthly":
        return <MonthlyCalendar />;
      case "yearly":
        return <YearlyCalendar />;
      case "life":
        return "";
      default:
        return null;
    }
  };

  return (
    <Popover>
      <PopoverTrigger disabled={type === "life"} asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="text-primary size-4" />
          {getSelectedDateDisplay()}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {renderCalendarContent()}
      </PopoverContent>
    </Popover>
  );
};

export default DateSelect;
