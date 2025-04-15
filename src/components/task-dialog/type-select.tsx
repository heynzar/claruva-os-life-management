"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import type { Task } from "@/stores/useTaskStore";
import { CircleCheckBig, Target } from "lucide-react";

interface TypeSelectProps {
  newType: Task["type"];
  setNewType: Dispatch<SetStateAction<Task["type"]>>;
  setTimeFrameKey: Dispatch<SetStateAction<string | undefined>>;
}

const TypeSelect = ({
  newType,
  setNewType,
  setTimeFrameKey,
}: TypeSelectProps) => {
  return (
    <Select
      value={newType}
      onValueChange={(value) => {
        const taskType = value as Task["type"];
        setNewType(taskType);

        // Reset timeFrameKey when changing type
        if (taskType === "life") {
          setTimeFrameKey("life");
        } else if (taskType !== "daily") {
          // For other goal types, initialize with current date-based timeFrameKey
          const now = new Date();
          if (taskType === "yearly") {
            setTimeFrameKey(now.getFullYear().toString());
          } else if (taskType === "monthly") {
            const month = (now.getMonth() + 1).toString().padStart(2, "0");
            setTimeFrameKey(`${now.getFullYear()}-${month}`);
          } else if (taskType === "weekly") {
            // This is a simplified approach - a proper implementation would calculate the ISO week
            const week = Math.ceil(now.getDate() / 7)
              .toString()
              .padStart(2, "0");
            setTimeFrameKey(`${now.getFullYear()}-W${week}`);
          }
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select task type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="daily">
          <div className="flex items-center gap-2">
            <CircleCheckBig className="h-4 w-4" />
            <span>Daily Task</span>
          </div>
        </SelectItem>
        <SelectItem value="weekly">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Weekly Goal</span>
          </div>
        </SelectItem>
        <SelectItem value="monthly">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Monthly Goal</span>
          </div>
        </SelectItem>
        <SelectItem value="yearly">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Yearly Goal</span>
          </div>
        </SelectItem>
        <SelectItem value="life">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Life Goal</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default TypeSelect;
