"use client";

import { Check } from "lucide-react";
import TaskDialog from "./task-dialog";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";

export interface TaskCardProps {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  date: string; // The date this task is being displayed for
  goalId?: string;
  isCompleted?: boolean;
  repeatedDays?: string[];
  pomodoros?: number;
  position?: number;
}

const TaskCard = ({
  id,
  name,
  description,
  isCompleted = false,
  goalId,
  repeatedDays = [],
  dueDate,
  date, // The current date context
  pomodoros = 0,
  position,
}: TaskCardProps) => {
  const { updateTask, toggleComplete, isTaskCompletedOnDate } = useTaskStore();

  // Check if this task is completed for the current date
  const isCompletedForDate = isTaskCompletedOnDate(id, date);

  const handleTaskUpdate = (updates: Partial<Task>) => {
    updateTask(id, updates);
  };

  return (
    <li className="border-b border-muted flex items-start hover:bg-muted/40 transition-colors">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleComplete(id, date);
        }}
        className={`size-5 cursor-pointer flex items-center justify-center aspect-square m-3 mt-4 border-2 rounded-md transition-all ${
          isCompletedForDate
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-muted-foreground/40 hover:border-muted-foreground"
        }`}
        aria-label={
          isCompletedForDate ? "Mark as incomplete" : "Mark as complete"
        }
      >
        {isCompletedForDate && <Check size={12} strokeWidth={3} />}
      </button>
      <TaskDialog
        id={id}
        name={name}
        description={description}
        isCompleted={isCompletedForDate}
        goalId={goalId}
        repeatedDays={repeatedDays}
        dueDate={dueDate}
        pomodoros={pomodoros}
        onUpdate={handleTaskUpdate}
      />
    </li>
  );
};

export default TaskCard;
