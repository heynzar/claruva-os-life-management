"use client";

import { Check, RotateCcw } from "lucide-react";
import TaskDialog from "./task-dialog";
import type { Task } from "@/stores/useTaskStore";
import { useTaskStore } from "@/stores/useTaskStore";
import { Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import TaskContextMenu from "@/components/task-context-menu";

export interface TaskCardProps {
  id: string;
  name: string;
  description?: string;
  type: Task["type"];
  dueDate?: string;
  date: string; // The date this task is being displayed for
  tags?: string[];
  priority: "low" | "medium" | "high";
  timeFrameKey?: string;
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
  type,
  isCompleted = false,
  tags,
  priority,
  timeFrameKey,
  repeatedDays = [],
  dueDate,
  date, // The current date context
  pomodoros = 0,
  position,
  index,
  isRepeating,
}: TaskCardProps) => {
  const { updateTask, toggleComplete, isTaskCompletedOnDate } = useTaskStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if this task is completed for the current date
  const isCompletedForDate = isTaskCompletedOnDate(id, date);

  const handleTaskUpdate = (updates: Partial<Task>) => {
    updateTask(id, updates);
  };

  // Create a unique draggable ID for this task instance
  // For repeating tasks or tasks shown on a different day than their due date,
  // we create a unique ID by combining the task ID and the date
  const draggableId = isRepeating ? `${id}:${date}` : id;

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  // Priority color mapping
  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      case "low":
        return "border-l-4 border-l-blue-400";
      default:
        return "";
    }
  };

  return (
    <>
      <Draggable draggableId={draggableId} index={index}>
        {(provided, snapshot) => (
          <TaskContextMenu
            id={id}
            name={name}
            description={description}
            type={type}
            dueDate={dueDate}
            date={date}
            tags={tags}
            priority={priority}
            timeFrameKey={timeFrameKey}
            repeatedDays={repeatedDays}
            pomodoros={pomodoros}
            isRepeating={isRepeating}
            onEditClick={handleOpenDialog}
          >
            <li
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              id={id}
              className={`border-b cursor-grab border-muted flex items-center transition-colors ${
                snapshot.isDragging ? "bg-muted shadow-lg" : "hover:bg-muted/40"
              } ${getPriorityColor()}`}
              style={{
                ...provided.draggableProps.style,
                // Fix for animation glitch when dropping at the top
                ...(snapshot.isDropAnimating && {
                  transitionDuration: "0.3s",
                }),
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComplete(id, date);
                }}
                className={`size-5 cursor-pointer flex items-center justify-center aspect-square m-3 border-2 rounded-md transition-all ${
                  isCompletedForDate
                    ? "bg-primary border-primary text-white"
                    : "border-muted-foreground/40 hover:border-muted-foreground"
                }`}
                aria-label={
                  isCompletedForDate ? "Mark as incomplete" : "Mark as complete"
                }
              >
                {isCompletedForDate && <Check size={12} strokeWidth={3} />}
              </button>

              <button
                onClick={handleOpenDialog}
                className={`text-start cursor-pointer px-1 py-3 w-full h-full flex justify-between items-center`}
              >
                <span
                  className={`${
                    isCompletedForDate && "line-through text-muted-foreground"
                  }`}
                >
                  {name}
                </span>
                {repeatedDays && repeatedDays.length > 0 && (
                  <RotateCcw className="size-4 mr-2 text-muted-foreground/50" />
                )}
              </button>
            </li>
          </TaskContextMenu>
        )}
      </Draggable>
      <TaskDialog
        id={id}
        name={name}
        description={description}
        type={type}
        isCompleted={isCompletedForDate}
        tags={tags}
        priority={priority}
        timeFrameKey={timeFrameKey}
        repeatedDays={repeatedDays}
        dueDate={dueDate}
        pomodoros={pomodoros}
        onUpdate={handleTaskUpdate}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};

export default TaskCard;
