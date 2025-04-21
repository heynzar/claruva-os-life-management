"use client";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { PlusCircle, Printer } from "lucide-react";

import GoalContainer from "@/components/goal-container";
import TaskCard from "@/components/task-card";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import { useTaskStore, type Task } from "@/stores/useTaskStore";
import VisionBoard from "@/components/vision-board/vision-board";
import { Button } from "@/components/ui/button";
import { useVisionBoardStore } from "@/stores/useVisionBoardStore";
import AddContentDialog from "@/components/vision-board/add-content-dialog";

export default function LifePage() {
  const { items } = useVisionBoardStore();

  // Handle printing the vision board
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Create a style block that will preserve the exact layout
    const gridItemsStyle = items
      .map(
        (item) => `
        .grid-item-${item.id} {
          grid-column: span ${item.width};
          grid-row: span ${item.height};
          position: relative;
          overflow: hidden;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          background-color: white;
        }
      `
      )
      .join("\n");

    // Calculate the best grid column count based on items
    const maxX = Math.max(...items.map((item) => item.x + item.width));
    const columns = Math.max(12, maxX);

    // Create a grid layout that mirrors the react-grid-layout
    const gridLayout = `
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 10px;
        padding: 10px;
      `;

    // Create precise positioning for all items
    const itemPositions = items
      .map(
        (item) => `
        .item-pos-${item.id} {
          grid-column-start: ${item.x + 1};
          grid-column-end: span ${item.width};
          grid-row-start: ${item.y + 1};
          grid-row-end: span ${item.height};
        }
      `
      )
      .join("\n");

    // Generate the HTML content for each item
    const itemsHtml = items
      .map((item) => {
        if (item.isText) {
          return `
            <div class="grid-item-${item.id} item-pos-${
            item.id
          } text-item" style="background-color: ${
            item.textBackground || "#ffffff"
          };">
              <div class="text-content" style="color: ${
                item.textColor || "#000000"
              }; font-size: ${
            item.fontSize || 16
          }px; height: 100%; display: flex; align-items: center; justify-content: center; padding: 0px 10px 10px 10px; text-align: center;">
                ${item.caption || ""}
              </div>
            </div>
          `;
        } else {
          return `
            <div class="grid-item-${item.id} item-pos-${item.id} image-item">
              <div class="image-container" style="height: 100%;">
                <img src="${item.imageUrl}" alt="Vision board image"
          }" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            </div>
          `;
        }
      })
      .join("\n");

    printWindow.document.write(`
        <html>
          <head>
            <title>My Vision Board</title>
            <style>
              @media print {
                @page {
                  size: landscape;
                  margin: 10mm;
                }
                body {
                  margin: 0;
                }
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              h1 {
                text-align: center;
                margin-bottom: 20px;
              }
              .vision-board-print {
                ${gridLayout}
              }
              ${gridItemsStyle}
              ${itemPositions}
              .text-item {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .image-item {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .caption {
                font-size: 0.875rem;
              }
            </style>
          </head>
          <body>
            <h1>My Vision Board</h1>
            <div class="vision-board-print">
              ${itemsHtml}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => window.print(), 800);
              }
            </script>
          </body>
        </html>
      `);

    printWindow.document.close();
  };

  // Get tasks and actions from the Zustand store
  const {
    tasks,
    getTasksByType,
    updateTask,
    getGoalPositionForTimeFrame,
    setGoalPositionForTimeFrame,
  } = useTaskStore();

  // Get life goals
  const lifeGoals = getTasksByType("life", "life");

  // Helper function to check if a goal is repetitive
  const isGoalRepetitive = (goal: Task): boolean => {
    return Boolean(goal.repeatedDays?.includes(goal.type));
  };

  // Handle drag end event
  const handleDragEnd = (result: DropResult): void => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back in its original position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Get all goal IDs
    const goalIds = lifeGoals.map((goal) => goal.id);

    // Reorder the goal IDs
    const [removed] = goalIds.splice(source.index, 1);
    goalIds.splice(destination.index, 0, removed);

    // Update positions for each goal
    goalIds.forEach((id, index) => {
      const goal = tasks.find((t) => t.id === id);
      if (!goal) return;

      if (isGoalRepetitive(goal)) {
        // For repetitive goals, update position only for this specific timeframe
        setGoalPositionForTimeFrame(id, "life", index + 1);
      } else {
        // For non-repetitive goals, update the regular position
        updateTask(id, { position: index + 1 });
      }
    });
  };

  // Render the goal card component with proper props
  const renderGoalCard = (goal: Task, index: number) => {
    // Check if this is a repeating goal
    const isRepeating = goal.repeatedDays?.includes(goal.type) || false;

    // For repeating goals, use a unique key that includes the timeframe
    const cardKey = isRepeating ? `${goal.id}-life` : goal.id;

    // Create a unique draggable ID for repetitive goals
    const draggableId = isRepeating ? `${goal.id}:life` : goal.id;

    return (
      <TaskCard
        key={cardKey}
        id={goal.id}
        name={goal.name}
        description={goal.description}
        type={goal.type}
        tags={goal.tags || []}
        priority={goal.priority}
        timeFrameKey={goal.timeFrameKey}
        dueDate={goal.dueDate}
        date={format(new Date(), "yyyy-MM-dd")} // Use current date as context
        pomodoros={goal.pomodoros || 0}
        position={
          isRepeating
            ? getGoalPositionForTimeFrame(goal.id, "life")
            : goal.position || 999
        }
        index={index}
        isRepeating={isRepeating}
        repeatedDays={goal.repeatedDays || []}
        draggableId={draggableId}
      />
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen overflow-auto flex flex-col">
        {/* Keyboard shortcuts component */}
        <KeyboardShortcuts />

        <header className="flex items-center justify-between w-full p-2">
          <div className="flex items-center ml-auto">
            <AddContentDialog>
              <Button variant="ghost">
                <PlusCircle />
                Add Content
              </Button>
            </AddContentDialog>

            <Button
              variant="ghost"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer />
            </Button>
          </div>
        </header>

        <main className="w-full h-full bg-muted/20 flex flex-col lg:grid lg:grid-cols-[350px_1fr] gap-1 p-1">
          {/* Life Goals Container */}
          <div className="h-full">
            <GoalContainer
              title="Life Goals"
              subtitle="Long-term Goals"
              type="life"
              timeFrameKey="life"
              droppableId="life:life"
              status="current"
            >
              {lifeGoals.map((goal, index) => renderGoalCard(goal, index))}
            </GoalContainer>
          </div>

          {/* Vision Board */}
          <div className="h-full">
            <VisionBoard />
          </div>
        </main>
      </div>
    </DragDropContext>
  );
}
