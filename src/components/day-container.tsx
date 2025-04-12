"use client";

import type React from "react";

import { useRef } from "react";
import { format, isToday, isYesterday, isTomorrow } from "date-fns";
import type { Task } from "@/stores/useTaskStore";
import AddTaskButton from "./add-task-button";
import { Droppable } from "@hello-pangea/dnd";

interface DayContainerProps {
  date: string; // format: "YYYY-MM-DD"
  tasks: Task[];
  children?: React.ReactNode;
  droppableId: string; // Unique ID for the droppable area
}

export default function DayContainer({
  date,
  tasks,
  children,
  droppableId,
}: DayContainerProps) {
  const dateObj = new Date(date);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine the day label
  let dayLabel = format(dateObj, "EEEE");
  let spanLabel = "";
  if (isToday(dateObj)) {
    spanLabel = "Today";
  } else if (isYesterday(dateObj)) {
    spanLabel = "Yesterday";
  } else if (isTomorrow(dateObj)) {
    spanLabel = "Tomorrow";
  }

  return (
    <section
      ref={containerRef}
      className="w-full h-full bg-muted/40 flex flex-col"
    >
      <h2 className="flex flex-col m-4">
        <p className="text-muted-foreground text-sm flex items-center justify-between gap-2">
          {format(dateObj, "MMM dd, yyyy")}
          {spanLabel && (
            <span
              className={`text-xs ${spanLabel === "Today" && "text-blue-500"}`}
            >
              {spanLabel}
            </span>
          )}
        </p>
        <span
          className={`${
            dayLabel === "Today" && "text-blue-500"
          } text-2xl font-medium uppercase`}
        >
          {dayLabel}
        </span>
      </h2>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`w-full flex flex-col h-full border-t border-muted ${
              snapshot.isDraggingOver ? "bg-muted/60" : ""
            }`}
          >
            {children}
            {provided.placeholder}

            {/* Add task button */}
            <AddTaskButton date={date} containerRef={containerRef} />
          </ul>
        )}
      </Droppable>
    </section>
  );
}
