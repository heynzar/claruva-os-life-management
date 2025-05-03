"use client";
import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format, parseISO, getWeek } from "date-fns";
import { Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { Separator } from "@/components/ui/separator";
import DateSelect from "./date-select";
import PrioritySelect from "./priority-select";
import RepeatSelect from "./repeat-select";
import TagsSelect from "./tags-select";
import TypeSelect from "./type-select";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

interface TaskDialogProps {
  dialog_type?: "add" | "edit"; // add: to create a task | edit: to edit the task
  task?: Task; // For edit mode
  defaultType?: Task["type"]; // For add mode
  defaultDueDate?: string; // For add mode
  defaultTimeFrameKey?: string; // For add mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTaskCreated?: (task: Task) => void;
  preventInitialInput?: boolean; // New prop to prevent initial input
}

export default function TaskDialog({
  dialog_type = "edit",
  task,
  defaultType = "daily",
  defaultDueDate,
  defaultTimeFrameKey,
  open,
  onOpenChange,
  onTaskCreated,
  preventInitialInput = false,
}: TaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<Task["type"]>("daily");
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [newTimeFrameKey, setNewTimeFrameKey] = useState<string | undefined>(
    undefined
  );
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [newRepeatedDays, setNewRepeatedDays] = useState<string[]>([]);
  const [newPomodoros, setNewPomodoros] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addTask, updateTask, deleteTask } = useTaskStore();

  // Set default date values based on task type
  const getDefaultDateValues = (type: Task["type"]) => {
    const now = new Date();

    switch (type) {
      case "daily":
        return {
          dueDate: now,
          timeFrameKey: format(now, "yyyy-MM-dd"),
        };
      case "weekly": {
        const week = getWeek(now, { weekStartsOn: 1 })
          .toString()
          .padStart(2, "0");
        return {
          dueDate: undefined,
          timeFrameKey: `${now.getFullYear()}-W${week}`,
        };
      }
      case "monthly": {
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        return {
          dueDate: undefined,
          timeFrameKey: `${now.getFullYear()}-${month}`,
        };
      }
      case "yearly":
        return {
          dueDate: undefined,
          timeFrameKey: now.getFullYear().toString(),
        };
      case "life":
        return {
          dueDate: undefined,
          timeFrameKey: "life",
        };
      default:
        return {
          dueDate: now,
          timeFrameKey: undefined,
        };
    }
  };

  // Initialize form values based on dialog type and provided task
  useEffect(() => {
    if (dialog_type === "edit" && task) {
      // Edit mode - populate with existing task data
      setNewName(task.name);
      setNewDescription(task.description || "");
      setNewType(task.type);
      setNewDueDate(task.dueDate ? parseISO(task.dueDate) : undefined);
      setNewTimeFrameKey(task.timeFrameKey);
      setNewTags(task.tags || []);
      setNewPriority(task.priority);
      setNewRepeatedDays(task.repeatedDays || []);
      setNewPomodoros(task.pomodoros || 0);
    } else if (dialog_type === "add") {
      // Add mode - set defaults
      setNewName("");
      setNewDescription("");
      setNewType(defaultType);

      // Set default date values based on task type
      if (defaultDueDate) {
        // If a specific due date is provided, use it
        setNewDueDate(parseISO(defaultDueDate));
        setNewTimeFrameKey(defaultDueDate);
      } else if (defaultTimeFrameKey) {
        // If a specific timeFrameKey is provided, use it
        setNewTimeFrameKey(defaultTimeFrameKey);
        setNewDueDate(undefined);
      } else {
        // Otherwise use defaults based on task type
        const { dueDate, timeFrameKey } = getDefaultDateValues(defaultType);
        setNewDueDate(dueDate);
        setNewTimeFrameKey(timeFrameKey);
      }

      setNewTags([]);
      setNewPriority("low");
      setNewRepeatedDays([]);
      setNewPomodoros(0);
    }
  }, [
    dialog_type,
    task,
    defaultType,
    defaultDueDate,
    defaultTimeFrameKey,
    open,
  ]);

  // Update date values when task type changes
  useEffect(() => {
    if (dialog_type === "add") {
      const { dueDate, timeFrameKey } = getDefaultDateValues(newType);

      // Only update if we're not using custom provided values
      if (!defaultDueDate && !defaultTimeFrameKey) {
        if (newType === "daily") {
          setNewDueDate(dueDate);
        } else {
          setNewTimeFrameKey(timeFrameKey);
        }
      }
    }
  }, [newType, dialog_type, defaultDueDate, defaultTimeFrameKey]);

  // Handle external control of dialog open state
  useEffect(() => {
    if (open !== undefined) {
      setInternalOpen(open);
    }
  }, [open]);

  // Focus input when dialog opens and clear any initial input if needed
  useEffect(() => {
    if ((open || internalOpen) && inputRef.current) {
      // Focus the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();

          // If we need to prevent initial input (from keyboard shortcut)
          if (preventInitialInput) {
            // Clear any selection that might have occurred
            inputRef.current.setSelectionRange(0, 0);
          }
        }
      }, 100);
    }
  }, [open, internalOpen, preventInitialInput]);

  // Controlled open state (internal or external)
  const isOpen = open !== undefined ? open : internalOpen;

  // Handle dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSave = () => {
    if (newName.trim() === "") {
      // Don't save if name is empty
      return;
    }

    const taskData = {
      name: newName,
      description: newDescription,
      type: newType,
      dueDate: newDueDate ? format(newDueDate, "yyyy-MM-dd") : undefined,
      timeFrameKey: newTimeFrameKey,
      tags: newTags,
      priority: newPriority,
      repeatedDays: newRepeatedDays,
      pomodoros: newPomodoros,
      isCompleted: false,
    };

    if (dialog_type === "edit" && task) {
      // Update existing task
      updateTask(task.id, taskData);
    } else {
      // Create new task
      const newTask: Task = {
        id: uuidv4(),
        ...taskData,
        isCompleted: false,
      };
      addTask(newTask);

      if (onTaskCreated) {
        onTaskCreated(newTask);
      }
    }

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
    if (!task) return;

    // If it's a repetitive task, show confirmation dialog
    if (newRepeatedDays.length > 0) {
      setShowDeleteConfirmation(true);
    } else {
      // Otherwise delete immediately
      deleteTask(task.id);
      handleOpenChange(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    setShowDeleteConfirmation(false);
    handleOpenChange(false);
  };

  const dialogTitle =
    dialog_type === "add"
      ? newType === "daily"
        ? "Add Task"
        : "Add Goal"
      : newType === "daily"
      ? "Edit Task"
      : "Edit Goal";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] lg:max-w-[540px] p-2 gap-0 top-40 sm:top-72">
          <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">
            {dialog_type === "add"
              ? "Creating a new task"
              : `Editing Task - ${newName}`}
          </DialogDescription>

          {/* Task Name Input */}
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={newType === "daily" ? "Task name" : "Goal name"}
            className="h-10 pl-2 font-medium text-xl outline-none"
            onKeyDown={handleKeyDown}
          />

          {/* Description Input */}
          <textarea
            value={newDescription}
            onChange={(e) => {
              setNewDescription(e.target.value);
              // Reset height to auto to correctly calculate scrollHeight
              e.target.style.height = "2rem"; // h-8 is equivalent to 2rem
              const scrollHeight = e.target.scrollHeight;
              // Set height based on content but cap at h-20 (5rem)
              e.target.style.height = `${Math.min(scrollHeight, 80)}px`; // 80px = 5rem (h-20)
            }}
            placeholder="Description"
            className="h-auto min-h-8 max-h-20 overflow-y-auto resize-none w-full text-muted-foreground pl-2 outline-none text-sm transition-all duration-150"
            onKeyDown={(e) => {
              // Allow line breaks with Shift+Enter
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />

          <div className="flex flex-wrap gap-2 items-center mt-2">
            <DateSelect
              type={newType}
              newDueDate={newDueDate}
              setNewDueDate={setNewDueDate}
              timeFrameKey={newTimeFrameKey}
              setTimeFrameKey={setNewTimeFrameKey}
            />
            <RepeatSelect
              disabled={newType !== "daily"}
              repeatedDays={newRepeatedDays}
              onRepeatedDaysChange={setNewRepeatedDays}
              type={newType}
            />
            <PrioritySelect
              newPriority={newPriority}
              setNewPriority={setNewPriority}
            />

            <TagsSelect selectedTags={newTags} setSelectedTags={setNewTags} />
          </div>

          <Separator className="mb-2 mt-4" />

          {/* Action Buttons */}
          <div className="flex justify-between">
            {dialog_type === "add" ? (
              <TypeSelect
                newType={newType}
                setNewType={setNewType}
                setTimeFrameKey={setNewTimeFrameKey}
              />
            ) : (
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </Button>
            )}

            <div className="space-x-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="border"
                onClick={handleSave}
                disabled={newName.trim() === ""}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {task && (
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Recurring Task"
          description={`Are you sure you want to delete "${task.name}"? This will remove the task and all its tracking data across all days.`}
        />
      )}
    </>
  );
}
