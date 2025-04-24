"use client";

import { useMemo } from "react";
import { Flame, Target, HistoryIcon, type LucideIcon } from "lucide-react";

type GoalStats = {
  total: number;
  completed: number;
  rate: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  achieved: boolean;
  progress: number;
};

type Props = {
  calculateLongestStreak: number;
  goalStats: GoalStats;
  totalPomodoros: number;
};

export function useAchievements({
  calculateLongestStreak,
  goalStats,
  totalPomodoros,
}: Props) {
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
        icon: HistoryIcon,
        achieved: totalPomodoros >= 100,
        progress: Math.min(totalPomodoros / 100, 1) * 100,
      },
      {
        id: "pomodoros-500",
        title: "500 Pomodoros",
        description: "Complete 500 pomodoro sessions",
        icon: HistoryIcon,
        achieved: totalPomodoros >= 500,
        progress: Math.min(totalPomodoros / 500, 1) * 100,
      },
    ];
  }, [calculateLongestStreak, goalStats.completed, totalPomodoros]);

  return {
    achievements,
  } as {
    achievements: Achievement[];
  };
}
