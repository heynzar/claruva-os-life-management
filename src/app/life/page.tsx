"use client";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { PlusCircle, Printer } from "lucide-react";

import GoalContainer from "@/components/goal-container";
import TaskCard from "@/components/task-card";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import { useTaskStore, type Task } from "@/stores/useTaskStore";
import VisionBoard from "@/components/vision-board";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { v4 as uuidv4 } from "uuid";
import { useVisionBoardStore } from "@/stores/useVisionBoardStore";

export default function LifePage() {
  const { items, addItem } = useVisionBoardStore();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [multipleUrls, setMultipleUrls] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textBackground, setTextBackground] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Handle file selection for uploads
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  // Handle uploading multiple files
  const handleUploadMultipleFiles = () => {
    if (selectedFiles.length === 0) return;

    const processFiles = async () => {
      for (const file of selectedFiles) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            if (imageUrl) {
              addItem({
                id: uuidv4(),
                x: 0,
                y: Infinity, // Add at the bottom
                width: 2,
                height: 2,
                imageUrl,
                isText: false,
              });
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    };

    processFiles().then(() => {
      setSelectedFiles([]);
      setAddDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  // Handle adding multiple URLs
  const handleAddMultipleUrls = () => {
    const urls = multipleUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) return;

    urls.forEach((url) => {
      addItem({
        id: uuidv4(),
        x: 0,
        y: Infinity, // Add at the bottom
        width: 2,
        height: 2,
        imageUrl: url,
        isText: false,
      });
    });

    setMultipleUrls("");
    setAddDialogOpen(false);
  };

  // Handle adding text
  const handleAddText = () => {
    if (!textContent.trim()) return;

    addItem({
      id: uuidv4(),
      x: 0,
      y: Infinity, // Add at the bottom
      width: 2,
      height: 2,
      imageUrl: "", // No image for text items
      caption: textContent,
      textBackground,
      textColor,
      fontSize,
      isText: true,
    });

    setTextContent("");
    setTextBackground("#ffffff");
    setTextColor("#000000");
    setFontSize(16);
    setAddDialogOpen(false);
  };

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

    // Extract the original task ID from the draggable ID
    const taskId = draggableId.includes(":")
      ? draggableId.split(":")[0]
      : draggableId;

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
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost">
                  <PlusCircle />
                  Add Content
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-2">
                <DialogHeader className="sr-only">
                  <DialogTitle>Add to Vision Board</DialogTitle>
                  <DialogDescription>
                    Add images or text to visualize your goals and dreams
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="upload">
                  <TabsList className="grid bg-transparent gap-1 w-full grid-cols-3">
                    <TabsTrigger value="upload">Upload Images</TabsTrigger>
                    <TabsTrigger value="urls">Image URLs</TabsTrigger>
                    <TabsTrigger value="text">Add Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Upload Images
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileSelection}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {selectedFiles.length > 0 && (
                        <p className="mt-2 text-sm text-blue-500">
                          {selectedFiles.length} file(s) selected
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <Button
                        onClick={handleUploadMultipleFiles}
                        disabled={selectedFiles.length === 0}
                        className="flex-1"
                      >
                        Upload{" "}
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} Image${
                              selectedFiles.length > 1 ? "s" : ""
                            }`
                          : "Images"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="urls" className="mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Image URLs (one per line)
                      </label>
                      <Textarea
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        value={multipleUrls}
                        onChange={(e) => setMultipleUrls(e.target.value)}
                        className="w-full min-h-32"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <Button
                        onClick={handleAddMultipleUrls}
                        disabled={!multipleUrls.trim()}
                        className="flex-1"
                      >
                        Add Images from URLs
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="text" className="mt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Text Content
                      </label>
                      <Textarea
                        placeholder="Your affirmation or goal text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="w-full min-h-24"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Background Color
                        </label>
                        <div className="flex items-center">
                          <input
                            type="color"
                            value={textBackground}
                            onChange={(e) => setTextBackground(e.target.value)}
                            className="w-8 h-8 mr-2 border rounded"
                          />
                          <Input
                            type="text"
                            value={textBackground}
                            onChange={(e) => setTextBackground(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Text Color
                        </label>
                        <div className="flex items-center">
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-8 h-8 mr-2 border rounded"
                          />
                          <Input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Font Size: {fontSize}px
                      </label>
                      <Slider
                        defaultValue={[fontSize]}
                        min={10}
                        max={40}
                        step={1}
                        onValueChange={(value) => setFontSize(value[0])}
                        className="w-full"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Preview
                      </label>
                      <div
                        style={{
                          backgroundColor: textBackground,
                          color: textColor,
                          fontSize: `${fontSize}px`,
                        }}
                        className="p-4 rounded border flex items-center justify-center text-center min-h-24"
                      >
                        {textContent || "Preview text will appear here"}
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Button
                        onClick={handleAddText}
                        disabled={!textContent.trim()}
                        className="flex-1"
                      >
                        Add Text Block
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

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
