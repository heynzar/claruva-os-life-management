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
          <ResponsiveContainer className="scale-110" width="100%">
            <RadarChart data={data}>
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarGrid gridType="circle" />
              <PolarAngleAxis dataKey="subject" />
              <Radar
                name="Productivity"
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
