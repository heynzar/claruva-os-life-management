import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Label,
  ResponsiveContainer,
  TooltipProps,
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
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

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

    // Find data for each priority level
    const highPriorityData = data.find((item) => item.name === "High");
    const mediumPriorityData = data.find((item) => item.name === "Medium");
    const lowPriorityData = data.find((item) => item.name === "Low");

    // Calculate stats for each level
    const highPriorityRate = highPriorityData?.rate || 0;
    const highPriorityTotal = highPriorityData?.total || 0;
    const highPriorityCompleted = highPriorityData?.completed || 0;

    const mediumPriorityRate = mediumPriorityData?.rate || 0;
    const mediumPriorityTotal = mediumPriorityData?.total || 0;

    const lowPriorityRate = lowPriorityData?.rate || 0;
    const lowPriorityTotal = lowPriorityData?.total || 0;

    // Find lowest completion rate among priorities with tasks
    const prioritiesWithTasks = data.filter((item) => item.total > 0);
    const lowestRatePriority =
      prioritiesWithTasks.length > 0
        ? prioritiesWithTasks.reduce(
            (lowest, current) =>
              current.rate < lowest.rate ? current : lowest,
            prioritiesWithTasks[0]
          )
        : null;

    // Calculate imbalance between high and low priorities
    const highLowImbalance =
      highPriorityTotal > 0 && lowPriorityTotal > 0
        ? lowPriorityRate - highPriorityRate
        : 0;

    return {
      totalTasks,
      totalCompleted,
      totalRate,
      highPriorityRate,
      highPriorityTotal,
      highPriorityCompleted,
      mediumPriorityRate,
      mediumPriorityTotal,
      lowPriorityRate,
      lowPriorityTotal,
      lowestRatePriority,
      highLowImbalance,
      hasData: totalTasks > 0,
    };
  }, [data]);

  const description = useMemo(() => {
    // When there's no data
    if (!stats.hasData) {
      return "Add your first task to start tracking productivity across priority levels.";
    }

    // When there are no high priority tasks
    if (stats.highPriorityTotal === 0) {
      return "Missing high priority tasks. Identify and add your most important work to balance your priorities.";
    }

    // Focus on the lowest performing priority
    if (stats.lowestRatePriority) {
      const priorityName = stats.lowestRatePriority.name;
      const rate = Math.round(stats.lowestRatePriority.rate);

      if (priorityName === "High" && rate < 60) {
        return `Critical weakness: Only ${rate}% completion on high priority tasks. Focus here first to improve overall productivity.`;
      } else if (priorityName === "High") {
        return `Your high priority completion rate (${rate}%) needs improvement. These tasks should be your primary focus.`;
      } else if (rate < 40) {
        return `${priorityName} priority tasks have a low completion rate (${rate}%). Consider why these tasks are being neglected.`;
      }
    }

    // High-low priority imbalance issue
    if (stats.highLowImbalance > 20) {
      return `You're completing low priority tasks at a higher rate than high priority ones (${Math.round(
        stats.highLowImbalance
      )}% difference). Re-evaluate your task selection strategy.`;
    }

    // Specific feedback for high priority tasks
    if (stats.highPriorityRate < 50) {
      return `Your high priority task completion (${Math.round(
        stats.highPriorityRate
      )}%) is too low. Block time specifically for these critical tasks.`;
    } else if (stats.highPriorityRate < 75) {
      return `Aim to improve your high priority completion rate from ${Math.round(
        stats.highPriorityRate
      )}% to at least 75%. Try tackling them earlier in the day.`;
    } else if (
      stats.highPriorityTotal < stats.totalTasks * 0.2 &&
      stats.totalTasks > 5
    ) {
      return "You're handling high priorities well, but they make up a small portion of your workload. Ensure you're properly categorizing important work.";
    } else {
      return "Good high priority completion. For better productivity, make sure your high priority tasks align with your most important goals.";
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
  }: TooltipProps<ValueType, NameType>) => {
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
    <Card className="rounded gap-4 pb-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ChartPie className="size-4 text-muted-foreground" />
          <CardTitle>Priority Effectiveness</CardTitle>
        </div>
        <CardDescription>
          Identify issues in your priority execution
        </CardDescription>
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
                    innerRadius={60}
                    outerRadius={90}
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
              <div className="mt-4 text-muted-foreground flex items-start gap-2 border-t">
                <span className="p-4 pr-0 mt-1">
                  <Sparkles className="size-4" />
                </span>
                <p className="p-4 pl-0 text-sm">{description}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
