import { useMemo } from "react";
import { Info, Box, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip as ChartTooltip,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export interface TagData {
  subject: string;
  usage: number;
  productivity: number;
}

export default function TagsChart({ data }: { data: TagData[] }) {
  const chartConfig = {
    usage: {
      label: "Usage",
      color: "var(--chart-2)",
    },
    productivity: {
      label: "Productivity",
      color: "var(--primary)",
    },
  };

  // Calculate tag insights
  const insights = useMemo(() => {
    // Check if we have data
    const hasData = data && data.length > 0;

    if (!hasData) {
      return {
        hasData: false,
        topTags: [],
        mostProductiveTag: null,
        message:
          "Add tags to your tasks to see patterns across different categories.",
      };
    }

    // Find the most productive tag (with at least 2 usage count)
    const significantTags = data.filter((tag) => tag.usage >= 2);
    const mostProductiveTag =
      significantTags.length > 0
        ? [...significantTags].sort(
            (a, b) => b.productivity - a.productivity
          )[0]
        : null;

    // Find the least productive tag (with at least 2 usage count)
    const leastProductiveTag =
      significantTags.length > 0
        ? [...significantTags].sort(
            (a, b) => a.productivity - b.productivity
          )[0]
        : null;

    // Find the most used tag
    const mostUsedTag = [...data].sort((a, b) => b.usage - a.usage)[0];

    // Get top 3 tags by usage
    const topTags = [...data].sort((a, b) => b.usage - a.usage).slice(0, 3);

    // Calculate average productivity across all tags
    const avgProductivity =
      data.reduce((sum, tag) => sum + tag.productivity, 0) / data.length;

    // Find tags with below average productivity
    const lowProductivityTags = data.filter(
      (tag) => tag.productivity < avgProductivity && tag.usage >= 2
    );

    // Find highest usage tag with low productivity
    const highUseLowProductivityTag = [...data]
      .filter((tag) => tag.productivity < avgProductivity - 10)
      .sort((a, b) => b.usage - a.usage)[0];

    // Generate insight message focusing on improvement areas
    let message;
    if (highUseLowProductivityTag) {
      message = `Your "${
        highUseLowProductivityTag.subject
      }" tasks show low completion rates (${Math.round(
        highUseLowProductivityTag.productivity
      )}%) despite frequent use. Consider breaking these down into smaller tasks.`;
    } else if (leastProductiveTag && leastProductiveTag.usage >= 3) {
      message = `You're struggling with "${
        leastProductiveTag.subject
      }" tasks (${Math.round(
        leastProductiveTag.productivity
      )}% completion). Try tackling these earlier in the day or breaking them into smaller steps.`;
    } else if (lowProductivityTags.length > 0) {
      const tagNames = lowProductivityTags
        .slice(0, 2)
        .map((t) => `"${t.subject}"`)
        .join(" and ");
      message = `Your ${tagNames} categories show below-average completion rates. Consider reviewing your approach to these task types.`;
    } else {
      message =
        "Your productivity is balanced across tags. For further improvement, try adding more specific tags to identify potential weak areas.";
    }

    return {
      hasData: true,
      topTags,
      mostProductiveTag,
      leastProductiveTag,
      mostUsedTag,
      highUseLowProductivityTag,
      message,
    };
  }, [data]);

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <Info className="h-12 w-12 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">No tag data yet</h3>
      <p className="text-muted-foreground mt-1">
        Add tags to your tasks to analyze productivity patterns by category
      </p>
    </div>
  );

  return (
    <Card className="rounded gap-4 pb-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Box className="size-4 text-muted-foreground" />
          <CardTitle>Tags Analysis</CardTitle>
        </div>
        <CardDescription>
          Identify improvement areas in your system
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {!insights.hasData ? (
          <EmptyState />
        ) : (
          <>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer
                className="scale-110 mt-2"
                width="100%"
                height={280}
              >
                <RadarChart data={data}>
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <PolarGrid gridType="circle" />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar
                    name="Rate"
                    dataKey="productivity"
                    stroke="var(--color-productivity)"
                    fill="var(--color-productivity)"
                    fillOpacity={0.3}
                    dot={{
                      r: 4,
                      fillOpacity: 1,
                    }}
                  />
                  <Radar
                    name="Usage"
                    dataKey="usage"
                    stroke="var(--color-usage)"
                    fill="var(--color-usage)"
                    fillOpacity={0.3}
                    dot={{
                      r: 4,
                      fillOpacity: 1,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Insights section */}
            {insights.hasData && (
              <div className="mt-4 text-muted-foreground flex items-start gap-2 border-t">
                <span className="p-4 pr-0 mt-1">
                  <Sparkles className="size-4" />
                </span>
                <p className="p-4 pl-0 text-sm">{insights.message}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
