"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
import { Separator } from "@/components/ui/separator";
import DateSelect from "./date-select";
import PrioritySelect from "./priority-select";
import RepeatSelect from "./repeat-select";
import TagsSelect from "./tag-select";
import TypeSelect from "./type-select";
import { DialogDescription } from "@radix-ui/react-dialog";

interface TaskDialogProps {
  dialog_type?: "add" | "edit";
  id: string;
  name: string;
  description?: string;
  type: Task["type"];
  dueDate?: string;
  timeFrameKey?: string;
  tags?: string[];
  priority: "low" | "medium" | "high";
  repeatedDays?: string[];
  pomodoros?: number;
  onUpdate: (updates: Partial<Task>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function TaskDialog({
  dialog_type = "edit",
  id,
  name,
  description = "",
  type = "daily",
  dueDate,
  timeFrameKey,
  tags = [],
  priority,
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] lg:max-w-[540px] p-2 gap-0 top-52">
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
          <DialogDescription className="sr-only">
            Editing Task - {name}
          </DialogDescription>

          {/* Task Name Input */}
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={newType === "daily" ? "Task name" : "Goal name"}
            className="h-10 pl-2 font-medium text-xl outline-none"
            onKeyDown={handleKeyDown}
          />

          {/* Description Input */}
          <textarea
            value={newDescription || ""}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description"
            className="!h-8 resize-none text-muted-foreground pl-2 outline-none text-sm "
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
                setTimeFrameKey={setNewTimeFrameKey}
                newType={newType}
                setNewType={setNewType}
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
              <Button className="text-white border" onClick={handleSave}>
                Save
              </Button>
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
