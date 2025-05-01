"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  subDays,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
} from "date-fns";
import { Target, Flame, Settings2, Timer, CheckCircle } from "lucide-react";
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

import { PriorityDonutChart } from "./priority-chart";
import { ProductivityByDayChart } from "./days-chart";
import { PomodoroInsightsChart } from "./pomodoro-chart";
import HabitsTable from "./habits-table";
import ActivityHeatmap from "./heatmap";
import TagsChart from "./tags-chart";
import { AchievementsCard } from "./achievements";

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
      .sort((a, b) => (b.pomodoros || 0) - (a.pomodoros || 0));
  }, [tasks]);

  // Calculate achievements
  const achievements = useMemo(() => {
    return [
      {
        id: "streak-7",
        title: "7-Day Streak",
        description: "Complete tasks for 7 consecutive days",
        icon: Flame,
        achieved: calculateLongestStreak >= 7,
        progress: Math.min(calculateLongestStreak / 7, 1) * 100,
      },
      {
        id: "streak-30",
        title: "30-Day Streak",
        description: "Complete tasks for 30 consecutive days",
        icon: Flame,
        achieved: calculateLongestStreak >= 30,
        progress: Math.min(calculateLongestStreak / 30, 1) * 100,
      },
      {
        id: "streak-100",
        title: "100-Day Streak",
        description: "Complete tasks for 100 consecutive days",
        icon: Flame,
        achieved: calculateLongestStreak >= 100,
        progress: Math.min(calculateLongestStreak / 100, 1) * 100,
      },
      {
        id: "goals-10",
        title: "10 Goals Completed",
        description: "Complete 10 goals",
        icon: Target,
        achieved: goalStats.completed >= 10,
        progress: Math.min(goalStats.completed / 10, 1) * 100,
      },
      {
        id: "goals-50",
        title: "50 Goals Completed",
        description: "Complete 50 goals",
        icon: Target,
        achieved: goalStats.completed >= 50,
        progress: Math.min(goalStats.completed / 50, 1) * 100,
      },
      {
        id: "goals-100",
        title: "100 Goals Completed",
        description: "Complete 100 goals",
        icon: Target,
        achieved: goalStats.completed >= 100,
        progress: Math.min(goalStats.completed / 100, 1) * 100,
      },
      {
        id: "pomodoros-100",
        title: "100 Pomodoros",
        description: "Complete 100 pomodoro sessions",
        icon: Timer,
        achieved: totalPomodoros >= 100,
        progress: Math.min(totalPomodoros / 100, 1) * 100,
      },
      {
        id: "pomodoros-500",
        title: "500 Pomodoros",
        description: "Complete 500 pomodoro sessions",
        icon: Timer,
        achieved: totalPomodoros >= 500,
        progress: Math.min(totalPomodoros / 500, 1) * 100,
      },
    ];
  }, [calculateLongestStreak, goalStats.completed, totalPomodoros]);

  const dataaa = [
    {
      subject: "spiritual ✨",
      usage: 100,
      productivity: 100,
    },
    {
      subject: "health",
      usage: 72,
      productivity: 30,
    },
    {
      subject: "Personal",
      usage: 68,
      productivity: 40,
    },
    {
      subject: "Life",
      usage: 36,
      productivity: 40,
    },
    {
      subject: "mental",
      usage: 12,
      productivity: 50,
    },
  ];

  const kpiCards = [
    {
      title: "Completed Tasks",
      icon: CheckCircle,
      description: "Completion rate:",
      content: `${totalCompletedTasks} Tasks`,
    },
    {
      title: "Total Pomodoros",
      icon: Timer,
      description: `Focused Hours: ${Math.round(totalFocusedHours)}h`,
      content: `${totalPomodoros} Pomos`,
    },
    {
      title: "Streak On Fire",
      icon: Flame,
      description: `Best streak: ${calculateLongestStreak} days`,
      content: `${calculateCurrentStreak} Days`,
    },
    {
      title: "Completed Goals",
      icon: Target,
      description: `Completion rate: ${Math.round(goalStats.rate)}%`,
      content: `${goalStats.completed} Goals`,
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
          {kpiCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="gap-4 rounded">
                <CardHeader className="flex items-center justify-between">
                  <div className="">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                  <Icon
                    className="size-8 text-muted-foreground"
                    strokeWidth={1}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{card.content}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Heatmap Section */}
        <ActivityHeatmap getCompletionRate={getCompletionRate} />

        <div className="grid gap-2 md:grid-cols-3">
          <TagsChart data={dataaa} />
          <PriorityDonutChart data={completionByPriority} />
          <ProductivityByDayChart data={completionByDayOfWeek} />
        </div>

        <div className="grid grid-cols-3 items-center gap-2">
          <div className="col-span-1 h-full">
            <PomodoroInsightsChart
              topPomodoroTasks={topPomodoroTasks}
              totalFocusedHours={totalFocusedHours}
              pomodoroSettings={pomodoroSettings}
            />
          </div>
          <div className="col-span-2 h-full">
            <HabitsTable />
          </div>
        </div>

        <AchievementsCard achievements={achievements} />
      </main>
    </div>
  );
}
