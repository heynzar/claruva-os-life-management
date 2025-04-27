"use client";

import { format } from "date-fns";
import DayContainer from "@/components/day-container";
import TaskCard from "@/components/task-card";
import { useTaskStore } from "@/stores/useTaskStore";
import { PomodoroTimer } from "./pomodoro";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { AudioLines, Settings2, Timer } from "lucide-react";
import { useState } from "react";

export default function FocusPage() {
  const [preferenceType, setPreferenceType] = useState<
    "none" | "general" | "sound"
  >("none");

  const today = format(new Date(), "yyyy-MM-dd");
  const { getTasksForDate, getTaskPositionForDate } = useTaskStore();
  const todayTasks = getTasksForDate(today);

  const handleDragEnd = (result: DropResult) => {
    // Drag functionality not implemented
  };

  const togglePreference = (type: "general" | "sound") => {
    setPreferenceType((prev) => (prev === type ? "none" : type));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen flex flex-col">
        <KeyboardShortcuts />

        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
          <div className="ml-auto flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePreference("sound")}
            >
              sounds
              <AudioLines />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePreference("general")}
            >
              Timer
              <Timer />
            </Button>
            <Button size="icon" variant="ghost">
              <Settings2 />
            </Button>
          </div>
        </header>

        <main className="w-full h-full bg-muted/20 grid grid-cols-[340px_1fr] gap-1 p-1 pt-0 overflow-hidden">
          <div className="h-full overflow-auto scroll-smooth">
            <DayContainer date={today} droppableId={today}>
              {todayTasks.map((task, index) => (
                <TaskCard
                  key={`${task.id}-${today}`}
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
                  isRepeating={
                    Boolean(task.repeatedDays?.length) || task.dueDate !== today
                  }
                />
              ))}
            </DayContainer>
          </div>

          <div className="h-full bg-muted/40">
            <PomodoroTimer
              showPreferences={preferenceType === "general"}
              showSoundPreferences={preferenceType === "sound"}
            />
          </div>
        </main>
      </div>
    </DragDropContext>
  );
}
