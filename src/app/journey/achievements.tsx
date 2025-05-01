import { Trophy } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Achievement = {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progress: number;
  icon: React.ElementType;
};

interface AchievementsCardProps {
  achievements: Achievement[];
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  return (
    <Card className="rounded">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Your Achievements</CardTitle>
        </div>
        <CardDescription>Milestones and accomplishments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={cn(
                "overflow-hidden p-2 gap-2 transition-all rounded ",
                achievement.achieved ? "bg-primary/10" : "opacity-70"
              )}
            >
              <CardHeader className="p-4 pb-2 border">
                <div className="flex flex-col justify-center items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-full",
                      achievement.achieved ? "bg-primary/20" : "bg-muted"
                    )}
                  >
                    <achievement.icon
                      strokeWidth={1}
                      className={cn(
                        "size-12",
                        achievement.achieved
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <CardTitle className="text-sm">{achievement.title}</CardTitle>
                  <CardDescription className="text-xs mb-2">
                    {achievement.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Progress value={achievement.progress} className="h-1.5" />
                  <span className="text-xs text-right  text-muted-foreground">
                    {achievement.progress.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
