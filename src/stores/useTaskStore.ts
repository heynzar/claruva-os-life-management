import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import { format } from "date-fns";

type Task = {
  id: string;
  name: string;
  description?: string;
  isCompleted: boolean;
  // 'daily' is a task with a dueDate
  // others are types of goals
  type: "daily" | "weekly" | "monthly" | "yearly" | "life";
  dueDate?: string; // Only for 'daily' type tasks (format: YYYY-MM-DD)
  timeFrameKey?: string; // e.g., "2025-W15" (for weekly), "2025-04" (monthly), etc.
  repeatedDays?: string[]; // Habit days: e.g., ['Monday', 'Thursday']
  pomodoros?: number;
  position?: number; // For static ordering (non-repeating)
  completedDates?: string[]; // For tracking recurring completions
  positionsByDate?: Record<string, number>; // Kanban order per day
  positionsByTimeFrame?: Record<string, number>; // For tracking positions of repeating goals in different timeframes
  priority: "low" | "medium" | "high";
  tags?: string[]; // E.g., ['Spiritual', 'Health', 'Work']
};

type TaskStore = {
  tasks: Task[];

  // Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string, date: string) => void;
  reorderTasks: (day: string, orderedIds: string[]) => void;
  setTaskPositionForDate: (
    taskId: string,
    date: string,
    position: number
  ) => void;
  setGoalPositionForTimeFrame: (
    taskId: string,
    timeFrame: string,
    position: number
  ) => void;

  // Selectors
  getTasksForDate: (date: string) => Task[];
  getTasksByType: (type: Task["type"], timeFrameKey?: string) => Task[];
  isTaskCompletedOnDate: (taskId: string, date: string) => boolean;
  getTaskPositionForDate: (taskId: string, date: string) => number;
  getGoalPositionForTimeFrame: (taskId: string, timeFrame: string) => number;
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      // ➕ Add new task
      addTask: (task) =>
        set(
          produce((state: TaskStore) => {
            // Initialize completedDates if not present
            if (!task.completedDates) {
              task.completedDates = [];
            }

            // Initialize positionsByDate if not present
            if (!task.positionsByDate) {
              task.positionsByDate = {};
            }

            // Initialize positionsByTimeFrame if not present
            if (!task.positionsByTimeFrame) {
              task.positionsByTimeFrame = {};
            }

            // Set position if not provided
            if (!task.position) {
              if (task.type === "daily" && task.dueDate) {
                // Find the highest position for tasks on this day
                const tasksForDay = state.tasks.filter(
                  (t) =>
                    (t.type === "daily" && t.dueDate === task.dueDate) ||
                    (t.type === "daily" &&
                      t.repeatedDays?.length &&
                      task.dueDate &&
                      t.repeatedDays.includes(
                        format(new Date(task.dueDate), "EEEE")
                      ))
                );
                const maxPosition = tasksForDay.reduce(
                  (max, t) => Math.max(max, t.position || 0),
                  0
                );
                task.position = maxPosition + 1;
              } else {
                // For goal-type tasks, find max position of same type
                const tasksOfSameType = state.tasks.filter(
                  (t) =>
                    t.type === task.type && t.timeFrameKey === task.timeFrameKey
                );
                const maxPosition = tasksOfSameType.reduce(
                  (max, t) => Math.max(max, t.position || 0),
                  0
                );
                task.position = maxPosition + 1;
              }
            }

            // If it's a repeating task, set the initial position for the due date
            if (
              task.type === "daily" &&
              task.repeatedDays?.length &&
              task.dueDate
            ) {
              task.positionsByDate[task.dueDate] = task.position || 0;
            }

            // If it's a repeating goal, set the initial position for the timeframe
            if (
              task.type !== "daily" &&
              task.repeatedDays?.length &&
              task.timeFrameKey
            ) {
              task.positionsByTimeFrame[task.timeFrameKey] = task.position || 0;
            }

            state.tasks.push(task);
          })
        ),

      // 📝 Update task
      updateTask: (id, updates) =>
        set(
          produce((state: TaskStore) => {
            const index = state.tasks.findIndex((t) => t.id === id);
            if (index !== -1) {
              state.tasks[index] = { ...state.tasks[index], ...updates };
            }
          })
        ),

      // ❌ Delete task
      deleteTask: (id) =>
        set(
          produce((state: TaskStore) => {
            state.tasks = state.tasks.filter((t) => t.id !== id);
          })
        ),

      // ✅ Toggle complete for a specific date
      toggleComplete: (id, date) =>
        set(
          produce((state: TaskStore) => {
            const task = state.tasks.find((t) => t.id === id);
            if (!task) return;

            // For repeating tasks or tasks being completed on a date other than dueDate
            if (
              (task.type === "daily" && task.repeatedDays?.length) ||
              (task.type === "daily" && task.dueDate !== date)
            ) {
              if (!task.completedDates) {
                task.completedDates = [];
              }

              // Toggle completion for this specific date
              if (task.completedDates.includes(date)) {
                task.completedDates = task.completedDates.filter(
                  (d) => d !== date
                );
              } else {
                task.completedDates.push(date);
              }
            } else {
              // For non-repeating tasks on their due date, or for goal-type tasks
              task.isCompleted = !task.isCompleted;
            }

            // Play sound when task is completed
            if (task.isCompleted || task.completedDates?.includes(date)) {
              const audio = new Audio("/check.wav");
              audio.play();
            }
          })
        ),

      // Set position for a task on a specific date
      setTaskPositionForDate: (taskId, date, position) =>
        set(
          produce((state: TaskStore) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (!task) return;

            // For repeating daily tasks or tasks on date other than due date
            if (
              (task.type === "daily" && task.repeatedDays?.length) ||
              (task.type === "daily" && task.dueDate !== date)
            ) {
              if (!task.positionsByDate) {
                task.positionsByDate = {};
              }
              task.positionsByDate[date] = position;
            } else {
              // For non-repeating tasks or goal-type tasks
              task.position = position;
            }
          })
        ),

      // Set position for a goal in a specific timeframe
      setGoalPositionForTimeFrame: (taskId, timeFrame, position) =>
        set(
          produce((state: TaskStore) => {
            const task = state.tasks.find((t) => t.id === taskId);
            if (!task) return;

            // For repeating goals
            if (task.type !== "daily" && task.repeatedDays?.length) {
              if (!task.positionsByTimeFrame) {
                task.positionsByTimeFrame = {};
              }
              task.positionsByTimeFrame[timeFrame] = position;
            } else {
              // For non-repeating goals
              task.position = position;
            }
          })
        ),

      // 🔁 Reorder tasks based on sorted ids for a given day
      reorderTasks: (day, orderedIds) =>
        set(
          produce((state: TaskStore) => {
            // Update positions for all tasks in the ordered list
            orderedIds.forEach((id, index) => {
              const taskIndex = state.tasks.findIndex((t) => t.id === id);
              if (taskIndex !== -1) {
                const task = state.tasks[taskIndex];

                // For repeating daily tasks or tasks on date other than due date
                if (
                  (task.type === "daily" && task.repeatedDays?.length) ||
                  (task.type === "daily" && task.dueDate !== day)
                ) {
                  if (!task.positionsByDate) {
                    task.positionsByDate = {};
                  }
                  task.positionsByDate[day] = index + 1;
                } else if (task.type !== "daily" && task.repeatedDays?.length) {
                  // For repeating goals
                  if (!task.positionsByTimeFrame) {
                    task.positionsByTimeFrame = {};
                  }
                  task.positionsByTimeFrame[day] = index + 1;
                } else {
                  // For non-repeating tasks or goal-type tasks
                  task.position = index + 1;
                }
              }
            });
          })
        ),

      // Get position for a task on a specific date
      getTaskPositionForDate: (taskId, date) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return 999;

        // For repeating daily tasks or tasks on date other than due date
        if (
          (task.type === "daily" && task.repeatedDays?.length) ||
          (task.type === "daily" && task.dueDate !== date)
        ) {
          return task.positionsByDate?.[date] || task.position || 999;
        }

        // For non-repeating tasks or goal-type tasks
        return task.position || 999;
      },

      // Get position for a goal in a specific timeframe
      getGoalPositionForTimeFrame: (taskId, timeFrame) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return 999;

        // For repeating goals
        if (task.type !== "daily" && task.repeatedDays?.length) {
          return task.positionsByTimeFrame?.[timeFrame] || task.position || 999;
        }

        // For non-repeating goals
        return task.position || 999;
      },

      // 📆 Get tasks for a specific day (only daily tasks)
      getTasksForDate: (date) => {
        const dayOfWeek = format(new Date(date), "EEEE");
        const dateObj = new Date(date);
        const store = get();

        return store.tasks
          .filter((t) => {
            // Only consider daily tasks
            if (t.type !== "daily") return false;

            // Case 1: Task is due on this exact date
            if (t.dueDate === date) {
              return true;
            }

            // Case 2: Task is repetitive and should appear on this day of week
            if (t.repeatedDays?.includes(dayOfWeek)) {
              // Only show repetitive tasks on or after their due date
              if (t.dueDate) {
                const dueDate = new Date(t.dueDate);
                // Compare dates - only show if the current date is on or after the due date
                return dateObj >= dueDate;
              }
              return true; // If no due date is set, show on all matching days
            }

            return false;
          })
          .sort((a, b) => {
            // Sort by position, using the date-specific position if available
            const posA = store.getTaskPositionForDate(a.id, date);
            const posB = store.getTaskPositionForDate(b.id, date);
            return posA - posB;
          });
      },

      // Get tasks by type (for goals, etc.)
      getTasksByType: (type, timeFrameKey) => {
        const store = get();

        return store.tasks
          .filter((t) => {
            // Match the task type
            if (t.type !== type) return false;

            // If timeFrameKey is provided, match that too or check if it's a repe  return false

            // If timeFrameKey is provided, match that too or check if it's a repeating goal
            if (timeFrameKey) {
              // Check if it's a repeating goal that should appear in this timeframe
              const isRepeatingGoal = t.repeatedDays?.includes(type);

              // For repeating goals, check if the original timeFrameKey is before or equal to the requested one
              if (isRepeatingGoal && t.timeFrameKey) {
                // Compare timeFrameKeys based on type
                if (type === "weekly") {
                  // For weekly goals, compare year and week
                  const [tYear, tWeek] = t.timeFrameKey.split("-W");
                  const [reqYear, reqWeek] = timeFrameKey.split("-W");

                  if (
                    Number(tYear) < Number(reqYear) ||
                    (Number(tYear) === Number(reqYear) &&
                      Number(tWeek) <= Number(reqWeek))
                  ) {
                    return true;
                  }
                } else if (type === "monthly") {
                  // For monthly goals, compare year and month
                  const [tYear, tMonth] = t.timeFrameKey.split("-");
                  const [reqYear, reqMonth] = timeFrameKey.split("-");

                  if (
                    Number(tYear) < Number(reqYear) ||
                    (Number(tYear) === Number(reqYear) &&
                      Number(tMonth) <= Number(reqMonth))
                  ) {
                    return true;
                  }
                } else if (type === "yearly") {
                  // For yearly goals, compare years
                  if (Number(t.timeFrameKey) <= Number(timeFrameKey)) {
                    return true;
                  }
                }
              }

              // If not a repeating goal or doesn't meet the criteria, check exact match
              return t.timeFrameKey === timeFrameKey;
            }

            return true;
          })
          .sort((a, b) => {
            // Sort by position, using the timeframe-specific position for repeating goals
            if (timeFrameKey) {
              const posA = a.repeatedDays?.includes(type)
                ? a.positionsByTimeFrame?.[timeFrameKey] || a.position || 999
                : a.position || 999;
              const posB = b.repeatedDays?.includes(type)
                ? b.positionsByTimeFrame?.[timeFrameKey] || b.position || 999
                : b.position || 999;
              return posA - posB;
            }

            return (a.position || 999) - (b.position || 999);
          });
      },

      // Check if a task is completed on a specific date
      isTaskCompletedOnDate: (taskId, date) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return false;

        // For repeating daily tasks or tasks being checked on a date other than dueDate
        if (
          (task.type === "daily" && task.repeatedDays?.length) ||
          (task.type === "daily" && task.dueDate !== date)
        ) {
          return task.completedDates?.includes(date) || false;
        }

        // For non-repeating tasks on their due date, or for goal-type tasks
        return task.isCompleted;
      },
    }),
    {
      name: "task-store", // localStorage key
    }
  )
);

export type { Task };
