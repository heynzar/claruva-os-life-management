"use client";

import { useState, useRef, useEffect } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { v4 as uuidv4 } from "uuid";

interface AddTaskButtonProps {
  date: string; // The date for this container (YYYY-MM-DD)
  containerRef?: React.RefObject<HTMLElement | null>; // Reference to the container for detecting outside clicks
}

export default function AddTaskButton({
  date,
  containerRef,
}: AddTaskButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskStore();

  // Handle outside clicks to save the task
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      // If we have a container ref and the click is inside it, don't save yet
      if (
        containerRef?.current &&
        event.target instanceof Node &&
        containerRef.current.contains(event.target)
      ) {
        return;
      }

      // If input ref exists and the click is outside it, save the task
      if (
        inputRef.current &&
        event.target instanceof Node &&
        !inputRef.current.contains(event.target)
      ) {
        saveTask();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, taskName, date]);

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
        isCompleted: false,
        dueDate: date,
        goalId: "quick-tasks", // Default goal for quick tasks
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
          placeholder="Task name"
          className="bg-transparent border-none py-3 outline-none w-full text-foreground placeholder:text-muted-foreground/60 pl-1"
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
