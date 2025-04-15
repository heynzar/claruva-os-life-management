"use client";

import type React from "react";
import { useRef } from "react";
import { Droppable } from "@hello-pangea/dnd";
import AddTaskButton from "./add-task-button";
import { getWeek, getYear, getMonth } from "date-fns";

interface GoalContainerProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  type: "weekly" | "monthly" | "yearly" | "life";
  timeFrameKey: string;
  droppableId: string; // Unique ID for the droppable area
}

export default function GoalContainer({
  title,
  subtitle,
  children,
  type,
  timeFrameKey,
  droppableId,
}: GoalContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if this is the current period
  const now = new Date();
  const currentYear = getYear(now).toString();
  const currentMonth = `${getYear(now)}-${(getMonth(now) + 1)
    .toString()
    .padStart(2, "0")}`;
  const currentWeek = `${getYear(now)}-W${getWeek(now, { weekStartsOn: 1 })
    .toString()
    .padStart(2, "0")}`;

  let isCurrent = false;
  let currentLabel = "";

  if (type === "weekly" && timeFrameKey === currentWeek) {
    isCurrent = true;
    currentLabel = "Current Week";
  } else if (type === "monthly" && timeFrameKey === currentMonth) {
    isCurrent = true;
    currentLabel = "Current Month";
  } else if (type === "yearly" && timeFrameKey === currentYear) {
    isCurrent = true;
    currentLabel = "Current Year";
  }

  return (
    <section
      ref={containerRef}
      className="w-full h-full bg-muted/40 flex flex-col"
    >
      <h2 className="flex flex-col m-4">
        <p className="text-muted-foreground text-sm flex items-center justify-between gap-2">
          {subtitle}
          {isCurrent && (
            <span className="text-xs text-primary">{currentLabel}</span>
          )}
        </p>
        <span className="text-2xl font-medium uppercase">{title}</span>
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

            {/* Add goal button */}
            <AddTaskButton
              type={type}
              defaultTimeFrameKey={timeFrameKey}
              containerRef={containerRef}
            />
          </ul>
        )}
      </Droppable>
    </section>
  );
}
