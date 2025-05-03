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
  TooltipProps,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

type DayOfWeekData = {
  name: string;
  shortName: string;
  rate: number;
  completed: number;
  total: number;
};

const CustomDayTooltip = ({
  active,
  payload,
}: TooltipProps<ValueType, NameType>) => {
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
        <div className="flex items-center justify-between mt-1">
          <span className="text-muted-foreground">Tasks:</span>
          <span>
            {day.completed}/{day.total}
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export function ProductivityByDayChart({ data }: { data: DayOfWeekData[] }) {
  // Calculate stats for insights with focus on weaknesses
  const stats = useMemo(() => {
    const hasData = data.some((day) => day.total > 0);

    if (!hasData) {
      return {
        hasData: false,
        averageRate: 0,
        bestDay: null,
        worstDay: null,
        weekdayAvg: 0,
        weekendAvg: 0,
        consistencyScore: 0,
        weakDays: [],
        strongWeakGap: 0,
        midweekSlump: false,
        endWeekCrash: false,
      };
    }

    // Get days with data
    const daysWithData = data.filter((day) => day.total > 0);

    // Calculate average rate
    const totalRate = daysWithData.reduce((sum, day) => sum + day.rate, 0);
    const averageRate =
      daysWithData.length > 0 ? totalRate / daysWithData.length : 0;

    // Find best and worst days
    const sortedDays = [...daysWithData].sort((a, b) => b.rate - a.rate);
    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    // Calculate weekday vs weekend averages
    const weekdays = daysWithData.filter((day) =>
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(
        day.name
      )
    );
    const weekends = daysWithData.filter((day) =>
      ["Saturday", "Sunday"].includes(day.name)
    );

    const weekdayAvg =
      weekdays.length > 0
        ? weekdays.reduce((sum, day) => sum + day.rate, 0) / weekdays.length
        : 0;

    const weekendAvg =
      weekends.length > 0
        ? weekends.reduce((sum, day) => sum + day.rate, 0) / weekends.length
        : 0;

    // Calculate weak days (significantly below average)
    const weakDays = daysWithData.filter(
      (day) => day.rate < averageRate - 15 && day.total >= 2
    );

    // Calculate strong-weak gap (difference between best and worst days)
    const strongWeakGap =
      bestDay && worstDay ? bestDay.rate - worstDay.rate : 0;

    // Check for midweek slump pattern (Wed/Thu significantly lower than Mon/Tue)
    const monday = data.find((d) => d.name === "Monday");
    const tuesday = data.find((d) => d.name === "Tuesday");
    const wednesday = data.find((d) => d.name === "Wednesday");
    const thursday = data.find((d) => d.name === "Thursday");

    const earlyWeekAvg = (monday?.rate || 0) + (tuesday?.rate || 0);
    const midWeekAvg = (wednesday?.rate || 0) + (thursday?.rate || 0);

    const midweekSlump =
      earlyWeekAvg > 0 && midWeekAvg > 0 && midWeekAvg < earlyWeekAvg - 30;

    // Check for end-week crash (Friday significantly lower than week average)
    const friday = data.find((d) => d.name === "Friday");
    const endWeekCrash = friday?.rate
      ? friday.rate < weekdayAvg - 20 && friday.total >= 2
      : false;

    // Calculate consistency score (lower standard deviation = higher consistency)
    const variance =
      daysWithData.reduce(
        (sum, day) => sum + Math.pow(day.rate - averageRate, 2),
        0
      ) / daysWithData.length;
    const standardDeviation = Math.sqrt(variance);
    // Convert to 0-100 scale, where 100 means perfect consistency
    const consistencyScore = Math.max(0, 100 - standardDeviation * 1.5);

    return {
      hasData,
      averageRate,
      bestDay,
      worstDay,
      weekdayAvg,
      weekendAvg,
      weakDays,
      strongWeakGap,
      midweekSlump,
      endWeekCrash,
      consistencyScore,
    };
  }, [data]);

  // Generate insights focused on weaknesses
  const insights = useMemo(() => {
    if (!stats.hasData) {
      return "Complete tasks to see productivity patterns by day.";
    }

    // Identify pattern-based issues
    if (stats.midweekSlump) {
      return `Midweek productivity drop detected. Your Wednesday/Thursday rates are significantly lower than early week. Consider restructuring your week to maintain momentum.`;
    }

    if (stats.endWeekCrash && stats.worstDay?.name === "Friday") {
      return `Friday productivity crash: ${Math.round(
        stats.worstDay.rate
      )}% completion rate. Consider moving critical tasks to earlier in the week or implementing "Focus Friday" techniques.`;
    }

    // High inconsistency issue
    if (stats.consistencyScore < 40 && stats.strongWeakGap > 40) {
      return `Significant day-to-day inconsistency detected. Your best day (${
        stats.bestDay?.name
      }) is ${Math.round(
        stats.strongWeakGap
      )}% more productive than your worst (${
        stats.worstDay?.name
      }). Work on creating consistent daily routines.`;
    }

    // Weekend/weekday imbalance
    if (stats.weekdayAvg > 0 && stats.weekendAvg > 0) {
      if (stats.weekendAvg > stats.weekdayAvg + 20) {
        return `Weekend-heavy work pattern: ${Math.round(
          stats.weekendAvg
        )}% vs ${Math.round(
          stats.weekdayAvg
        )}% on weekdays. Consider better distributing your workload to avoid burnout.`;
      } else if (
        stats.weekendAvg < stats.weekdayAvg - 40 &&
        stats.weekendAvg > 0
      ) {
        return `Weekend productivity drop: ${Math.round(
          stats.weekendAvg
        )}% vs ${Math.round(
          stats.weekdayAvg
        )}% on weekdays. If weekend work is necessary, develop specific strategies for these days.`;
      }
    }

    // Focus on specific weak days
    if (stats.weakDays.length > 0) {
      const weakDayNames = stats.weakDays.map((d) => d.name).join(" and ");
      return `Low productivity on ${weakDayNames} (${Math.round(
        stats.weakDays[0].rate
      )}%). Identify what makes these days difficult and adjust your workflow or schedule accordingly.`;
    }

    // Overall rate too low
    if (stats.averageRate < 50) {
      return `Overall weak weekly performance: ${Math.round(
        stats.averageRate
      )}% average completion rate. Focus on improving your daily task planning and setting more realistic goals.`;
    }

    // Fallback when no specific issue is identified but can still improve
    return `Your least productive day is ${stats.worstDay?.name} (${Math.round(
      stats.worstDay?.rate || 0
    )}%). Consider what factors affect your performance on this day and make targeted adjustments.`;
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
    <Card className="rounded gap-4 pb-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Weekly Performance Gaps</CardTitle>
        </div>
        <CardDescription>
          Identify low-performing days in your week
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
              <div className="mt-4 text-muted-foreground flex items-start gap-2 border-t">
                <span className="p-4 pr-0 mt-1">
                  <Sparkles className="size-4" />
                </span>
                <p className="p-4 pl-0 text-sm">{insights}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
