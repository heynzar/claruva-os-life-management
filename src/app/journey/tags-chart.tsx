import { useMemo } from "react";
import { Tag, Info, Sparkles, Box } from "lucide-react";
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
  Legend,
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

    // Find the most used tag
    const mostUsedTag = [...data].sort((a, b) => b.usage - a.usage)[0];

    // Get top 3 tags by usage
    const topTags = [...data].sort((a, b) => b.usage - a.usage).slice(0, 3);

    // Calculate average productivity across all tags
    const avgProductivity =
      data.reduce((sum, tag) => sum + tag.productivity, 0) / data.length;

    // Generate insight message
    let message;
    if (mostProductiveTag && mostUsedTag) {
      if (mostProductiveTag.subject === mostUsedTag.subject) {
        message = `Your most used tag "${
          mostProductiveTag.subject
        }" is also your most productive at ${Math.round(
          mostProductiveTag.productivity
        )}%.`;
      } else if (mostProductiveTag.productivity > avgProductivity + 20) {
        message = `"${
          mostProductiveTag.subject
        }" tasks have your highest completion rate (${Math.round(
          mostProductiveTag.productivity
        )}%). Consider using this tag more.`;
      } else {
        message = `You use "${
          mostUsedTag.subject
        }" most frequently with ${Math.round(
          avgProductivity
        )}% average completion across tags.`;
      }
    } else {
      message =
        "Add more tagged tasks to see meaningful productivity patterns.";
    }

    return {
      hasData: true,
      topTags,
      mostProductiveTag,
      mostUsedTag,
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
    <Card className="rounded gap-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Tags Analysis</CardTitle>
        </div>
        <CardDescription>Most used tags and productivity rate</CardDescription>
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
              <div className="px-6 py-4 mt-4 text-sm text-muted-foreground flex items-start gap-2 border-t">
                <Sparkles />
                <p>{insights.message}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
