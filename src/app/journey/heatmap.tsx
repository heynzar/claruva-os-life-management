import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// Type definitions
export interface CompletionStats {
  rate: number;
  completed: number;
  total: number;
  points: number;
  maxPoints: number;
  pomodoroHours: number;
}

export interface ActivityHeatmapProps {
  /** Function that takes a date and returns completion statistics */
  getCompletionRate: (date: Date) => CompletionStats;
  /** Initial year to display */
  initialYear?: number;
  /** Number of years to show in selector */
  yearRange?: number;
  /** How many years back to start from current year */
  yearOffset?: number;
  /** Whether to show the color legend */
  showLegend?: boolean;
  /** Whether to show the year selector */
  showYearSelector?: boolean;
}

/**
 * ActivityHeatmap Component
 *
 * Displays activity data in a GitHub-style heatmap calendar
 */
export default function ActivityHeatmap({
  getCompletionRate,
  initialYear = new Date().getFullYear(),
  yearRange = 5,
  yearOffset = 1,
  showLegend = true,
  showYearSelector = true,
}: ActivityHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  // Generate array of dates for the selected year
  const daysInYear: Date[] = [];
  const startDate = new Date(selectedYear, 0, 1); // January 1st of selected year
  const endDate = new Date(selectedYear, 11, 31); // December 31st of selected year

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    daysInYear.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return (
    <section className="flex gap-2 w-full ">
      {/* Heatmap Section */}
      <div className="relative overflow-x-auto border p-4 rounded flex-1">
        {/* Fixed width container to prevent wrapping */}
        <div className="w-full min-w-[750px]">
          {/* Month labels */}
          <div className="flex mb-2">
            {/* Day labels column */}
            <div className="w-8 flex-shrink-0"></div>

            {/* Month labels */}
            {[
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
            ].map((month) => (
              <div
                key={month}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex">
            {/* Day labels column */}
            <div className="w-8 flex-shrink-0 mr-1">
              <div className="flex flex-col justify-between h-28">
                {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((day, i) => (
                  <div key={i} className="text-xs text-muted-foreground h-3">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar cells container */}
            <div className="flex-1">
              <div className="grid grid-rows-7 grid-flow-col gap-1">
                {/* Calendar cells */}
                {daysInYear.map((day, i) => {
                  // Only show if day of week matches the row (0 = Monday, 6 = Sunday)
                  const dayOfWeek = (day.getDay() + 6) % 7; // Convert to 0-6 where 0 is Monday

                  // Calculate the completion stats for this day
                  const completionStats = getCompletionRate(day);

                  // Determine the background color based on completion rate
                  let bgColorClass = "bg-muted";
                  if (completionStats.rate > 0) {
                    if (completionStats.rate >= 80) {
                      bgColorClass = "bg-primary/80 dark:bg-primary/90";
                    } else if (completionStats.rate >= 50) {
                      bgColorClass = "bg-primary/50 dark:bg-primary/60";
                    } else if (completionStats.rate >= 25) {
                      bgColorClass = "bg-primary/30 dark:bg-primary/40";
                    } else {
                      bgColorClass = "bg-primary/10 dark:bg-primary/20";
                    }
                  }

                  return (
                    <Popover key={i}>
                      <PopoverTrigger asChild>
                        <div
                          className={cn(
                            "size-[0.92rem] rounded cursor-pointer",
                            bgColorClass,
                            isSameDay(day, new Date()) && "ring-1 ring-primary"
                          )}
                          style={{ gridRow: dayOfWeek + 1 }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="center">
                        <div className="text-sm font-medium">
                          {format(day, "EEEE, MMMM d")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {completionStats.rate > 0
                            ? `${completionStats.rate.toFixed(
                                0
                              )}% completion rate`
                            : "No tasks completed"}
                        </div>
                        {completionStats.total > 0 && (
                          <div className="text-xs mt-1">
                            Tasks: {completionStats.completed}/
                            {completionStats.total} ({completionStats.points}/
                            {completionStats.maxPoints} points)
                          </div>
                        )}
                        {completionStats.pomodoroHours > 0 && (
                          <div className="text-xs mt-1">
                            Focus time:{" "}
                            {completionStats.pomodoroHours.toFixed(1)} hours
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-end mt-4 gap-1">
            <div className="text-xs text-muted-foreground mr-1">Less</div>
            <div className="size-4 rounded bg-muted"></div>
            <div className="size-4 rounded bg-primary/10 dark:bg-primary/20"></div>
            <div className="size-4 rounded bg-primary/30 dark:bg-primary/40"></div>
            <div className="size-4 rounded bg-primary/50 dark:bg-primary/60"></div>
            <div className="size-4 rounded bg-primary/80 dark:bg-primary/90"></div>
            <div className="text-xs text-muted-foreground ml-1">More</div>
          </div>
        )}
      </div>

      {/* Year selector */}
      {showYearSelector && (
        <div className="flex flex-col gap-2 p-2 border rounded w-42 max-h-[218px] overflow-y-auto">
          {Array.from({ length: yearRange }, (_, i) => {
            const year = new Date().getFullYear() - yearOffset + i;
            return (
              <Button
                key={year}
                size={yearRange > 4 ? "sm" : "default"}
                variant={selectedYear === year ? "default" : "outline"}
                className="w-full rounded"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );
}
