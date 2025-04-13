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
import HomePreferencePopover from "@/components/home-preference-popover";

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
    positionsByDate: {},
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
    positionsByDate: {},
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
    positionsByDate: {},
  },
];

export default function Home() {
  // Get tasks and actions from the Zustand store
  const {
    tasks,
    addTask,
    getTasksForDate,
    updateTask,
    reorderTasks,
    getTaskPositionForDate,
  } = useTaskStore();

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
  const showTodayButton = !isCurrentDateToday || daysFromToday >= 3;

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

  // Helper function to get all task IDs for a specific day
  const getTaskIdsForDay = (date: string) => {
    const tasksForDay = getTasksForDate(date);
    return tasksForDay.map((task) => {
      const isRepeating = isTaskRepeating(task, date);
      return isRepeating ? `${task.id}:${date}` : task.id;
    });
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
      const taskIds = getTaskIdsForDay(sourceDate);

      // Reorder the task IDs
      const [removed] = taskIds.splice(source.index, 1);
      taskIds.splice(destination.index, 0, removed);

      // Convert back to original task IDs for reordering
      const reorderedTaskIds = taskIds.map(extractTaskId);

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
            positionsByDate: {},
          };

          // Add the new one-time task
          addTask(newTask);

          // Get the current task IDs for the destination day
          const destinationTaskIds =
            getTaskIdsForDay(destinationDate).map(extractTaskId);

          // Insert the new task at the destination index
          destinationTaskIds.splice(destination.index, 0, newTask.id);

          // Update the positions
          reorderTasks(destinationDate, destinationTaskIds);
        } else {
          // For non-repeating tasks, update the due date
          updateTask(taskId, { dueDate: destinationDate });

          // Remove the task from the source container's order
          const sourceTaskIds = getTaskIdsForDay(sourceDate)
            .filter((id) => extractTaskId(id) !== taskId)
            .map(extractTaskId);

          // Update the source container order
          reorderTasks(sourceDate, sourceTaskIds);

          // Get the current task IDs for the destination day (excluding the task we're moving)
          const destinationTaskIds = getTaskIdsForDay(destinationDate)
            .filter((id) => extractTaskId(id) !== taskId) // Remove the task if it's already in the list
            .map(extractTaskId);

          // Insert the task at the destination index
          destinationTaskIds.splice(destination.index, 0, taskId);

          // Update the destination container order
          reorderTasks(destinationDate, destinationTaskIds);
        }
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen flex flex-col items-end">
        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
          {/* <div className="flex items-center ml-8"></div> */}

          <div className="flex items-center ml-auto">
            {showTodayButton && (
              <Button
                variant="secondary"
                size="sm"
                onClick={navigateToToday}
                className="font-normal mr-2"
              >
                <span>Today</span>
              </Button>
            )}
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

            <HomePreferencePopover>
              <Button size="icon" variant="ghost" className="ml-2">
                <span className="sr-only">Settings</span>
                <Settings2Icon />
              </Button>
            </HomePreferencePopover>
          </div>
        </header>
        <main className="w-full h-full bg-muted/20 grid grid-cols-5 gap-1 p-1 pt-0">
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
                  position={getTaskPositionForDate(task.id, yesterdayDate)}
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
                  position={getTaskPositionForDate(task.id, currentDate)}
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
                  position={getTaskPositionForDate(task.id, tomorrowDate)}
                  index={index}
                  isRepeating={isRepeating}
                />
              );
            })}
          </DayContainer>

          {/* Week Goal */}
          <GoalContainer title="Week 24" subtitle="Weekly Goals">
            {/* Week goal content would go here */}
          </GoalContainer>

          {/* Month Goal */}
          <GoalContainer title="January" subtitle="Monthly Goals">
            {/* Month goal content would go here */}
          </GoalContainer>
        </main>
      </div>
    </DragDropContext>
  );
}
