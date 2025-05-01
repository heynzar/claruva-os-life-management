import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Label,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { ChartPie, Info, Sparkles } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";

type PriorityData = {
  name: string;
  rate: number;
  completed: number;
  total: number;
  color: string;
};

export function PriorityDonutChart({ data }: { data: PriorityData[] }) {
  const stats = useMemo(() => {
    const totalTasks = data.reduce((sum, item) => sum + item.total, 0);
    const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
    const totalRate =
      totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    const highPriorityData = data.find((item) => item.name === "High");
    const highPriorityRate = highPriorityData?.rate || 0;
    const highPriorityTotal = highPriorityData?.total || 0;
    const highPriorityCompleted = highPriorityData?.completed || 0;

    return {
      totalTasks,
      totalCompleted,
      totalRate,
      highPriorityRate,
      highPriorityTotal,
      highPriorityCompleted,
      hasData: totalTasks > 0,
    };
  }, [data]);

  const description = useMemo(() => {
    if (!stats.hasData) {
      return "Add your first task to start tracking productivity across priority levels.";
    }

    if (stats.highPriorityTotal === 0) {
      return "Consider adding high priority tasks to focus on what matters most.";
    }

    if (stats.highPriorityRate < 50) {
      return "Focus on completing high priority tasks to improve your productivity.";
    } else if (stats.highPriorityRate < 80) {
      return "Good progress on high priority tasks. Keep focusing on what matters most.";
    } else {
      return "Excellent job completing high priority tasks! You're focusing on what matters.";
    }
  }, [stats]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <Info strokeWidth={1} className="size-12 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">No task data yet</h3>
      <p className="text-muted-foreground mt-1">
        Add tasks with different priorities to see your productivity breakdown
      </p>
    </div>
  );

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (active && payload && payload.length > 0) {
      const item: PriorityData = payload[0].payload;
      return (
        <div className="bg-background w-36 border rounded-lg p-2.5 shadow-sm text-xs">
          <div className="font-medium flex items-center gap-1 mb-1">
            <div
              className="size-3 rounded"
              style={{ backgroundColor: item.color }}
            ></div>
            <span>{item.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rate:</span>
            <span>{Math.round(item.rate)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Completed:</span>
            <span>
              {item.completed}/{item.total}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="rounded gap-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ChartPie className="size-4 text-muted-foreground" />
          <CardTitle>Productivity by Priority</CardTitle>
        </div>
        <CardDescription>Completion rates per priority level</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {!stats.hasData ? (
          <EmptyState />
        ) : (
          <>
            <ChartContainer
              config={{
                rate: {
                  label: "Completion Rate",
                  color: "var(--primary)",
                },
              }}
            >
              <ResponsiveContainer width="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    dataKey="rate"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          const cx = Number(viewBox.cx);
                          const cy = Number(viewBox.cy);
                          return (
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={cx}
                                y={cy - 5}
                                className="fill-foreground text-4xl font-semibold"
                              >
                                {stats.totalRate}%
                              </tspan>
                              <tspan
                                x={cx}
                                y={cy + 22}
                                className="fill-muted-foreground text-sm"
                              >
                                Overall
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            {stats.hasData && (
              <div className="px-6 py-4 mt-4 text-sm text-muted-foreground flex items-start gap-2 border-t">
                <Sparkles />
                <p>{description}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
