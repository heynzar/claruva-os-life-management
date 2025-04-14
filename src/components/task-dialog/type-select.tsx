import { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { Task } from "@/stores/useTaskStore";
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
      onValueChange={(value) => setNewType(value as Task["type"])}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select task type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="daily">
          <CircleCheckBig className="" />
          Daily Task
        </SelectItem>
        <SelectItem value="weekly">
          <Target className="" />
          Weekly Goal
        </SelectItem>
        <SelectItem value="monthly">
          <Target className="" />
          Monthly Goal
        </SelectItem>
        <SelectItem value="yearly">
          <Target className="" />
          Yearly Goal
        </SelectItem>
        <SelectItem value="life" onClick={() => setTimeFrameKey("life")}>
          <Target className="" />
          Life Goal
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default TypeSelect;
