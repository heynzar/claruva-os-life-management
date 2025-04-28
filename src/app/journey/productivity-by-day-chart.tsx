import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type DayOfWeekData = {
  name: string;
  shortName: string;
  rate: number;
  completed: number;
  total: number;
};

export function ProductivityByDayChart({ data }: { data: DayOfWeekData[] }) {
  return (
    <Card className="rounded">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Productivity by Day of Week</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer
          config={{
            rate: {
              label: "Completion Rate",
              color: "var(--primary)",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, bottom: 5, left: 0 }}
            >
              <XAxis dataKey="shortName" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="rate"
                fill="var(--color-rate)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
