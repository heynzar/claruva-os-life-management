"use client";
import {
  Target,
  Flame,
  Settings2,
  HistoryIcon,
  CheckCircle,
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
import { usePomodoroSettings } from "@/hooks/use-pomodoro-settings";
import { useTaskAnalytics } from "@/hooks/use-task-analytics";
import { useAchievements } from "@/hooks/use-achievements";

import { PriorityDonutChart } from "./priority-chart";
import { ProductivityByDayChart } from "./days-chart";
import { PomodoroInsightsChart } from "./pomodoro-chart";
import HabitsTable from "./habits-table";
import ActivityHeatmap from "./heatmap";
import TagsChart from "./tags-chart";
import { AchievementsCard } from "./achievements";

export default function JourneyPage() {
  const { pomodoroSettings } = usePomodoroSettings();
  const { tasks } = useTaskStore();
  const { tags } = useTagsStore();

  const {
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
  } = useTaskAnalytics({ tasks, tags, pomodoroSettings });

  const { achievements } = useAchievements({
    calculateLongestStreak,
    goalStats,
    totalPomodoros,
  });

  const kpiCards = [
    {
      title: "Completed Tasks",
      icon: CheckCircle,
      description: `Completion rate: ${Math.round(overallCompletionRate)}%`,
      content: `${totalCompletedTasks} Tasks`,
    },
    {
      title: "Total Pomodoros",
      icon: HistoryIcon,
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
    <div className="flex flex-col h-screen">
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
                  <div>
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
          <TagsChart data={tagAnalytics} />
          <PriorityDonutChart data={completionByPriority} />
          <ProductivityByDayChart data={completionByDayOfWeek} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-2">
          <div className="lg:col-span-1 h-full">
            <PomodoroInsightsChart
              topPomodoroTasks={topPomodoroTasks}
              totalFocusedHours={totalFocusedHours}
              pomodoroSettings={pomodoroSettings}
            />
          </div>
          <div className="lg:col-span-2 h-full">
            <HabitsTable />
          </div>
        </div>

        <AchievementsCard achievements={achievements} />
      </main>
    </div>
  );
}
