"use client";

import { useEffect, useState } from "react";
import TaskDialog from "@/components/task-dialog/task-dialog";
import type { Task } from "@/stores/useTaskStore";
import { format, getWeek } from "date-fns";

export default function KeyboardShortcuts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskType, setTaskType] = useState<Task["type"]>("daily");
  const [preventInput, setPreventInput] = useState(false);

  // Get current date for daily tasks
  const currentDate = format(new Date(), "yyyy-MM-dd");

  // Get current timeframe keys for goals
  const now = new Date();
  const currentWeek = `${now.getFullYear()}-W${getWeek(now, { weekStartsOn: 1 })
    .toString()
    .padStart(2, "0")}`;
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const currentYear = now.getFullYear().toString();

  // State for default values
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>(
    undefined
  );
  const [defaultTimeFrameKey, setDefaultTimeFrameKey] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contentEditable element
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      // Handle keyboard shortcuts
      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault(); // Prevent the key from being registered elsewhere
          setTaskType("daily");
          setDefaultDueDate(currentDate);
          setDefaultTimeFrameKey(undefined);
          setPreventInput(true);
          setDialogOpen(true);
          break;
        case "w":
          e.preventDefault();
          setTaskType("weekly");
          setDefaultDueDate(undefined);
          setDefaultTimeFrameKey(currentWeek);
          setPreventInput(true);
          setDialogOpen(true);
          break;
        case "m":
          e.preventDefault();
          setTaskType("monthly");
          setDefaultDueDate(undefined);
          setDefaultTimeFrameKey(currentMonth);
          setPreventInput(true);
          setDialogOpen(true);
          break;
        case "y":
          e.preventDefault();
          setTaskType("yearly");
          setDefaultDueDate(undefined);
          setDefaultTimeFrameKey(currentYear);
          setPreventInput(true);
          setDialogOpen(true);
          break;
        case "l":
          e.preventDefault();
          setTaskType("life");
          setDefaultDueDate(undefined);
          setDefaultTimeFrameKey("life");
          setPreventInput(true);
          setDialogOpen(true);
          break;
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentDate, currentWeek, currentMonth, currentYear]);

  const handleTaskCreated = (task: Task) => {
    console.log("Task created via keyboard shortcut:", task);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setPreventInput(false);
    }
  };

  return (
    <TaskDialog
      dialog_type="add"
      defaultType={taskType}
      defaultDueDate={defaultDueDate}
      defaultTimeFrameKey={defaultTimeFrameKey}
      open={dialogOpen}
      onOpenChange={handleDialogOpenChange}
      onTaskCreated={handleTaskCreated}
      preventInitialInput={preventInput}
    />
  );
}
