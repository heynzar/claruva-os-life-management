"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { type Task, useTaskStore } from "@/stores/useTaskStore";
import { v4 as uuidv4 } from "uuid";
import { useTagsStore } from "@/stores/useTagsStore";

interface AddTaskButtonProps {
  type?: Task["type"];
  date?: string; // The date for daily tasks (YYYY-MM-DD)
  defaultTimeFrameKey?: string; // For goals
}

export default function AddTaskButton({
  type = "daily",
  date,
  defaultTimeFrameKey,
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
      const original = taskName.trim();

      // Extract hashtags
      const matchedTags = original.match(/#\w+/g) || [];
      const rawTags = matchedTags.map((tag) => tag.slice(1).toLowerCase());

      // Capitalize helper
      const capitalize = (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      const capitalizedTags = Array.from(new Set(rawTags.map(capitalize)));

      // Determine priority
      let priority: Task["priority"] = "low";
      const priorityMatch = original.match(/^(!!!|!!|!)\s|\s(!!!|!!|!)$/);
      if (priorityMatch) {
        const p = priorityMatch[0].trim();
        if (p === "!!!") priority = "high";
        else if (p === "!!") priority = "medium";
      }

      // Remove hashtags and priority indicators from the name
      const cleanedTaskName = original
        .replace(/#\w+/g, "") // remove hashtags
        .replace(/\s*(!!!|!!|!)\s*$/, "") // remove priority at end
        .replace(/^(!!!|!!|!)\s*/, "") // remove priority at beginning
        .replace(/\s+/g, " ") // normalize extra spaces
        .trim();

      // Add missing tags to global store
      const { tags, addTag } = useTagsStore.getState();
      capitalizedTags.forEach((newTag) => {
        const exists = tags.some(
          (t) => t.toLowerCase() === newTag.toLowerCase()
        );
        if (!exists) addTag(newTag);
      });

      const newTask: Task = {
        id: uuidv4(),
        name: cleanedTaskName,
        description: "",
        type,
        isCompleted: false,
        priority,
        pomodoros: 0,
        position: 999,
        tags: capitalizedTags,
      };

      if (type === "daily" && date) {
        newTask.dueDate = date;
      } else if (type !== "daily" && defaultTimeFrameKey) {
        newTask.timeFrameKey = defaultTimeFrameKey;
      }

      if (type === "daily") {
        newTask.repeatedDays = [];
        newTask.completedDates = [];
        newTask.positionsByDate = {};
      }

      addTask(newTask);
      setTaskName("");
    } else {
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
