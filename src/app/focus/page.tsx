"use client";

import { format } from "date-fns";
import DayContainer from "@/components/day-container";
import TaskCard from "@/components/task-card";
import { useTaskStore } from "@/stores/useTaskStore";
import { PomodoroTimer } from "./PomodoroTimer";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { AudioLines, Timer } from "lucide-react";
import { useState } from "react";

export default function FocusPage() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSoundPreferences, setShowSoundPreferences] = useState(false);

  // Get today's tasks
  const today = format(new Date(), "yyyy-MM-dd");
  const { getTasksForDate, getTaskPositionForDate, isTaskCompletedOnDate } =
    useTaskStore();
  const todayTasks = getTasksForDate(today);

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    // We're not implementing drag functionality for this page
    // but we need to provide the handler for DragDropContext
    return;
  };

  // Render task card
  const renderTaskCard = (task: any, index: number) => {
    const isRepeating =
      Boolean(task.repeatedDays?.length) || task.dueDate !== today;

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
      />
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen flex flex-col">
        {/* Keyboard shortcuts component */}
        <KeyboardShortcuts />

        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
          <div className="ml-auto">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowSoundPreferences(!showSoundPreferences);
              }}
            >
              <AudioLines />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowPreferences(!showPreferences);
              }}
            >
              <Timer />
            </Button>
          </div>
        </header>

        <main className="w-full h-full bg-muted/20 grid grid-cols-[340px_1fr] gap-1 p-1 pt-0 overflow-hidden">
          {/* Today Container */}
          <div className="h-full overflow-auto scroll-smooth">
            <DayContainer date={today} droppableId={today}>
              {todayTasks.map((task, index) => renderTaskCard(task, index))}
            </DayContainer>
          </div>

          {/* Focus App */}
          <div className="h-full bg-muted/40">
            <PomodoroTimer
              showPreferences={showPreferences}
              showSoundPreferences={showSoundPreferences}
            />
          </div>
        </main>
      </div>
    </DragDropContext>
  );
}
