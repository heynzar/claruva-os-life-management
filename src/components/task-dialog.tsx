"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Repeat, Trash2 } from "lucide-react";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";
import RepeatPopover from "./repeat-popover";

// Days of the week for repeat options
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface TaskDialogProps {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  goalId?: string;
  isCompleted?: boolean;
  repeatedDays?: string[];
  pomodoros?: number;
  onUpdate: (updates: Partial<Task>) => void;
}

export default function TaskDialog({
  id,
  name,
  description = "",
  dueDate,
  goalId,
  isCompleted = false,
  repeatedDays = [],
  pomodoros = 0,
  onUpdate,
}: TaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newDescription, setNewDescription] = useState(description);
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(
    dueDate ? parseISO(dueDate) : undefined
  );
  const [newGoalId, setNewGoalId] = useState(goalId);
  const [newRepeatedDays, setNewRepeatedDays] =
    useState<string[]>(repeatedDays);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { deleteTask, goals } = useTaskStore();

  const handleSave = () => {
    onUpdate({
      name: newName,
      description: newDescription,
      dueDate: newDueDate ? format(newDueDate, "yyyy-MM-dd") : undefined,
      goalId: newGoalId,
      repeatedDays: newRepeatedDays,
    });
    setOpen(false);
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
    if (repeatedDays.length > 0) {
      setShowDeleteConfirmation(true);
    } else {
      // Otherwise delete immediately
      deleteTask(id);
      setOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    deleteTask(id);
    setShowDeleteConfirmation(false);
    setOpen(false);
  };

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setNewName(name);
      setNewDescription(description);
      setNewDueDate(dueDate ? parseISO(dueDate) : undefined);
      setNewGoalId(goalId);
      setNewRepeatedDays(repeatedDays);
    }
    setOpen(newOpen);
  };

  const toggleDay = (day: string) => {
    if (newRepeatedDays.includes(day)) {
      setNewRepeatedDays(newRepeatedDays.filter((d) => d !== day));
    } else {
      setNewRepeatedDays([...newRepeatedDays, day]);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            className={cn(
              "cursor-pointer text-start px-1 py-3 w-full h-full flex justify-between items-center",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            <span>{name}</span>
            {repeatedDays.length > 0 && (
              <Repeat className="size-4 mr-2 text-muted-foreground/50" />
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] p-2">
          <DialogTitle className="sr-only">Edit Task - {name}</DialogTitle>

          <div className="space-y-2">
            {/* Task Name Input */}
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Task name"
              className="h-12 !text-lg"
              onKeyDown={handleKeyDown}
            />

            {/* Description Input */}
            <Textarea
              value={newDescription}
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

            {/* Goal Select */}
            <Select value={newGoalId} onValueChange={setNewGoalId}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Select a Goal" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date and Repeat Controls */}
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

              {/* Repeat Options - Using the new component */}
              <RepeatPopover
                repeatedDays={newRepeatedDays}
                onRepeatedDaysChange={setNewRepeatedDays}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between border-t border-muted pt-2 mt-4">
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </Button>

              <div className="space-x-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="text-white">
                  Save
                </Button>
              </div>
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
