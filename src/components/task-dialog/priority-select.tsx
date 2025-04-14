import { Flag } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

interface PrioritySelectProps {
  newPriority: "low" | "medium" | "high";
  setNewPriority: Dispatch<SetStateAction<"low" | "medium" | "high">>;
}

const PrioritySelect = ({
  newPriority,
  setNewPriority,
}: PrioritySelectProps) => {
  return (
    <Select
      value={newPriority}
      onValueChange={(value: string) =>
        setNewPriority(value as "low" | "medium" | "high")
      }
    >
      <SelectTrigger className="!h-8 font-semibold">
        <SelectValue placeholder="Select priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">
          <Flag className="text-primary" />
          Low
        </SelectItem>
        <SelectItem value="medium">
          <Flag className="text-yellow-500" />
          Medium
        </SelectItem>
        <SelectItem value="high">
          <Flag className="text-red-500" />
          High
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default PrioritySelect;
