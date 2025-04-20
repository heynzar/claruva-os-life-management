"use client";

import type React from "react";
import { useRef } from "react";
import { format, isToday, isYesterday, isTomorrow } from "date-fns";
import { Droppable } from "@hello-pangea/dnd";
import AddTaskButton from "./add-task-button";

interface DayContainerProps {
  date: string; // format: "YYYY-MM-DD"
  children?: React.ReactNode;
  droppableId: string; // Unique ID for the droppable area
}

const DayContainer = ({ date, children, droppableId }: DayContainerProps) => {
  const dateObj = new Date(date);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine the day label
  const dayLabel = format(dateObj, "EEEE");
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
          {format(dateObj, "MMM d, yyyy")}
          {spanLabel && (
            <span
              className={`text-xs ${
                spanLabel === "Today" ? "text-primary" : ""
              }`}
            >
              {spanLabel}
            </span>
          )}
        </p>
        <span className="text-2xl font-medium uppercase">{dayLabel}</span>
      </h2>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`w-full flex flex-col h-full border-t border-muted overflow-y-auto ${
              snapshot.isDraggingOver ? "bg-muted/60" : ""
            }`}
            style={{
              minHeight: "100px", // Ensure there's always space to drop
            }}
          >
            {children}
            {provided.placeholder}

            {/* Add task button */}
            <AddTaskButton date={date} />
          </ul>
        )}
      </Droppable>
    </section>
  );
};

export default DayContainer;
