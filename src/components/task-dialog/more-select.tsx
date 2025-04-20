import { Ellipsis } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface MoreSelectProps {
  newPomodoros: number;
  increasePomodoroCount: () => void;
  decreasePomodoroCount: () => void;
}

const MoreSelect = ({
  newPomodoros,
  increasePomodoroCount,
  decreasePomodoroCount,
}: MoreSelectProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-8">
          <Ellipsis className="size-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-max">
        <Label className="text-xs font-medium mb-1.5">Pomodoros</Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={decreasePomodoroCount}
            disabled={!newPomodoros}
          >
            -
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={increasePomodoroCount}
          >
            +
          </Button>
          <span className="w-14 text-center">🍅 {newPomodoros}</span>
        </div>

        <Separator className="my-2" />

        <Button variant="destructive" className="w-full">
          Delete
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default MoreSelect;
