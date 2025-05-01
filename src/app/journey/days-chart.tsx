import { useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { CalendarDays, Info, Sparkles } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

type DayOfWeekData = {
  name: string;
  shortName: string;
  rate: number;
  completed: number;
  total: number;
};

const CustomDayTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const day: DayOfWeekData = payload[0].payload;

    return (
      <div className="bg-background w-36 border rounded-lg p-2.5 shadow-sm text-xs">
        <p className="font-medium mb-1">{day.name}</p>
        <div className="text-muted-foreground flex items-center justify-between">
          <p className="flex items-center gap-1">
            <span className="bg-primary size-3 rounded" />
            <span>Rate</span>
          </p>
          <span> {Math.round(day.rate)}%</span>
        </div>
      </div>
    );
  }

  return null;
};

export function ProductivityByDayChart({ data }: { data: DayOfWeekData[] }) {
  // Calculate stats for smart insights - this doesn't duplicate parent logic
  // It just derives additional insights from the already calculated data
  const stats = useMemo(() => {
    const hasData = data.some((day) => day.total > 0);

    if (!hasData) {
      return {
        hasData: false,
        averageRate: 0,
        bestDay: null,
        worstDay: null,
      };
    }

    // Get days with data
    const daysWithData = data.filter((day) => day.total > 0);

    // Calculate average rate
    const totalRate = daysWithData.reduce((sum, day) => sum + day.rate, 0);
    const averageRate =
      daysWithData.length > 0 ? totalRate / daysWithData.length : 0;

    // Find best day (for insights only)
    const bestDay = [...daysWithData].sort((a, b) => b.rate - a.rate)[0];
    const worstDay = [...daysWithData].sort((a, b) => a.rate - b.rate)[0];

    return {
      hasData,
      averageRate,
      bestDay,
      worstDay,
    };
  }, [data]);

  // Generate smart insights
  const insights = useMemo(() => {
    if (!stats.hasData) {
      return "Complete tasks to see productivity patterns by day.";
    }

    if (stats.bestDay && stats.worstDay) {
      if (stats.bestDay.rate - stats.worstDay.rate > 30) {
        return `Most productive: ${stats.bestDay.name} (${Math.round(
          stats.bestDay.rate
        )}%). Consider balancing your weekly schedule.`;
      } else if (stats.averageRate < 50) {
        return `Weekly avg: ${Math.round(
          stats.averageRate
        )}%. Focus on consistent productivity.`;
      } else {
        return `Great job! ${
          stats.bestDay.name
        } is your most productive day (${Math.round(stats.bestDay.rate)}%).`;
      }
    }

    return "Complete more tasks for productivity insights.";
  }, [stats]);

  // Chart content to display when there's no data
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <Info strokeWidth={1} className="h-12 w-12 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">No daily productivity data yet</h3>
      <p className="text-muted-foreground mt-1">
        Complete tasks throughout the week to see your productivity patterns
      </p>
    </div>
  );

  return (
    <Card className="rounded gap-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Productivity by Day of Week</CardTitle>
        </div>
        <CardDescription>Completion rates by weekday</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {!stats.hasData ? (
          <EmptyState />
        ) : (
          <>
            <ChartContainer
              config={{
                rate: {
                  label: "Rate",
                  color: "var(--primary)",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
                >
                  <XAxis dataKey="shortName" />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomDayTooltip />} />

                  <ReferenceLine
                    y={stats.averageRate}
                    stroke="#888"
                    strokeDasharray="3 3"
                  />
                  <Bar
                    dataKey="rate"
                    fill="var(--color-rate)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Productivity insights */}
            {stats.hasData && (
              <div className="px-6 py-4 mt-4 text-sm text-muted-foreground flex items-start gap-2 border-t">
                <Sparkles />
                <p>{insights}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
