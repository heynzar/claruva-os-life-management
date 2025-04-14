"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Calendar, ChevronRight, Edit, Trash2, Tag } from "lucide-react";
import { useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useTaskStore, type Task } from "@/stores/useTaskStore";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

interface TaskContextMenuProps {
  id: string;
  name: string;
  description?: string;
  type: Task["type"];
  dueDate?: string;
  date: string;
  tags?: string[];
  repeatedDays?: string[];
  pomodoros?: number;
  priority?: "low" | "medium" | "high";
  timeFrameKey?: string;
  isRepeating: boolean;
  children: React.ReactNode;
  onEditClick: () => void;
}

export default function TaskContextMenu({
  id,
  name,
  description = "",
  type,
  dueDate,
  date,
  tags = [],
  repeatedDays = [],
  pomodoros = 0,
  priority,
  timeFrameKey,
  isRepeating,
  children,
  onEditClick,
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
      priority: "low",
      tags,
    };
    addTask(newTask);
  };

  const handleMoveToNextDay = () => {
    if (type !== "daily" || !dueDate) return;

    const nextDay = addDays(parseISO(dueDate), 1);
    updateTask(id, { dueDate: format(nextDay, "yyyy-MM-dd") });
  };

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

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem onClick={onEditClick} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Edit Task
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDuplicate} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Task
          </ContextMenuItem>

          {/* Only show date-related options for daily tasks */}
          {type === "daily" && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={handleMoveToNextDay}
                className="cursor-pointer"
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                Move to Tomorrow
              </ContextMenuItem>
              <ContextMenuItem
                onClick={handleMoveToNextWeek}
                className="cursor-pointer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Move to Next Week
              </ContextMenuItem>
            </>
          )}

          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDeleteClick}
            className="text-red-500 focus:text-red-500 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Task
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
