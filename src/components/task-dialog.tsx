"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  Trash2,
  Tag,
  Flame,
  Plus,
  X,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Flag,
} from "lucide-react";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import RepeatPopover from "./repeat-popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "./ui/separator";

interface TaskDialogProps {
  id: string;
  name: string;
  description?: string;
  type: Task["type"];
  dueDate?: string;
  timeFrameKey?: string;
  tags?: string[];
  priority: "low" | "medium" | "high";
  isCompleted?: boolean;
  repeatedDays?: string[];
  pomodoros?: number;
  onUpdate: (updates: Partial<Task>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function TaskDialog({
  id,
  name,
  description = "",
  type = "daily",
  dueDate,
  timeFrameKey,
  tags = [],
  priority,
  isCompleted = false,
  repeatedDays = [],
  pomodoros = 0,
  onUpdate,
  open,
  onOpenChange,
}: TaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newDescription, setNewDescription] = useState(description);
  const [newType, setNewType] = useState<Task["type"]>(type);
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(
    dueDate ? parseISO(dueDate) : undefined
  );
  const [newTimeFrameKey, setNewTimeFrameKey] = useState(timeFrameKey);
  const [newTags, setNewTags] = useState<string[]>(tags);
  const [newTagInput, setNewTagInput] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">(
    priority
  );
  const [newRepeatedDays, setNewRepeatedDays] = useState<string[]>(
    repeatedDays || []
  );
  const [newPomodoros, setNewPomodoros] = useState(pomodoros);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { deleteTask } = useTaskStore();

  // Handle external control of dialog open state
  useEffect(() => {
    if (open !== undefined) {
      setInternalOpen(open);
    }
  }, [open]);

  // Controlled open state (internal or external)
  const isOpen = open !== undefined ? open : internalOpen;

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }

    // Reset form when dialog opens
    if (newOpen) {
      setNewName(name);
      setNewDescription(description);
      setNewType(type);
      setNewDueDate(dueDate ? parseISO(dueDate) : undefined);
      setNewTimeFrameKey(timeFrameKey);
      setNewTags(tags);
      setNewTagInput("");
      setNewPriority(priority);
      setNewRepeatedDays(repeatedDays || []);
      setNewPomodoros(pomodoros);
    }
  };

  const handleSave = () => {
    onUpdate({
      name: newName,
      description: newDescription,
      type: newType,
      dueDate: newDueDate ? format(newDueDate, "yyyy-MM-dd") : undefined,
      timeFrameKey: newTimeFrameKey,
      tags: newTags,
      priority: newPriority,
      repeatedDays: newRepeatedDays,
      pomodoros: newPomodoros,
    });
    handleOpenChange(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleDeleteClick = () => {
    // If it's a repetitive task, show confirmation dialog
    if (newRepeatedDays.length > 0) {
      setShowDeleteConfirmation(true);
    } else {
      // Otherwise delete immediately
      deleteTask(id);
      handleOpenChange(false);
    }
  };

  const handleConfirmDelete = () => {
    deleteTask(id);
    setShowDeleteConfirmation(false);
    handleOpenChange(false);
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
      setNewTags([...newTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const increasePomodoroCount = () => {
    setNewPomodoros((prev) => (prev || 0) + 1);
  };

  const decreasePomodoroCount = () => {
    setNewPomodoros((prev) => Math.max((prev || 0) - 1, 0));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-2 gap-2">
          <DialogTitle className="sr-only">Edit Task - {name}</DialogTitle>

          {/* Task Name Input */}
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Task name"
            className="h-12 text-lg"
            onKeyDown={handleKeyDown}
          />

          {/* Description Input */}
          <Textarea
            value={newDescription || ""}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description"
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              // Allow line breaks with Shift+Enter
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />

          <Separator className="my-2" />

          {/* Date and Repeat Controls - Only for daily tasks */}
          {newType === "daily" && (
            <div className="grid grid-cols-2 gap-2">
              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2 opacity-70" />
                    {newDueDate ? format(newDueDate, "MMM d, yyyy") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Repeat Options */}
              <RepeatPopover
                repeatedDays={newRepeatedDays}
                onRepeatedDaysChange={setNewRepeatedDays}
              />
            </div>
          )}

          {/* Priority Selector */}
          <div className="flex items-center gap-1">
            <Label className="sr-only">Priority</Label>
            <Select
              value={newPriority}
              onValueChange={(value: string) =>
                setNewPriority(value as "low" | "medium" | "high")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <Flag className="text-blue-400" />
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

            {/* Tags Input */}

            <Label className="sr-only">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex w-full gap-2 items-center">
              <Input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={handleTagInputKeyDown}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddTag}
                disabled={!newTagInput.trim()}
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Pomodoro Count */}
          <div className="flex items-center gap-2">
            <Label className="sr-only">Pomodoros</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={decreasePomodoroCount}
                disabled={!newPomodoros}
              >
                -
              </Button>
              <span className="w-14 text-center">🍅 {newPomodoros}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={increasePomodoroCount}
              >
                +
              </Button>
            </div>

            {/* Task Type */}

            <Label className="sr-only">Task Type</Label>
            <Select
              value={newType}
              onValueChange={(value) => setNewType(value as Task["type"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Task</SelectItem>
                <SelectItem value="weekly">Weekly Goal</SelectItem>
                <SelectItem value="monthly">Monthly Goal</SelectItem>
                <SelectItem value="yearly">Yearly Goal</SelectItem>
                <SelectItem value="life">Life Goal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between border-t border-muted pt-4 mt-2">
            <Button
              variant="outline"
              onClick={handleDeleteClick}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Button>

            <div className="space-x-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Recurring Task"
        description={`Are you sure you want to delete "${name}"? This will remove the task and all its tracking data across all days.`}
      />
    </>
  );
}
