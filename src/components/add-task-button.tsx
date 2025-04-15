"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { type Task, useTaskStore } from "@/stores/useTaskStore";
import { v4 as uuidv4 } from "uuid";

interface AddTaskButtonProps {
  type?: Task["type"];
  date?: string; // The date for daily tasks (YYYY-MM-DD)
  defaultTimeFrameKey?: string; // For goals
  containerRef?: React.RefObject<HTMLElement | null>; // Reference to the container for detecting outside clicks
}

export default function AddTaskButton({
  type = "daily",
  date,
  defaultTimeFrameKey,
  containerRef,
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
      const newTask: Task = {
        id: uuidv4(),
        name: taskName.trim(),
        description: "",
        type, // Use the provided type
        isCompleted: false,
        priority: "low",
        pomodoros: 0,
        position: 999, // High position to place at the end
        tags: [],
      };

      // Add type-specific properties
      if (type === "daily" && date) {
        newTask.dueDate = date;
      } else if (type !== "daily" && defaultTimeFrameKey) {
        newTask.timeFrameKey = defaultTimeFrameKey;
      }

      // Add empty arrays for task-specific properties
      if (type === "daily") {
        newTask.repeatedDays = [];
        newTask.completedDates = [];
        newTask.positionsByDate = {};
      }

      addTask(newTask);
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

  const getPlaceholderText = () => {
    if (type === "daily") return "Add Task";
    return `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Goal`;
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
          placeholder={type === "daily" ? "Task name" : "Goal name"}
          className="bg-transparent border-none p-3 pl-1 outline-none w-full text-foreground placeholder:text-muted-foreground/60"
          autoFocus
        />
      </div>
    );
  }

  return (
    <>
      <div
        className="items-center flex hover:bg-muted/50 cursor-pointer w-full"
        onClick={() => setIsEditing(true)}
      >
        <span className="size-5 aspect-square border-2 m-3 cursor-pointer border-muted-foreground/20 rounded-md" />
        <span className="text-muted-foreground/60 pl-1 py-3">
          {getPlaceholderText()}
        </span>
      </div>
    </>
  );
}
