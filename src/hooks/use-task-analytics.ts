"use client";

import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { useTaskStore, type Task } from "@/stores/useTaskStore";

type PomodoroSettings = {
  pomodoro: number;
  shortBreak: number;
};

type CompletionRate = {
  rate: number;
  completed: number;
  total: number;
  points: number;
  maxPoints: number;
  pomodoroHours: number;
};

type Props = {
  tasks: Task[];
  tags: string[];
  pomodoroSettings: PomodoroSettings;
};

export function useTaskAnalytics({ tasks, tags, pomodoroSettings }: Props) {
  const { isTaskCompletedOnDate } = useTaskStore();

  // Calculate weighted completion rate for a specific date
  const getCompletionRate = (date: Date): CompletionRate => {
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

    // Count total number of tasks (for percentage calculation)
    const totalTaskCount = tasks.length;

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
        usagePercentage:
          totalTaskCount > 0 ? (stats.count / totalTaskCount) * 100 : 0,
        productivityRate:
          stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Limit to top 8 tags
      .map((item) => ({
        subject: item.tag,
        usage: Math.round(item.usagePercentage),
        productivity: Math.round(item.productivityRate),
      }));
  }, [tasks, tags, isTaskCompletedOnDate]);

  // Get top 5 tasks by pomodoro usage
  const topPomodoroTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.pomodoros && task.pomodoros > 0)
      .sort((a, b) => (b.pomodoros || 0) - (a.pomodoros || 0));
  }, [tasks]);

  // Calculate overall completion rate
  const overallCompletionRate = useMemo(() => {
    const dailyTasks = tasks.filter((task) => task.type === "daily");
    if (dailyTasks.length === 0) return 0;

    const completedCount = dailyTasks.reduce((count, task) => {
      if (task.isCompleted) return count + 1;
      if (task.completedDates?.length) return count + 1;
      return count;
    }, 0);

    return dailyTasks.length > 0
      ? (completedCount / dailyTasks.length) * 100
      : 0;
  }, [tasks]);

  return {
    getCompletionRate,
    calculateCurrentStreak,
    calculateLongestStreak,
    totalCompletedTasks,
    totalPomodoros,
    totalFocusedHours,
    goalStats,
    completionByDayOfWeek,
    completionByPriority,
    tagAnalytics,
    topPomodoroTasks,
    overallCompletionRate,
  };
}
