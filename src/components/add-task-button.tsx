"use client";

import { useState, useRef, useEffect } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { v4 as uuidv4 } from "uuid";

interface AddTaskButtonProps {
  date: string; // The date for this container (YYYY-MM-DD)
  containerRef?: React.RefObject<HTMLElement | null>; // Reference to the container for detecting outside clicks
  timeFrameKey?: string; // Optional timeframe key for categorizing tasks
}

export default function AddTaskButton({
  date,
  containerRef,
  timeFrameKey,
}: AddTaskButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskStore();

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const saveTask = () => {
    if (taskName.trim()) {
      // Create a new task with default values
      addTask({
        id: uuidv4(),
        name: taskName.trim(),
        description: "",
        type: "daily", // Set default type to daily
        isCompleted: false,
        dueDate: date, // Use the current container's date as the due date
        timeFrameKey, // Use the provided timeframe key
        tags: [], // Add any tags the user entered
        priority: "low", // Add priority if set
        repeatedDays: [],
        pomodoros: 0,
        position: 999, // High position to place at the end
        completedDates: [],
      });
      setTaskName("");
    }

    // If taskName is empty and we're saving, exit edit mode
    if (!taskName.trim()) {
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    // If there's text, save the task and stay in edit mode for quick entry
    if (taskName.trim()) {
      saveTask();
      setTaskName("");
      if (inputRef.current) {
        inputRef.current.focus();
      } // Clear input after saving
    } else {
      // If no text, exit edit mode
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTask();
      // Keep focus and stay in edit mode for quick consecutive task entry
      if (taskName.trim()) {
        setTaskName("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTaskName("");
    }
  };

  if (isEditing) {
    return (
      <div className="items-center flex hover:bg-muted/50 w-full">
        <span className="size-5 aspect-square border-2 m-3 border-muted-foreground/20 rounded-md" />
        <input
          ref={inputRef}
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Task name"
          className="bg-transparent border-none p-3 pl-1 outline-none w-full text-foreground placeholder:text-muted-foreground/60"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      className="items-center flex hover:bg-muted/50 cursor-pointer w-full"
      onClick={() => setIsEditing(true)}
    >
      <span className="size-5 aspect-square border-2 m-3 cursor-pointer border-muted-foreground/20 rounded-md" />
      <span className="text-muted-foreground/60 pl-1 py-3">Add task</span>
    </div>
  );
}
