"use client";

import { useRef } from "react";
import { format, isToday, isYesterday, isTomorrow } from "date-fns";
import type { Task } from "@/stores/useTaskStore";
import AddTaskButton from "./add-task-button";

interface DayContainerProps {
  date: string; // format: "YYYY-MM-DD"
  tasks: Task[];
  children?: React.ReactNode;
}

export default function DayContainer({
  date,
  tasks,
  children,
}: DayContainerProps) {
  const dateObj = new Date(date);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine the day label
  let dayLabel = format(dateObj, "EEEE");
  if (isToday(dateObj)) {
    dayLabel = "Today";
  } else if (isYesterday(dateObj)) {
    dayLabel = "Yesterday";
  } else if (isTomorrow(dateObj)) {
    dayLabel = "Tomorrow";
  }

  return (
    <section
      ref={containerRef}
      className="w-full h-[calc(100vh-52px)] bg-muted/40 flex flex-col"
    >
      <h2 className="flex flex-col m-4">
        <span className="text-muted-foreground text-sm">
          {format(dateObj, "MMM dd, yyyy")}
        </span>
        <span className="text-2xl font-medium uppercase">{dayLabel}</span>
      </h2>
      <ul className="w-full flex flex-col h-full scrollbar-thin overflow-y-auto border-t border-muted">
        {children}

        {/* Add task button */}
        <AddTaskButton date={date} containerRef={containerRef} />
      </ul>
    </section>
  );
}
