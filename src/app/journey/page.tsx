"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  subDays,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  Flame,
  Trophy,
  CheckCircle2,
  BarChart3,
  Settings2,
  Calendar,
  Tag,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTaskStore } from "@/stores/useTaskStore";
import { useTagsStore } from "@/stores/useTagsStore";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PriorityDonutChart } from "./priority-donut-chart";
import { ProductivityByDayChart } from "./productivity-by-day-chart";
import { PomodoroInsightsChart } from "./pomodoro-insights-chart";
import HabitsTable from "./habits-table";

// Helper function to get pomodoro settings from localStorage
const getPomodoroSettings = () => {
  if (typeof window === "undefined") return { pomodoro: 25, shortBreak: 5 };

  try {
    const settings = localStorage.getItem("pomodoroSettings");
    return settings ? JSON.parse(settings) : { pomodoro: 25, shortBreak: 5 };
  } catch (error) {
    console.error("Error reading pomodoro settings:", error);
    return { pomodoro: 25, shortBreak: 5 };
  }
};

export default function JourneyPage() {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pomodoroSettings, setPomodoroSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
  });

  const { tasks, isTaskCompletedOnDate } = useTaskStore();
  const { tags } = useTagsStore();

  // Load pomodoro settings on component mount
  useEffect(() => {
    setPomodoroSettings(getPomodoroSettings());
  }, []);

  // Get all days in the selected year for the heatmap
  const daysInYear = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0, 1));
    const end = endOfYear(new Date(selectedYear, 11, 31));
    return eachDayOfInterval({ start, end });
  }, [selectedYear]);

  // Calculate weighted completion rate for a specific date
  const getCompletionRate = (
    date: Date
  ): {
    rate: number;
    completed: number;
    total: number;
    points: number;
    maxPoints: number;
    pomodoroHours: number;
  } => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTasks = tasks.filter((task) => {
      // Include tasks due on this date
      if (task.type === "daily" && task.dueDate === dateStr) {
        return true;
      }

      // Include repeating tasks that occur on this day of week
      if (
        task.type === "daily" &&
        task.repeatedDays?.includes(format(date, "EEEE"))
      ) {
        // Check if the task's due date is before or on the selected date
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return date >= dueDate;
        }
        return true;
      }

      return false;
    });

    if (dayTasks.length === 0) {
      return {
        rate: 0,
        completed: 0,
        total: 0,
        points: 0,
        maxPoints: 0,
        pomodoroHours: 0,
      };
    }

    // Calculate weighted points based on priority
    let totalPoints = 0;
    let maxPoints = 0;
    let pomodoroHours = 0;

    // Count completed tasks and calculate points
    const completedTasks = dayTasks.filter((task) => {
      const isCompleted = isTaskCompletedOnDate(task.id, dateStr);

      // Calculate max points based on priority
      if (task.priority === "high") {
        maxPoints += 3;
      } else if (task.priority === "medium") {
        maxPoints += 2;
      } else {
        maxPoints += 1;
      }

      // Calculate earned points if completed
      if (isCompleted) {
        if (task.priority === "high") {
          totalPoints += 3;
        } else if (task.priority === "medium") {
          totalPoints += 2;
        } else {
          totalPoints += 1;
        }
      }

      // Calculate pomodoro hours for this task on this date
      if (task.pomodoros && isCompleted) {
        pomodoroHours += (task.pomodoros * pomodoroSettings.pomodoro) / 60;
      }

      return isCompleted;
    });

    // Calculate completion rate as percentage of points earned
    const completionRate = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    return {
      rate: completionRate,
      completed: completedTasks.length,
      total: dayTasks.length,
      points: totalPoints,
      maxPoints: maxPoints,
      pomodoroHours: pomodoroHours,
    };
  };

  // Calculate streak (consecutive days with at least one completed task)
  const calculateCurrentStreak = useMemo(() => {
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const dayTasks = tasks.filter(
        (task) =>
          (task.type === "daily" && task.dueDate === dateStr) ||
          (task.type === "daily" &&
            task.repeatedDays?.includes(format(currentDate, "EEEE")))
      );

      if (dayTasks.length === 0) break;

      const hasCompletedTask = dayTasks.some((task) =>
        isTaskCompletedOnDate(task.id, dateStr)
      );
      if (!hasCompletedTask) break;

      streak++;
      currentDate = subDays(currentDate, 1);
    }

    return streak;
  }, [tasks, isTaskCompletedOnDate]);

  // Calculate longest streak
  const calculateLongestStreak = useMemo(() => {
    let longestStreak = 0;
    let currentStreak = 0;

    // Check the last 365 days
    for (let i = 0; i < 365; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");

      const dayTasks = tasks.filter(
        (task) =>
          (task.type === "daily" && task.dueDate === dateStr) ||
          (task.type === "daily" &&
            task.repeatedDays?.includes(format(date, "EEEE")))
      );

      if (dayTasks.length === 0) {
        // Reset streak if no tasks for the day
        currentStreak = 0;
        continue;
      }

      const hasCompletedTask = dayTasks.some((task) =>
        isTaskCompletedOnDate(task.id, dateStr)
      );

      if (hasCompletedTask) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return longestStreak;
  }, [tasks, isTaskCompletedOnDate]);

  // Calculate total completed tasks
  const totalCompletedTasks = useMemo(() => {
    return tasks.reduce((count, task) => {
      if (task.type === "daily") {
        if (task.isCompleted) {
          return count + 1;
        }
        if (task.completedDates?.length) {
          return count + task.completedDates.length;
        }
      }
      return count;
    }, 0);
  }, [tasks]);

  // Calculate total pomodoros
  const totalPomodoros = useMemo(() => {
    return tasks.reduce((count, task) => count + (task.pomodoros || 0), 0);
  }, [tasks]);

  // Calculate total focused hours
  const totalFocusedHours = useMemo(() => {
    return (totalPomodoros * pomodoroSettings.pomodoro) / 60;
  }, [totalPomodoros, pomodoroSettings.pomodoro]);

  // Calculate goal completion stats
  const goalStats = useMemo(() => {
    const goals = tasks.filter((task) => task.type !== "daily");
    const completedGoals = goals.filter((goal) => goal.isCompleted);

    return {
      total: goals.length,
      completed: completedGoals.length,
      rate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
    };
  }, [tasks]);

  // Calculate completion rate by day of week
  const completionByDayOfWeek = useMemo(() => {
    const dayStats = [0, 0, 0, 0, 0, 0, 0].map(() => ({
      total: 0,
      completed: 0,
      points: 0,
      maxPoints: 0,
    }));
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    tasks.forEach((task) => {
      if (task.type === "daily" && task.dueDate) {
        const date = new Date(task.dueDate);
        // Convert to 0-6 where 0 is Monday
        const dayIndex = (date.getDay() + 6) % 7;

        // Calculate points based on priority
        let taskPoints = 1;
        if (task.priority === "high") taskPoints = 3;
        else if (task.priority === "medium") taskPoints = 2;

        dayStats[dayIndex].maxPoints += taskPoints;
        dayStats[dayIndex].total++;

        if (isTaskCompletedOnDate(task.id, task.dueDate)) {
          dayStats[dayIndex].completed++;
          dayStats[dayIndex].points += taskPoints;
        }
      }
    });

    return dayNames.map((name, index) => ({
      name,
      shortName: name.substring(0, 3),
      rate:
        dayStats[index].maxPoints > 0
          ? (dayStats[index].points / dayStats[index].maxPoints) * 100
          : 0,
      completed: dayStats[index].completed,
      total: dayStats[index].total,
    }));
  }, [tasks, isTaskCompletedOnDate]);

  // Calculate completion rate by priority
  const completionByPriority = useMemo(() => {
    const priorityStats = {
      high: { total: 0, completed: 0, points: 0, maxPoints: 0 },
      medium: { total: 0, completed: 0, points: 0, maxPoints: 0 },
      low: { total: 0, completed: 0, points: 0, maxPoints: 0 },
    };

    tasks.forEach((task) => {
      if (task.type === "daily") {
        // Calculate points based on priority
        let taskPoints = 1;
        if (task.priority === "high") taskPoints = 3;
        else if (task.priority === "medium") taskPoints = 2;

        priorityStats[task.priority].maxPoints += taskPoints;
        priorityStats[task.priority].total++;

        if (task.dueDate && isTaskCompletedOnDate(task.id, task.dueDate)) {
          priorityStats[task.priority].completed++;
          priorityStats[task.priority].points += taskPoints;
        } else if (task.isCompleted) {
          priorityStats[task.priority].completed++;
          priorityStats[task.priority].points += taskPoints;
        }
      }
    });

    return [
      {
        name: "High",
        rate:
          priorityStats.high.maxPoints > 0
            ? (priorityStats.high.points / priorityStats.high.maxPoints) * 100
            : 0,
        completed: priorityStats.high.completed,
        total: priorityStats.high.total,
        color: "#ef4444",
      },
      {
        name: "Medium",
        rate:
          priorityStats.medium.maxPoints > 0
            ? (priorityStats.medium.points / priorityStats.medium.maxPoints) *
              100
            : 0,
        completed: priorityStats.medium.completed,
        total: priorityStats.medium.total,
        color: "#eab308",
      },
      {
        name: "Low",
        rate:
          priorityStats.low.maxPoints > 0
            ? (priorityStats.low.points / priorityStats.low.maxPoints) * 100
            : 0,
        completed: priorityStats.low.completed,
        total: priorityStats.low.total,
        color: "#3b82f6",
      },
    ];
  }, [tasks, isTaskCompletedOnDate]);

  // Calculate tag usage and productivity
  const tagAnalytics = useMemo(() => {
    const tagStats: Record<
      string,
      { count: number; completed: number; total: number }
    > = {};

    // Initialize stats for all tags
    tags.forEach((tag) => {
      tagStats[tag] = { count: 0, completed: 0, total: 0 };
    });

    // Calculate stats
    tasks.forEach((task) => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach((tag) => {
          if (!tagStats[tag]) {
            tagStats[tag] = { count: 0, completed: 0, total: 0 };
          }

          tagStats[tag].count++;
          tagStats[tag].total++;

          if (
            (task.type === "daily" &&
              task.dueDate &&
              isTaskCompletedOnDate(task.id, task.dueDate)) ||
            task.isCompleted
          ) {
            tagStats[tag].completed++;
          }
        });
      }
    });

    // Convert to array and calculate rates
    return Object.entries(tagStats)
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        productivityRate:
          stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Limit to top 8 tags
      .map((item) => ({
        subject: item.tag,
        usage: item.count,
        productivity: item.productivityRate,
      }));
  }, [tasks, tags, isTaskCompletedOnDate]);

  // Get top 5 tasks by pomodoro usage
  const topPomodoroTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.pomodoros && task.pomodoros > 0)
      .sort((a, b) => (b.pomodoros || 0) - (a.pomodoros || 0))
      .slice(0, 5);
  }, [tasks]);

  // Calculate pomodoro data for radial chart
  const pomodoroChartData = useMemo(() => {
    const focusTime = totalPomodoros * pomodoroSettings.pomodoro;
    const breakTime = totalPomodoros * pomodoroSettings.shortBreak;

    return [
      {
        month: "january",
        desktop: focusTime,
        mobile: breakTime,
      },
    ];
  }, [totalPomodoros, pomodoroSettings]);

  console.log(pomodoroChartData);
  // Navigate to previous/next year
  const previousYear = () => {
    setSelectedYear((prev) => prev - 1);
  };

  const nextYear = () => {
    setSelectedYear((prev) => prev + 1);
  };

  const dataaa = [
    {
      subject: "spiritual ✨",
      usage: 15,
      productivity: 60,
    },
    {
      subject: "health",
      usage: 19,
      productivity: 30,
    },
    {
      subject: "Personal",
      usage: 30,
      productivity: 40,
    },
    {
      subject: "Life",
      usage: 10,
      productivity: 40,
    },
    {
      subject: "mental",
      usage: 2,
      productivity: 50,
    },
  ];

  return (
    <div className="flex flex-col h-screen ">
      <header className="flex bg-muted/20 items-center justify-between w-full p-2">
        <h1 className="sr-only">Journey</h1>
        <div className="flex items-center ml-auto">
          <div className="flex gap-2 items-center ml-auto px-2">
            <Flame className="size-4" />
            <span>{calculateCurrentStreak} Days</span>
          </div>
          <Button disabled size="icon" variant="ghost">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-muted/40 p-4 overflow-auto flex flex-col gap-2">
        {/* KPI Cards Section */}
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-4 rounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Completed Tasks
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription> Completion rate:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCompletedTasks} Tasks
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 rounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Total Pomodoros
                </CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Focused Hours: {Math.round(totalFocusedHours)}h
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPomodoros} pomos</div>
            </CardContent>
          </Card>

          <Card className="gap-4 rounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Streak On Fire
                </CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Best streak: {calculateLongestStreak} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateCurrentStreak} Days
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 rounded">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Completed Goals
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                Completion rate: {Math.round(goalStats.rate)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goalStats.completed} Goals
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="flex gap-2 w-full">
          {/* Heatmap Section */}
          <div className="relative overflow-x-auto border p-4 rounded">
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
                      <div
                        key={i}
                        className="text-xs text-muted-foreground h-3"
                      >
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
                                isSameDay(day, new Date()) &&
                                  "ring-1 ring-primary"
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
                                {completionStats.total} (
                                {completionStats.points}/
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
            <div className="flex items-center justify-end mt-4 gap-1">
              <div className="text-xs text-muted-foreground mr-1">Less</div>
              <div className="size-4 rounded bg-muted"></div>
              <div className="size-4 rounded bg-primary/10 dark:bg-primary/20"></div>
              <div className="size-4 rounded bg-primary/30 dark:bg-primary/40"></div>
              <div className="size-4 rounded bg-primary/50 dark:bg-primary/60"></div>
              <div className="size-4 rounded bg-primary/80 dark:bg-primary/90"></div>
              <div className="text-xs text-muted-foreground ml-1">More</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-2 border flex-1 rounded">
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  className="w-full rounded"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              );
            })}
          </div>
        </section>

        <div className="grid gap-2 md:grid-cols-3">
          {/* Tags Analysis Section */}

          <Card className="rounded">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Tags Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ChartContainer
                config={{
                  usage: {
                    label: "Usage",
                    color: "var(--chart-1)",
                  },
                  productivity: {
                    label: "Productivity",
                    color: "var(--chart-2)",
                  },
                }}
              >
                <ResponsiveContainer
                  className="scale-110"
                  width="100%"
                  height="100%"
                >
                  <RadarChart data={dataaa}>
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <PolarGrid gridType="circle" />
                    <PolarAngleAxis dataKey="subject" />

                    <Radar
                      name="Productivity"
                      dataKey="productivity"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.3}
                      dot={{
                        r: 4,
                        fillOpacity: 1,
                      }}
                    />
                    <Radar
                      name="Usage"
                      dataKey="usage"
                      stroke="var(--color-productivity)"
                      fill="var(--color-productivity)"
                      fillOpacity={0.6}
                      dot={{
                        r: 4,
                        fillOpacity: 1,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Productivity by Priority */}
          <PriorityDonutChart data={completionByPriority} />

          {/* Productivity by Day of Week */}
          <ProductivityByDayChart data={completionByDayOfWeek} />

          {/* Pomodoro Insights */}
        </div>

        <div className="grid grid-cols-3 items-center gap-2">
          <PomodoroInsightsChart
            topPomodoroTasks={topPomodoroTasks}
            totalFocusedHours={totalFocusedHours}
            pomodoroSettings={pomodoroSettings}
          />

          <HabitsTable />
        </div>
      </main>
    </div>
  );
}
