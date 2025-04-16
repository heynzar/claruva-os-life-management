"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit, Trash2, Copy, ArrowRight, ArrowRightCircle } from "lucide-react";
import { useState } from "react";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";
import { useTaskStore, type Task } from "@/stores/useTaskStore";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";

interface TaskContextMenuProps {
  id: string;
  name: string;
  description?: string;
  type: Task["type"];
  dueDate?: string;
  tags?: string[];
  repeatedDays?: string[];
  pomodoros?: number;
  isRepeating: boolean;
  priority: "low" | "medium" | "high";
  timeFrameKey?: string;
  children: React.ReactNode;
  onEditClick: () => void;
}

export default function TaskContextMenu({
  id,
  name,
  description = "",
  type,
  dueDate,
  tags = [],
  repeatedDays = [],
  pomodoros = 0,
  priority,
  timeFrameKey,
  children,
  onEditClick,
  isRepeating,
}: TaskContextMenuProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { addTask, deleteTask, updateTask } = useTaskStore();

  const handleDuplicate = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      name,
      description,
      isCompleted: false,
      type,
      dueDate,
      timeFrameKey,
      repeatedDays,
      pomodoros,
      position: 0, // Will be calculated in addTask
      completedDates: [],
      positionsByDate: {},
      priority,
      tags,
    };
    addTask(newTask);
  };

  // Determine the item type label (task or goal)
  const itemTypeLabel = type === "daily" ? "Task" : "Goal";

  // Handle moving a task to the next day
  const handleMoveToNextDay = () => {
    if (type !== "daily" || !dueDate) return;

    const nextDay = addDays(parseISO(dueDate), 1);
    updateTask(id, { dueDate: format(nextDay, "yyyy-MM-dd") });
  };

  // Handle moving a task to the next week
  const handleMoveToNextWeek = () => {
    if (type !== "daily" || !dueDate) return;

    const nextWeek = addDays(parseISO(dueDate), 7);
    updateTask(id, { dueDate: format(nextWeek, "yyyy-MM-dd") });
  };

  const handleDeleteClick = () => {
    // If it's a repetitive task, show confirmation dialog
    if (repeatedDays?.length) {
      setShowDeleteConfirmation(true);
    } else {
      // Otherwise delete immediately
      deleteTask(id);
    }
  };

  const handleConfirmDelete = () => {
    deleteTask(id);
    setShowDeleteConfirmation(false);
  };

  // Handle moving a goal to the next period
  const handleMoveToNextPeriod = () => {
    if (!timeFrameKey) return;

    let newTimeFrameKey: string | undefined;

    switch (type) {
      case "weekly": {
        // Parse the week key (format: "YYYY-WXX")
        const [year, weekPart] = timeFrameKey.split("-W");
        const weekNum = Number.parseInt(weekPart, 10);

        // Create a date for this week and add a week
        const currentDate = new Date(
          Number.parseInt(year, 10),
          0,
          1 + (weekNum - 1) * 7
        );
        const nextDate = addWeeks(currentDate, 1);

        // Format the new week key
        const nextWeekNum = format(nextDate, "ww");
        const nextYear = format(nextDate, "yyyy");
        newTimeFrameKey = `${nextYear}-W${nextWeekNum}`;
        break;
      }
      case "monthly": {
        // Parse the month key (format: "YYYY-MM")
        const [year, month] = timeFrameKey.split("-");

        // Create a date for this month and add a month
        const currentDate = new Date(
          Number.parseInt(year, 10),
          Number.parseInt(month, 10) - 1,
          1
        );
        const nextDate = addMonths(currentDate, 1);

        // Format the new month key
        const nextMonth = format(nextDate, "MM");
        const nextYear = format(nextDate, "yyyy");
        newTimeFrameKey = `${nextYear}-${nextMonth}`;
        break;
      }
      case "yearly": {
        // Parse the year key (format: "YYYY")
        const year = Number.parseInt(timeFrameKey, 10);

        // Add a year
        newTimeFrameKey = (year + 1).toString();
        break;
      }
    }

    if (newTimeFrameKey) {
      updateTask(id, { timeFrameKey: newTimeFrameKey });
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem onClick={onEditClick} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Edit {itemTypeLabel}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDuplicate} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate {itemTypeLabel}
          </ContextMenuItem>

          {/* Task-specific options for non-repeating tasks */}
          {type === "daily" && !isRepeating && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={handleMoveToNextDay}
                className="cursor-pointer"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Move to next day
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleMoveToNextWeek}
                className="cursor-pointer"
              >
                <ArrowRightCircle className="mr-2 h-4 w-4" />
                Move to next week
              </ContextMenuItem>
            </>
          )}

          {/* Goal-specific options for non-repeating goals */}
          {type !== "daily" && !isRepeating && (
            <ContextMenuItem onClick={handleMoveToNextPeriod}>
              <ArrowRightCircle className="mr-2 h-4 w-4" />
              {type === "weekly" && "Move to next week"}
              {type === "monthly" && "Move to next month"}
              {type === "yearly" && "Move to next year"}
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDeleteClick}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 text-destructive h-4 w-4" />
            Delete {itemTypeLabel}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

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
