"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { AudioLines, Settings2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

import DayContainer from "@/components/day-container";
import TaskCard from "@/components/task-card";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import { useTaskStore } from "@/stores/useTaskStore";
import { PomodoroTimer } from "./pomodoro";
import { Separator } from "@/components/ui/separator";

type PreferenceType = "none" | "timer" | "sound";

export default function FocusPage() {
  const [preferenceType, setPreferenceType] = useState<PreferenceType>("none");
  const today = format(new Date(), "yyyy-MM-dd");

  const { getTasksForDate, getTaskPositionForDate, reorderTasks } =
    useTaskStore();

  const todayTasks = getTasksForDate(today);

  const togglePreference = (type: "timer" | "sound") => {
    setPreferenceType((prev) => (prev === type ? "none" : type));
  };

  // Handle drag end for task reordering
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // If there's no destination or the item was dropped back in its original position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Get all task IDs for today
    const taskIds = todayTasks.map((task) => {
      const isRepeating = task.repeatedDays?.length || task.dueDate !== today;
      return isRepeating ? `${task.id}:${today}` : task.id;
    });

    // Reorder the task IDs
    const [removed] = taskIds.splice(source.index, 1);
    taskIds.splice(destination.index, 0, removed);

    // Convert back to original task IDs for reordering
    const reorderedTaskIds = taskIds.map((id) =>
      id.includes(":") ? id.split(":")[0] : id
    );

    // Update the task positions
    reorderTasks(today, reorderedTaskIds);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full min-h-screen sm:h-screen sm:max-h-screen flex flex-col">
        <KeyboardShortcuts />

        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
          <div className="ml-auto flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePreference("sound")}
              aria-label="Sound preferences"
            >
              <span className="hidden sm:inline">Audio</span>
              <AudioLines className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePreference("timer")}
              aria-label="Timer preferences"
            >
              <span className="hidden sm:inline">Timer</span>
              <Timer className="size-4" />
            </Button>
            <Separator orientation="vertical" className="mx-2" />
            <Button disabled size="icon" variant="ghost" aria-label="Settings">
              <Settings2 className="size-4" />
            </Button>
          </div>
        </header>

        <main className="w-full h-full bg-background flex flex-col-reverse lg:grid lg:grid-cols-[350px_1fr] gap-1 p-1 pt-0 overflow-auto">
          {/* Today's tasks container with drag and drop */}
          <div className="h-full overflow-visible sm:overflow-auto">
            <DayContainer date={today} droppableId={today}>
              {todayTasks.map((task, index) => {
                // Determine if this is a repeating task
                const isRepeating =
                  Boolean(task.repeatedDays?.length) || task.dueDate !== today;

                // Create a unique draggable ID for repeating tasks
                const draggableId = isRepeating
                  ? `${task.id}:${today}`
                  : task.id;

                return (
                  <TaskCard
                    key={isRepeating ? `${task.id}-${today}` : task.id}
                    id={task.id}
                    name={task.name}
                    description={task.description}
                    type={task.type}
                    tags={task.tags || []}
                    priority={task.priority}
                    timeFrameKey={task.timeFrameKey}
                    repeatedDays={task.repeatedDays || []}
                    dueDate={task.dueDate}
                    date={today}
                    pomodoros={task.pomodoros || 0}
                    position={getTaskPositionForDate(task.id, today)}
                    index={index}
                    isRepeating={isRepeating}
                    draggableId={draggableId}
                  />
                );
              })}
            </DayContainer>
          </div>

          {/* Pomodoro timer container */}
          <div className="h-full bg-muted/40">
            <PomodoroTimer
              preferenceType={preferenceType}
              setPreferenceType={setPreferenceType}
            />
          </div>
        </main>
      </div>
    </DragDropContext>
  );
}
