import React, { useMemo, useState } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import {
  format,
  startOfWeek,
  addDays,
  differenceInDays,
  subWeeks,
  addWeeks,
  isSameDay,
  getWeek,
} from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HabitsTable = () => {
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Get the current date
  const today = new Date();

  // Calculate the week based on the offset
  const currentWeekStart = useMemo(() => {
    const baseWeek = startOfWeek(today, { weekStartsOn: 0 });
    return currentWeekOffset === 0
      ? baseWeek
      : currentWeekOffset > 0
      ? addWeeks(baseWeek, currentWeekOffset)
      : subWeeks(baseWeek, Math.abs(currentWeekOffset));
  }, [currentWeekOffset]);

  // Generate array of 7 days for the selected week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i);
      return {
        date,
        dayName: format(date, "EEE"),
        dayNumber: format(date, "d"),
        dateString: format(date, "yyyy-MM-dd"),
        isToday: isSameDay(date, today),
      };
    });
  }, [currentWeekStart, today]);

  // Get all tasks from the store
  const tasks = useTaskStore((state) => state.tasks);
  const isTaskCompletedOnDate = useTaskStore(
    (state) => state.isTaskCompletedOnDate
  );
  const toggleComplete = useTaskStore((state) => state.toggleComplete);

  // Navigation functions
  const goToPreviousWeek = () => setCurrentWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setCurrentWeekOffset((prev) => prev + 1);
  const goToCurrentWeek = () => setCurrentWeekOffset(0);

  // Filter to only get recurring tasks (tasks with repeatedDays property)
  // and sort them by priority (high → medium → low)
  const recurringTasks = useMemo(() => {
    const filteredTasks = tasks.filter(
      (task) =>
        task.repeatedDays &&
        task.repeatedDays.length > 0 &&
        task.type === "daily"
    );

    return filteredTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  // Get visible tasks - either all or just the first 6
  const visibleTasks = useMemo(() => {
    return showAllHabits ? recurringTasks : recurringTasks.slice(0, 6);
  }, [recurringTasks, showAllHabits]);

  // Calculate streaks for each recurring task
  const calculateStreak = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.completedDates || task.completedDates.length === 0)
      return 0;

    // Sort completed dates
    const sortedDates = [...task.completedDates].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // Start with the latest completion
    let currentStreak = 1;
    let prevDate = new Date(sortedDates[0]);

    // Check for consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const dayDiff = differenceInDays(prevDate, currentDate);

      if (dayDiff === 1) {
        currentStreak++;
        prevDate = currentDate;
      } else {
        break; // Streak broken
      }
    }

    // Check if streak is current (last completion is today or yesterday)
    const daysSinceLastCompletion = differenceInDays(
      today,
      new Date(sortedDates[0])
    );
    if (daysSinceLastCompletion > 1) {
      return 0; // Streak broken if not completed recently
    }

    return currentStreak;
  };

  // Function to get priority color based on shadcn UI color scheme
  const getPriorityColorClass = (priority: "high" | "low" | "medium") => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-yellow-400";
      case "low":
        return "bg-primary";
      default:
        return "bg-muted";
    }
  };

  const weekInfo = useMemo(() => {
    const startDate = format(weekDays[0].date, "MMM d");
    const endDate = format(weekDays[6].date, "MMM d, yyyy");
    const week_number = getWeek(weekDays[0].date); // Use the start of the week
    return {
      week_date: `${startDate} - ${endDate}`,
      week_number,
    };
  }, [weekDays]);

  // Handle task completion toggle
  const handleToggleComplete = (taskId: string, dateString: string) => {
    toggleComplete(taskId, dateString);
  };

  return (
    <Card className="w-full h-full rounded">
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Habits Tracker
            </CardTitle>
            <CardDescription className="mt-2">
              {weekInfo.week_date}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {currentWeekOffset !== 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={goToCurrentWeek}
                className="h-8"
              >
                Current Week
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="h-8 flex justify-center items-center bg-secondary px-4 border rounded-md">
              Week {weekInfo.week_number}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="border rounded overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/40">
              <tr className="divide-x divide-border">
                <th className="px-6 py-3  text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                  <span className="flex items-center gap-2">
                    <RotateCcw className="size-4" strokeWidth={1} />
                    Habit
                  </span>
                </th>
                <th className="pl-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                  <span className="flex items-center gap-2">
                    <Flame className="size-4" strokeWidth={1} />
                    Streak
                  </span>
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.dateString}
                    className={cn(
                      "px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-b",
                      day.isToday ? "bg-primary/10" : ""
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span>{day.dayName}</span>
                      <span className={cn(day.isToday ? "font-bold" : "")}>
                        {day.dayNumber}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {recurringTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center text-sm text-muted-foreground border-b"
                  >
                    No recurring habits found. Add habits with repeating days to
                    track them here.
                  </td>
                </tr>
              ) : (
                visibleTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-muted/50 divide-x divide-border"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "size-2.5 rounded-full mr-2",
                            getPriorityColorClass(task.priority)
                          )}
                        ></div>
                        {task.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success">
                        {calculateStreak(task.id)}{" "}
                        {calculateStreak(task.id) === 1 ? "day" : "days"}
                      </span>
                    </td>
                    {weekDays.map((day) => {
                      // Check if this day of week is in the task's repeatedDays
                      const dayOfWeek = format(day.date, "EEEE");
                      const isScheduledDay =
                        task.repeatedDays?.includes(dayOfWeek);
                      const isCompleted = isTaskCompletedOnDate(
                        task.id,
                        day.dateString
                      );

                      // Only show completion status for days when the habit is scheduled
                      return (
                        <td
                          key={day.dateString}
                          className={cn(
                            "px-2 py-4 text-center",
                            day.isToday ? "bg-primary/5" : ""
                          )}
                        >
                          {isScheduledDay ? (
                            <button
                              onClick={() =>
                                handleToggleComplete(task.id, day.dateString)
                              }
                              className={cn(
                                "size-5 cursor-pointer text-white mx-auto rounded-md border flex items-center justify-center transition-colors",
                                isCompleted
                                  ? "bg-primary hover:bg-primary/90"
                                  : "bg-muted-foreground/20 hover:bg-muted-foreground/30"
                              )}
                            >
                              {isCompleted && (
                                <Check className="size-3" strokeWidth={4} />
                              )}
                            </button>
                          ) : (
                            <div className="size-5 mx-auto flex items-center justify-center select-none opacity-10">
                              ///
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {recurringTasks.length > 6 && (
        <CardFooter className="flex justify-center pt-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllHabits(!showAllHabits)}
            className="flex items-center gap-1"
          >
            {showAllHabits ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All ({recurringTasks.length}){" "}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default HabitsTable;
