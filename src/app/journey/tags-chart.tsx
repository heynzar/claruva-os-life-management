import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip as ChartTooltip,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// Type definitions
export interface TagData {
  subject: string;
  usage: number;
  productivity: number;
  [key: string]: string | number; // For potential additional metrics
}

export interface TagsChartProps {
  /** Array of tag data to display */
  data: TagData[];
  /** Chart title */
  title?: string;
  /** Primary metric name (default: "usage") */
  usage?: string;
  /** Secondary metric name (default: "productivity") */
  secondaryMetric?: string;
  /** Custom color for primary metric */
  primaryColor?: string;
  /** Custom color for secondary metric */
  secondaryColor?: string;
  /** Height of the chart container in pixels */
  height?: number | string;
}

export default function TagsChart({ data, height = 300 }: TagsChartProps) {
  const chartConfig = {
    usage: {
      label: "Usage",
      color: "var(--chart-1)",
    },
    productivity: {
      label: "Productivity",
      color: "var(--chart-2)",
    },
  };

  return (
    <Card className="rounded">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Tags Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer
            className="scale-110"
            width="100%"
            height={height}
          >
            <RadarChart data={data}>
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarGrid gridType="circle" />
              <PolarAngleAxis dataKey="subject" />
              <Radar
                name="Productivity"
                dataKey="productivity"
                stroke="var(--color--usage)"
                fill="var(--color--usage)"
                fillOpacity={0.3}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                }}
              />
              <Radar
                name="Usage"
                dataKey="usage"
                stroke="var(--color-productivity)"
                fill="var(--color-productivity)"
                fillOpacity={0.6}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
