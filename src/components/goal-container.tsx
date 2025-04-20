"use client";

import type React from "react";
import { useRef } from "react";
import { Droppable } from "@hello-pangea/dnd";
import AddTaskButton from "./add-task-button";

interface GoalContainerProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  type: "weekly" | "monthly" | "yearly" | "life";
  timeFrameKey: string;
  droppableId: string; // Unique ID for the droppable area
  status?: "previous" | "current" | "next" | "other"; // New prop for container status
}

export default function GoalContainer({
  title,
  subtitle,
  children,
  type,
  timeFrameKey,
  droppableId,
  status = "other",
}: GoalContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine label based on status
  let statusLabel = "";
  let statusClass = "text-muted-foreground";

  if (status === "previous") {
    statusLabel = "Previous";
    statusClass = "text-muted-foreground";
  } else if (status === "current") {
    statusLabel = "Current";
    statusClass = "text-primary";
  } else if (status === "next") {
    statusLabel = "Next";
    statusClass = "text-muted-foreground";
  }

  return (
    <section
      ref={containerRef}
      className="w-full h-full bg-muted/40 flex flex-col"
    >
      <h2 className="flex flex-col m-4">
        <p className="text-muted-foreground text-sm flex items-center justify-between gap-2">
          {subtitle}
          {statusLabel && (
            <span className={`text-xs ${statusClass}`}>{statusLabel}</span>
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
            <AddTaskButton type={type} defaultTimeFrameKey={timeFrameKey} />
          </ul>
        )}
      </Droppable>
    </section>
  );
}
