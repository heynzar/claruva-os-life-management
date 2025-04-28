import React, { useMemo, useState } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { format, startOfWeek, addDays, differenceInDays } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Repeat, ChevronDown, ChevronUp, Columns4 } from "lucide-react";
import { cn } from "@/lib/utils"; // Import the utility function for class merging

// Using Task type from the store directly
import type { Task } from "@/stores/useTaskStore";

const HabitsTable = () => {
  const [showAllHabits, setShowAllHabits] = useState(false);

  // Get the current date
  const today = new Date();

  // Get start of current week (Sunday)
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });

  // Generate array of 7 days for the current week
  const weekDays: Array<{
    date: Date;
    dayName: string;
    dayNumber: string;
    dateString: string;
  }> = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    return {
      date,
      dayName: format(date, "EEE"),
      dayNumber: format(date, "d"),
      dateString: format(date, "yyyy-MM-dd"),
    };
  });

  // Get all tasks from the store
  const tasks = useTaskStore((state) => state.tasks);
  const isTaskCompletedOnDate = useTaskStore(
    (state) => state.isTaskCompletedOnDate
  );

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
  const calculateStreak = (taskId: string): number => {
    const task = tasks.find((t: Task) => t.id === taskId);
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
  const getPriorityColorClass = (priority: string): string => {
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

  return (
    <Card className="w-full rounded h-full col-span-2">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          Pomodoro Insights
        </CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide divide-border">
          <thead className="bg-muted/40 border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Habit
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Streak
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.dateString}
                  className="px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <div className="flex flex-col items-center">
                    <span>{day.dayName}</span>
                    <span>{day.dayNumber}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="border divide-y divide-border">
            {recurringTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-3 text-center text-sm text-muted-foreground"
                >
                  No recurring habits found. Add habits with repeating days to
                  track them here.
                </td>
              </tr>
            ) : (
              visibleTasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/50">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-foreground">
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

                  <td className="px-6 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success">
                      {calculateStreak(task.id)} days
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
                        className="px-2 py-3 whitespace-nowrap text-center"
                      >
                        {isScheduledDay ? (
                          <div
                            className={cn(
                              "size-4 mx-auto rounded border",
                              isCompleted
                                ? "bg-primary "
                                : "bg-muted-foreground/20"
                            )}
                          ></div>
                        ) : (
                          <Columns4
                            className="size-5 mx-auto text-accent"
                            strokeWidth={1}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
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
