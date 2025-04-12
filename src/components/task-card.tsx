"use client";

import { Check } from "lucide-react";
import TaskDialog from "./task-dialog";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { Draggable } from "@hello-pangea/dnd";

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
  index: number; // Index for drag and drop
  isRepeating: boolean; // Whether this is a repeating task instance
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
  index,
  isRepeating,
}: TaskCardProps) => {
  const { updateTask, toggleComplete, isTaskCompletedOnDate } = useTaskStore();

  // Check if this task is completed for the current date
  const isCompletedForDate = isTaskCompletedOnDate(id, date);

  const handleTaskUpdate = (updates: Partial<Task>) => {
    updateTask(id, updates);
  };

  // Create a unique draggable ID for this task instance
  // For repeating tasks or tasks shown on a different day than their due date,
  // we create a unique ID by combining the task ID and the date
  const draggableId = isRepeating ? `${id}:${date}` : id;

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          id={id}
          className={`border-b border-muted flex items-center transition-all ${
            snapshot.isDragging
              ? "bg-muted rotate-3 shadow-lg"
              : "hover:bg-muted/40"
          }`}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(id, date);
            }}
            className={`size-5 cursor-pointer flex items-center justify-center aspect-square m-3 border-2 rounded-md transition-all ${
              isCompletedForDate
                ? "bg-blue-500 border-blue-500 text-white"
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
      )}
    </Draggable>
  );
};

export default TaskCard;
