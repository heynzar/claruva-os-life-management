"use client";

import { Clock } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/stores/useTaskStore";

type PomodoroSettings = {
  pomodoro: number;
  shortBreak: number;
};

type TaskWithPomodoro = {
  id: string;
  name: string;
  pomodoros?: number;
};

const chartConfig = {
  focus: {
    label: "Focus",
    color: "var(--primary)",
  },
  break: {
    label: "Break",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PomodoroInsightsChart({
  totalFocusedHours,
  pomodoroSettings,
  topPomodoroTasks,
}: {
  totalFocusedHours: number;
  pomodoroSettings: PomodoroSettings;
  topPomodoroTasks: Task[];
}) {
  const chartData = [
    {
      focus: pomodoroSettings.pomodoro,
      break: pomodoroSettings.shortBreak,
    },
  ];

  function formatMinutes(totalMinutes: number | undefined) {
    // Handle invalid input
    if (
      totalMinutes === undefined ||
      totalMinutes === null ||
      isNaN(totalMinutes)
    ) {
      return "0min";
    }

    // Handle negative values
    totalMinutes = Math.abs(totalMinutes);

    // Calculate hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format the result
    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  }

  return (
    <Card className="rounded w-full h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Pomodoro Insights
        </CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="relative flex flex-col flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="w-full scale-110 sm:scale-125 absolute top-4 sm:-top-28 lg:top-4 xl:top-0"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {Math.round(totalFocusedHours)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          Hours
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="focus"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-focus)"
            />
            <RadialBar
              dataKey="break"
              fill="var(--color-break)"
              stackId="a"
              cornerRadius={5}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm mt-36">
        <div className="w-full">
          <h4 className="text-sm font-medium mb-2">Top Tasks by Focus Time</h4>
          <div className="space-y-2">
            {topPomodoroTasks.length > 0 ? (
              topPomodoroTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                >
                  <span className="text-sm truncate max-w-[200px]">
                    {task.name}
                  </span>
                  <Badge variant="outline">
                    {formatMinutes(task.pomodoros)} 🍅
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm p-4">
                No pomodoro data available
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
