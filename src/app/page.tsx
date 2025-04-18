"use client";

import { useState, useEffect } from "react";
import {
  format,
  addDays,
  subDays,
  isToday,
  differenceInDays,
  getWeek,
  getYear,
} from "date-fns";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2Icon,
} from "lucide-react";

import DayContainer from "@/components/day-container";
import GoalContainer from "@/components/goal-container";
import TaskCard from "@/components/task-card";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import HomePreferencePopover, {
  type HomePreferences,
  defaultPreferences,
} from "@/components/home-preference-popover";
import { Button } from "@/components/ui/button";
import { useTaskStore, type Task } from "@/stores/useTaskStore";

// Initial tasks with proper typing
const initialTasksData: Task[] = [
  {
    id: "1",
    name: "Complete project proposal",
    description: "Finish the draft and send it to the team for review",
    isCompleted: false,
    type: "daily",
    dueDate: "2025-04-10",
    tags: ["Work"],
    priority: "high",
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
    type: "daily",
    dueDate: "2025-04-10",
    tags: ["Health"],
    priority: "medium",
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
    type: "daily",
    dueDate: "2025-04-11",
    tags: ["Personal"],
    priority: "low",
    repeatedDays: [],
    pomodoros: 0,
    position: 1,
    completedDates: [],
    positionsByDate: {},
  },
  // Add some initial goals
  {
    id: "4",
    name: "Complete online course",
    description: "Finish the React advanced course",
    isCompleted: false,
    type: "weekly",
    timeFrameKey: `${new Date().getFullYear()}-W${getWeek(new Date(), {
      weekStartsOn: 1,
    })
      .toString()
      .padStart(2, "0")}`,
    tags: ["Learning"],
    priority: "medium",
    pomodoros: 0,
    position: 1,
    repeatedDays: ["weekly"], // Indicates this goal repeats weekly
  },
  {
    id: "5",
    name: "Read 2 books",
    description: "Fiction and non-fiction",
    isCompleted: false,
    type: "monthly",
    timeFrameKey: `${new Date().getFullYear()}-${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0")}`,
    tags: ["Personal"],
    priority: "low",
    pomodoros: 0,
    position: 1,
    repeatedDays: ["monthly"], // Indicates this goal repeats monthly
  },
  {
    id: "6",
    name: "Learn a new language",
    description: "Reach intermediate level in Spanish",
    isCompleted: false,
    type: "yearly",
    timeFrameKey: `${new Date().getFullYear()}`,
    tags: ["Learning"],
    priority: "high",
    pomodoros: 0,
    position: 1,
    repeatedDays: ["yearly"], // Indicates this goal repeats yearly
  },
];

export default function Home() {
  // Get tasks and actions from the Zustand store
  const {
    tasks,
    addTask,
    getTasksForDate,
    getTasksByType,
    updateTask,
    reorderTasks,
    getTaskPositionForDate,
    isTaskCompletedOnDate,
  } = useTaskStore();

  // Current date state for navigation
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // User preferences state
  const [preferences, setPreferences] =
    useState<HomePreferences>(defaultPreferences);

  // Load preferences from localStorage on initial render
  useEffect(() => {
    const savedPreferences = localStorage.getItem("homePreferences");
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences({
          ...defaultPreferences,
          ...parsedPreferences,
        });
      } catch (e) {
        console.error("Error loading preferences:", e);
      }
    }
  }, []);

  // Handle preferences change
  const handlePreferencesChange = (newPreferences: HomePreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem("homePreferences", JSON.stringify(newPreferences));
  };

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

  // Get current week, month, and year for goals
  const now = new Date();
  const currentWeek = `${getYear(now)}-W${getWeek(now, { weekStartsOn: 1 })
    .toString()
    .padStart(2, "0")}`;
  const currentMonth = `${getYear(now)}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
  const currentYear = getYear(now).toString();

  // Get goals for current week, month, and year
  const weeklyGoals = getTasksByType("weekly", currentWeek);
  const monthlyGoals = getTasksByType("monthly", currentMonth);
  const yearlyGoals = getTasksByType("yearly", currentYear);
  const lifeGoals = getTasksByType("life", "life");

  // Apply filters based on preferences
  const filterTasks = (tasks: Task[], date: string) => {
    let filteredTasks = [...tasks];

    // Filter by completion status - handle both regular completion and date-specific completion
    if (!preferences.showCompleted) {
      filteredTasks = filteredTasks.filter((task) => {
        // For repeating tasks or tasks shown on a different day than their due date
        if (
          (task.type === "daily" && task.repeatedDays?.length) ||
          (task.type === "daily" && task.dueDate !== date)
        ) {
          return !isTaskCompletedOnDate(task.id, date);
        }
        // For non-repeating tasks
        return !task.isCompleted;
      });
    }

    // Filter by habits (repeated tasks)
    if (!preferences.showHabits) {
      filteredTasks = filteredTasks.filter(
        (task) => !task.repeatedDays?.length
      );
    }

    // Filter by tags - case insensitive comparison
    if (preferences.selectedTags.length > 0) {
      filteredTasks = filteredTasks.filter((task) => {
        if (!task.tags || task.tags.length === 0) return false;
        return preferences.selectedTags.some((selectedTag) =>
          task.tags!.some(
            (taskTag) => taskTag.toLowerCase() === selectedTag.toLowerCase()
          )
        );
      });
    }

    // Filter by priority
    if (preferences.selectedPriority !== null) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === preferences.selectedPriority
      );
    }

    return filteredTasks;
  };

  // Apply filters to all task lists
  const filteredYesterdayTasks = filterTasks(yesterdayTasks, yesterdayDate);
  const filteredTodayTasks = filterTasks(todayTasks, currentDate);
  const filteredTomorrowTasks = filterTasks(tomorrowTasks, tomorrowDate);
  const filteredWeeklyGoals = filterTasks(weeklyGoals, currentDate);
  const filteredMonthlyGoals = filterTasks(monthlyGoals, currentDate);
  const filteredYearlyGoals = filterTasks(yearlyGoals, currentDate);
  const filteredLifeGoals = filterTasks(lifeGoals, currentDate);

  // Navigation functions
  const navigatePreviousDay = () => {
    setCurrentDate(format(subDays(new Date(currentDate), 1), "yyyy-MM-dd"));
  };

  const navigateNextDay = () => {
    setCurrentDate(format(addDays(new Date(currentDate), 1), "yyyy-MM-dd"));
  };

  const navigatePreviousWeek = () => {
    setCurrentDate(format(subDays(new Date(currentDate), 7), "yyyy-MM-dd"));
  };

  const navigateNextWeek = () => {
    setCurrentDate(format(addDays(new Date(currentDate), 7), "yyyy-MM-dd"));
  };

  // Navigate back to today
  const navigateToToday = () => {
    setCurrentDate(format(new Date(), "yyyy-MM-dd"));
  };

  // Helper function to determine if a task is repeating or shown on a different day
  const isTaskRepeating = (task: Task, date: string): boolean => {
    return Boolean(task.repeatedDays?.length) || task.dueDate !== date;
  };

  // Helper function to extract the original task ID from a draggable ID
  const extractTaskId = (draggableId: string): string => {
    return draggableId.includes(":") ? draggableId.split(":")[0] : draggableId;
  };

  // Helper function to get all task IDs for a specific day
  const getTaskIdsForDay = (date: string): string[] => {
    const tasksForDay = getTasksForDate(date);
    return tasksForDay.map((task) => {
      const isRepeating = isTaskRepeating(task, date);
      return isRepeating ? `${task.id}:${date}` : task.id;
    });
  };

  // Helper function to get all goal IDs for a specific type and timeframe
  const getGoalIds = (type: Task["type"], timeFrameKey: string): string[] => {
    const goals = getTasksByType(type, timeFrameKey);
    return goals.map((goal) => goal.id);
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
    const taskId = extractTaskId(draggableId);

    // Check if source and destination are day containers or goal containers
    const isSourceDayContainer = !source.droppableId.includes(":");
    const isDestDayContainer = !destination.droppableId.includes(":");

    // If moving within the same container type (day-to-day or goal-to-goal of same type)
    if (source.droppableId === destination.droppableId) {
      // Get all task IDs for this container
      let taskIds: string[];

      if (isSourceDayContainer) {
        // Day container
        taskIds = getTaskIdsForDay(source.droppableId);
      } else {
        // Goal container - extract type and timeFrameKey from droppableId
        const [type, timeFrameKey] = source.droppableId.split(":");
        taskIds = getGoalIds(type as Task["type"], timeFrameKey);
      }

      // Reorder the task IDs
      const [removed] = taskIds.splice(source.index, 1);
      taskIds.splice(destination.index, 0, removed);

      // Convert back to original task IDs for reordering
      const reorderedTaskIds = taskIds.map(extractTaskId);

      // Update the task positions
      if (isSourceDayContainer) {
        reorderTasks(source.droppableId, reorderedTaskIds);
      } else {
        // For goals, we use the timeFrameKey for reordering
        const [, timeFrameKey] = source.droppableId.split(":");
        reorderTasks(timeFrameKey, reorderedTaskIds);
      }
    } else {
      // Moving between different containers
      const task = tasks.find((t) => t.id === taskId);

      if (!task) return;

      // Handle moving between day containers
      if (isSourceDayContainer && isDestDayContainer) {
        if (task.repeatedDays?.length) {
          // For repeating tasks, create a new one-time task for the destination date
          const newTask: Task = {
            id: uuidv4(),
            name: task.name,
            description: task.description,
            isCompleted: false,
            type: "daily",
            dueDate: destination.droppableId,
            tags: task.tags,
            priority: task.priority,
            repeatedDays: [],
            pomodoros: task.pomodoros,
            position: 999,
            completedDates: [],
            positionsByDate: {},
          };

          // Add the new one-time task
          addTask(newTask);

          // Get the current task IDs for the destination day
          const destinationTaskIds = getTaskIdsForDay(
            destination.droppableId
          ).map(extractTaskId);

          // Insert the new task at the destination index
          destinationTaskIds.splice(destination.index, 0, newTask.id);

          // Update the positions
          reorderTasks(destination.droppableId, destinationTaskIds);
        } else {
          // For non-repeating tasks, update the due date
          updateTask(taskId, { dueDate: destination.droppableId });

          // Remove the task from the source container's order
          const sourceTaskIds = getTaskIdsForDay(source.droppableId)
            .filter((id) => extractTaskId(id) !== taskId)
            .map(extractTaskId);

          // Update the source container order
          reorderTasks(source.droppableId, sourceTaskIds);

          // Get the current task IDs for the destination day
          const destinationTaskIds = getTaskIdsForDay(destination.droppableId)
            .filter((id) => extractTaskId(id) !== taskId)
            .map(extractTaskId);

          // Insert the task at the destination index
          destinationTaskIds.splice(destination.index, 0, taskId);

          // Update the destination container order
          reorderTasks(destination.droppableId, destinationTaskIds);
        }
      }
      // Handle moving between goal containers or between day and goal containers
      else {
        // Extract type and timeFrameKey from destination droppableId if it's a goal container
        let destType: Task["type"] = "daily";
        let destTimeFrameKey: string | undefined;

        if (!isDestDayContainer) {
          const [type, timeFrameKey] = destination.droppableId.split(":");
          destType = type as Task["type"];
          destTimeFrameKey = timeFrameKey;
        }

        // Check if we should duplicate or move
        const shouldDuplicate =
          preferences.duplicateWhenDragging ||
          task.repeatedDays?.length ||
          false;

        if (shouldDuplicate) {
          // Create a new task with appropriate type and timeFrameKey (duplicate behavior)
          const newTask: Task = {
            id: uuidv4(),
            name: task.name,
            description: task.description,
            isCompleted: false,
            type: destType,
            dueDate: isDestDayContainer ? destination.droppableId : undefined,
            timeFrameKey: destTimeFrameKey,
            tags: task.tags,
            priority: task.priority,
            // Don't make it repetitive by default
            repeatedDays: [],
            pomodoros: task.pomodoros,
            position: 999,
            completedDates: [],
            positionsByDate: {},
            positionsByTimeFrame: {},
          };

          // Add the new task
          addTask(newTask);

          // Get the current task IDs for the destination container
          let destinationTaskIds: string[];

          if (isDestDayContainer) {
            destinationTaskIds = getTaskIdsForDay(destination.droppableId).map(
              extractTaskId
            );
          } else {
            destinationTaskIds = getGoalIds(
              destType,
              destTimeFrameKey || ""
            ).map(extractTaskId);
          }

          // Insert the new task at the destination index
          destinationTaskIds.splice(destination.index, 0, newTask.id);

          // Update the positions
          if (isDestDayContainer) {
            reorderTasks(destination.droppableId, destinationTaskIds);
          } else if (destTimeFrameKey) {
            reorderTasks(destTimeFrameKey, destinationTaskIds);
          }
        } else {
          // Move the task by updating its type and other properties
          const updates: Partial<Task> = {
            type: destType,
          };

          if (isDestDayContainer) {
            updates.dueDate = destination.droppableId;
            updates.timeFrameKey = undefined;
          } else {
            updates.dueDate = undefined;
            updates.timeFrameKey = destTimeFrameKey;
          }

          updateTask(taskId, updates);

          // Remove from source container
          if (isSourceDayContainer) {
            const sourceTaskIds = getTaskIdsForDay(source.droppableId)
              .filter((id) => extractTaskId(id) !== taskId)
              .map(extractTaskId);
            reorderTasks(source.droppableId, sourceTaskIds);
          } else {
            const [, sourceTimeFrameKey] = source.droppableId.split(":");
            const sourceTaskIds = getGoalIds(task.type, sourceTimeFrameKey)
              .filter((id) => id !== taskId)
              .map(extractTaskId);
            reorderTasks(sourceTimeFrameKey, sourceTaskIds);
          }

          // Add to destination container
          let destinationTaskIds: string[];
          if (isDestDayContainer) {
            destinationTaskIds = getTaskIdsForDay(destination.droppableId)
              .filter((id) => extractTaskId(id) !== taskId)
              .map(extractTaskId);
          } else {
            destinationTaskIds = getGoalIds(destType, destTimeFrameKey || "")
              .filter((id) => id !== taskId)
              .map(extractTaskId);
          }

          // Insert at destination index
          destinationTaskIds.splice(destination.index, 0, taskId);

          // Update positions
          if (isDestDayContainer) {
            reorderTasks(destination.droppableId, destinationTaskIds);
          } else if (destTimeFrameKey) {
            reorderTasks(destTimeFrameKey, destinationTaskIds);
          }
        }
      }
    }
  };

  // Render the task card component with proper props
  const renderTaskCard = (task: Task, date: string, index: number) => {
    const isRepeating = isTaskRepeating(task, date);
    return (
      <TaskCard
        key={isRepeating ? `${task.id}-${date}` : task.id}
        id={task.id}
        name={task.name}
        description={task.description}
        type={task.type}
        tags={task.tags || []}
        priority={task.priority}
        timeFrameKey={task.timeFrameKey}
        repeatedDays={task.repeatedDays || []}
        dueDate={task.dueDate}
        date={date}
        pomodoros={task.pomodoros || 0}
        position={getTaskPositionForDate(task.id, date)}
        index={index}
        isRepeating={isRepeating}
      />
    );
  };

  // Render the goal card component with proper props
  const renderGoalCard = (goal: Task, index: number) => {
    return (
      <TaskCard
        key={goal.id}
        id={goal.id}
        name={goal.name}
        description={goal.description}
        type={goal.type}
        tags={goal.tags || []}
        priority={goal.priority}
        timeFrameKey={goal.timeFrameKey}
        dueDate={goal.dueDate}
        date={currentDate} // Use current date as context
        pomodoros={goal.pomodoros || 0}
        position={goal.position || 999}
        index={index}
        isRepeating={false}
        repeatedDays={goal.repeatedDays || []}
      />
    );
  };

  // Format week number and year for display
  const formatWeekDisplay = () => {
    const weekNumber = getWeek(new Date(), { weekStartsOn: 1 });
    return `Week ${weekNumber}`;
  };

  // Format month for display
  const formatMonthDisplay = () => {
    return format(new Date(), "MMMM");
  };

  // Map board types to their components
  const boardComponents = {
    yesterday: (
      <DayContainer
        date={yesterdayDate}
        tasks={filteredYesterdayTasks}
        droppableId={yesterdayDate}
      >
        {filteredYesterdayTasks.map((task, index) =>
          renderTaskCard(task, yesterdayDate, index)
        )}
      </DayContainer>
    ),
    today: (
      <DayContainer
        date={currentDate}
        tasks={filteredTodayTasks}
        droppableId={currentDate}
      >
        {filteredTodayTasks.map((task, index) =>
          renderTaskCard(task, currentDate, index)
        )}
      </DayContainer>
    ),
    tomorrow: (
      <DayContainer
        date={tomorrowDate}
        tasks={filteredTomorrowTasks}
        droppableId={tomorrowDate}
      >
        {filteredTomorrowTasks.map((task, index) =>
          renderTaskCard(task, tomorrowDate, index)
        )}
      </DayContainer>
    ),
    week: (
      <GoalContainer
        title={formatWeekDisplay()}
        subtitle="Weekly Goals"
        type="weekly"
        timeFrameKey={currentWeek}
        droppableId={`weekly:${currentWeek}`}
        status="current"
      >
        {filteredWeeklyGoals.map((goal, index) => renderGoalCard(goal, index))}
      </GoalContainer>
    ),
    month: (
      <GoalContainer
        title={formatMonthDisplay()}
        subtitle="Monthly Goals"
        type="monthly"
        timeFrameKey={currentMonth}
        droppableId={`monthly:${currentMonth}`}
        status="current"
      >
        {filteredMonthlyGoals.map((goal, index) => renderGoalCard(goal, index))}
      </GoalContainer>
    ),
    year: (
      <GoalContainer
        title={currentYear}
        subtitle="Yearly Goals"
        type="yearly"
        timeFrameKey={currentYear}
        droppableId={`yearly:${currentYear}`}
        status="current"
      >
        {filteredYearlyGoals.map((goal, index) => renderGoalCard(goal, index))}
      </GoalContainer>
    ),
    life: (
      <GoalContainer
        title="Life Goals"
        subtitle="Long-term Goals"
        type="life"
        timeFrameKey="life"
        droppableId="life:life"
        status="current"
      >
        {filteredLifeGoals.map((goal, index) => renderGoalCard(goal, index))}
      </GoalContainer>
    ),
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen flex flex-col items-end">
        {/* Keyboard shortcuts component */}
        <KeyboardShortcuts />

        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
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

            <HomePreferencePopover
              preferences={preferences}
              onPreferencesChange={handlePreferencesChange}
            >
              <Button size="icon" variant="ghost" className="ml-2">
                <span className="sr-only">Settings</span>
                <Settings2Icon />
              </Button>
            </HomePreferencePopover>
          </div>
        </header>
        <main className="w-full h-full bg-muted/20 grid grid-cols-5 gap-1 p-1 pt-0 overflow-hidden">
          {/* Render boards based on user preferences */}
          {preferences.selectedDays.map((boardId) => (
            <div key={boardId} className="w-full h-full">
              {boardComponents[boardId as keyof typeof boardComponents]}
            </div>
          ))}
        </main>
      </div>
    </DragDropContext>
  );
}
