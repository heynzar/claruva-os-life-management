"use client";
import Sidebar from "@/components/sidebar/sidebar";
import DayContainer from "@/components/day-container";
import GoalContainer from "@/components/goal-container";
import TaskCard from "@/components/task-card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2Icon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { format, addDays, subDays, isToday, differenceInDays } from "date-fns";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";

// Initial tasks that match the Task type from the Zustand store
const initialTasksData = [
  {
    id: "1",
    name: "Complete project proposal",
    description: "Finish the draft and send it to the team for review",
    isCompleted: false,
    dueDate: "2025-04-10",
    goalId: "work",
    repeatedDays: ["Monday", "Wednesday", "Friday"],
    pomodoros: 2,
    position: 1,
    completedDates: [],
  },
  {
    id: "2",
    name: "Go for a run",
    description: "30 minutes jogging in the park",
    isCompleted: true,
    dueDate: "2025-04-10",
    goalId: "health",
    repeatedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    pomodoros: 1,
    position: 2,
    completedDates: [],
  },
  {
    id: "3",
    name: "Buy groceries",
    description: "Milk, eggs, bread, and vegetables",
    isCompleted: true,
    dueDate: "2025-04-11",
    goalId: "personal",
    repeatedDays: [],
    pomodoros: 0,
    position: 1,
    completedDates: [],
  },
];

export default function Home() {
  // Get tasks and actions from the Zustand store
  const { tasks, addTask, getTasksForDate, updateTask, reorderTasks } =
    useTaskStore();

  // Current date state for navigation
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // Check if we're showing today or a different day
  const isCurrentDateToday = isToday(new Date(currentDate));

  // Check if we're more than 3 days away from today
  const daysFromToday = Math.abs(
    differenceInDays(new Date(), new Date(currentDate))
  );
  const showTodayButton = !isCurrentDateToday && daysFromToday >= 2;

  // Initialize the store with data if it's empty
  useEffect(() => {
    if (tasks.length === 0) {
      initialTasksData.forEach((task) => {
        addTask(task);
      });
    }
  }, [tasks, addTask]);

  // Get tasks for yesterday, today, and tomorrow
  const yesterdayDate = format(subDays(new Date(currentDate), 1), "yyyy-MM-dd");
  const yesterdayTasks = getTasksForDate(yesterdayDate);
  const todayTasks = getTasksForDate(currentDate);
  const tomorrowDate = format(addDays(new Date(currentDate), 1), "yyyy-MM-dd");
  const tomorrowTasks = getTasksForDate(tomorrowDate);

  // Navigation functions
  const navigatePreviousDay = () => {
    setCurrentDate(format(addDays(new Date(currentDate), -1), "yyyy-MM-dd"));
  };

  const navigateNextDay = () => {
    setCurrentDate(format(addDays(new Date(currentDate), 1), "yyyy-MM-dd"));
  };

  const navigatePreviousWeek = () => {
    setCurrentDate(format(addDays(new Date(currentDate), -7), "yyyy-MM-dd"));
  };

  const navigateNextWeek = () => {
    setCurrentDate(format(addDays(new Date(currentDate), 7), "yyyy-MM-dd"));
  };

  // Navigate back to today
  const navigateToToday = () => {
    setCurrentDate(format(new Date(), "yyyy-MM-dd"));
  };

  // Helper function to determine if a task is repeating or shown on a different day
  const isTaskRepeating = (task: any, date: string) => {
    return task.repeatedDays.length > 0 || task.dueDate !== date;
  };

  // Helper function to extract the original task ID from a draggable ID
  const extractTaskId = (draggableId: string) => {
    // If the ID contains a colon, it's a repeating task instance
    if (draggableId.includes(":")) {
      return draggableId.split(":")[0];
    }
    return draggableId;
  };

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back in its original position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Get the date from the droppable ID
    const sourceDate = source.droppableId;
    const destinationDate = destination.droppableId;

    // Extract the original task ID from the draggable ID
    const taskId = extractTaskId(draggableId);

    // If moving within the same day container, just reorder
    if (sourceDate === destinationDate) {
      // Get all task IDs for this day
      const dayTasks = getTasksForDate(sourceDate);

      // Create a map of unique draggable IDs to task IDs
      const taskIdMap = dayTasks.map((task) => {
        const isRepeating = isTaskRepeating(task, sourceDate);
        return isRepeating ? `${task.id}:${sourceDate}` : task.id;
      });

      // Reorder the task IDs
      const [removed] = taskIdMap.splice(source.index, 1);
      taskIdMap.splice(destination.index, 0, removed);

      // Convert back to original task IDs for reordering
      const reorderedTaskIds = taskIdMap.map(extractTaskId);

      // Update the task positions
      reorderTasks(sourceDate, reorderedTaskIds);
    } else {
      // Moving between day containers
      const task = tasks.find((t) => t.id === taskId);

      if (task) {
        if (task.repeatedDays.length > 0) {
          // For repeating tasks, create a new one-time task for the destination date
          // while keeping the original repeating task intact
          const newTask = {
            id: uuidv4(), // Generate a new ID for the one-time task
            name: task.name,
            description: task.description,
            isCompleted: false, // Start as not completed
            dueDate: destinationDate, // Set to the destination date
            goalId: task.goalId,
            repeatedDays: [], // Not repeating
            pomodoros: task.pomodoros,
            position: 999, // Will be reordered properly
            completedDates: [],
          };

          // Add the new one-time task
          addTask(newTask);

          // Reorder tasks in the destination container to place the new task
          // at the correct position
          const destinationTasks = getTasksForDate(destinationDate);
          const destinationTaskIds = destinationTasks
            .map((t) => {
              const isRepeating = isTaskRepeating(t, destinationDate);
              return isRepeating ? `${t.id}:${destinationDate}` : t.id;
            })
            .map(extractTaskId)
            .filter((id) => id !== newTask.id); // Remove the new task if it's already in the list

          // Add the new task at the destination index
          destinationTaskIds.splice(destination.index, 0, newTask.id);
          reorderTasks(destinationDate, destinationTaskIds);
        } else {
          // For non-repeating tasks, just update the due date
          updateTask(taskId, { dueDate: destinationDate });

          // Reorder tasks in both source and destination containers
          // Source container
          const sourceTasks = getTasksForDate(sourceDate);
          const sourceTaskIds = sourceTasks
            .map((t) => {
              const isRepeating = isTaskRepeating(t, sourceDate);
              return isRepeating ? `${t.id}:${sourceDate}` : t.id;
            })
            .filter((id) => extractTaskId(id) !== taskId)
            .map(extractTaskId);

          reorderTasks(sourceDate, sourceTaskIds);

          // Destination container
          const destinationTasks = getTasksForDate(destinationDate);
          const destinationTaskIds = destinationTasks
            .map((t) => {
              const isRepeating = isTaskRepeating(t, destinationDate);
              return isRepeating ? `${t.id}:${destinationDate}` : t.id;
            })
            .map(extractTaskId);

          // Add the task ID at the destination index if it's not already there
          if (!destinationTaskIds.includes(taskId)) {
            destinationTaskIds.splice(destination.index, 0, taskId);
            reorderTasks(destinationDate, destinationTaskIds);
          }
        }
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen flex flex-col items-end">
        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
          <div className="flex items-center ml-8">
            {/* Today button - only shown when not viewing today or when far from today */}
            {showTodayButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToToday}
                className="flex items-center gap-1.5"
              >
                <CalendarDays />
                <span>Today</span>
              </Button>
            )}
          </div>

          <div className="flex items-center">
            <Button size="icon" variant="ghost" onClick={navigatePreviousWeek}>
              <span className="sr-only">Jump by Week</span>
              <ChevronsLeft />
            </Button>
            <Button size="icon" variant="ghost" onClick={navigatePreviousDay}>
              <span className="sr-only">Jump by day</span>
              <ChevronLeft />
            </Button>
            <Button size="icon" variant="ghost" onClick={navigateNextDay}>
              <span className="sr-only">Jump by day</span>
              <ChevronRight />
            </Button>
            <Button size="icon" variant="ghost" onClick={navigateNextWeek}>
              <span className="sr-only">Jump by Week</span>
              <ChevronsRight />
            </Button>

            <Button size="icon" variant="ghost" className="ml-2">
              <span className="sr-only">Settings</span>
              <Settings2Icon />
            </Button>
          </div>
        </header>
        <main className="w-full h-full bg-muted/20 flex gap-1 p-1 pt-0">
          {/* Yesterday's tasks */}
          <DayContainer
            date={yesterdayDate}
            tasks={yesterdayTasks}
            droppableId={yesterdayDate}
          >
            {yesterdayTasks.map((task, index) => {
              const isRepeating = isTaskRepeating(task, yesterdayDate);
              return (
                <TaskCard
                  key={isRepeating ? `${task.id}:${yesterdayDate}` : task.id}
                  id={task.id}
                  name={task.name}
                  description={task.description}
                  isCompleted={task.isCompleted}
                  goalId={task.goalId}
                  repeatedDays={task.repeatedDays}
                  dueDate={task.dueDate}
                  date={yesterdayDate}
                  pomodoros={task.pomodoros}
                  position={task.position}
                  index={index}
                  isRepeating={isRepeating}
                />
              );
            })}
          </DayContainer>

          {/* Today's tasks */}
          <DayContainer
            date={currentDate}
            tasks={todayTasks}
            droppableId={currentDate}
          >
            {todayTasks.map((task, index) => {
              const isRepeating = isTaskRepeating(task, currentDate);
              return (
                <TaskCard
                  key={isRepeating ? `${task.id}:${currentDate}` : task.id}
                  id={task.id}
                  name={task.name}
                  description={task.description}
                  isCompleted={task.isCompleted}
                  goalId={task.goalId}
                  repeatedDays={task.repeatedDays}
                  dueDate={task.dueDate}
                  date={currentDate}
                  pomodoros={task.pomodoros}
                  position={task.position}
                  index={index}
                  isRepeating={isRepeating}
                />
              );
            })}
          </DayContainer>

          {/* Tomorrow's tasks */}
          <DayContainer
            date={tomorrowDate}
            tasks={tomorrowTasks}
            droppableId={tomorrowDate}
          >
            {tomorrowTasks.map((task, index) => {
              const isRepeating = isTaskRepeating(task, tomorrowDate);
              return (
                <TaskCard
                  key={isRepeating ? `${task.id}:${tomorrowDate}` : task.id}
                  id={task.id}
                  name={task.name}
                  description={task.description}
                  isCompleted={task.isCompleted}
                  goalId={task.goalId}
                  repeatedDays={task.repeatedDays}
                  dueDate={task.dueDate}
                  date={tomorrowDate}
                  pomodoros={task.pomodoros}
                  position={task.position}
                  index={index}
                  isRepeating={isRepeating}
                />
              );
            })}
          </DayContainer>

          {/* Week Goal */}
          <GoalContainer title="Week Goal" subtitle="Week 23">
            {/* Week goal content would go here */}
          </GoalContainer>

          {/* Month Goal */}
          <GoalContainer title="Month Goal" subtitle="January">
            {/* Month goal content would go here */}
          </GoalContainer>
        </main>
      </div>
    </DragDropContext>
  );
}
