import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartPie } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type PriorityData = {
  name: string;
  rate: number;
  completed: number;
  total: number;
  color: string;
};

export function PriorityDonutChart({ data }: { data: PriorityData[] }) {
  // Calculate total points and average rate
  const totalCompleted = useMemo(() => {
    return data.reduce((sum, item) => sum + item.completed, 0);
  }, [data]);

  return (
    <Card className="rounded">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center gap-2">
          <ChartPie className="size-4 text-muted-foreground" />
          <CardTitle>Productivity by Priority</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={{
            rate: {
              label: "Completion Rate",
              color: "var(--primary)",
            },
          }}
        >
          <PieChart>
            <Tooltip content={<ChartTooltipContent />} />
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
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-semibold"
                        >
                          {totalCompleted.toLocaleString()}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground"
                        >
                          Completed
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
