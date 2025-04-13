import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";
import { format } from "date-fns";

type Task = {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  dueDate: string; // format: "YYYY-MM-DD"
  goalId: string;
  repeatedDays: string[]; // e.g. ['Monday', 'Thursday']
  pomodoros: number;
  position: number; // Default position (used for non-repeating tasks)
  // Track completion status per day for repeating tasks
  completedDates?: string[]; // Array of dates (YYYY-MM-DD) when this task was completed
  // Track positions per day for repeating tasks
  positionsByDate?: Record<string, number>; // Map of date (YYYY-MM-DD) to position
};

type Goal = {
  id: string;
  name: string;
  color?: string;
};

type TaskStore = {
  tasks: Task[];
  goals: Goal[];

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

  // Selectors
  getTasksForDate: (date: string) => Task[];
  isTaskCompletedOnDate: (taskId: string, date: string) => boolean;
  getTaskPositionForDate: (taskId: string, date: string) => number;
};

// Default goals
const defaultGoals: Goal[] = [
  { id: "work", name: "Work", color: "#4f46e5" },
  { id: "personal", name: "Personal", color: "#10b981" },
  { id: "health", name: "Health", color: "#ef4444" },
  { id: "learning", name: "Learning", color: "#f59e0b" },
  { id: "quick-tasks", name: "Quick Tasks", color: "#6b7280" },
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      goals: defaultGoals,

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

            // Set position if not provided
            if (!task.position) {
              // Find the highest position for tasks on this day
              const tasksForDay = state.tasks.filter(
                (t) =>
                  t.dueDate === task.dueDate ||
                  (t.repeatedDays.length > 0 &&
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
            }

            // If it's a repeating task, set the initial position for the due date
            if (task.repeatedDays.length > 0 && task.dueDate) {
              task.positionsByDate[task.dueDate] = task.position;
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

            // For repeating tasks, track completion by date
            if (task.repeatedDays.length > 0 || task.dueDate !== date) {
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
              // For non-repeating tasks on their due date, use the isCompleted flag
              task.isCompleted = !task.isCompleted;
            }
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

            // For repeating tasks, store position by date
            if (task.repeatedDays.length > 0 || task.dueDate !== date) {
              if (!task.positionsByDate) {
                task.positionsByDate = {};
              }
              task.positionsByDate[date] = position;
            } else {
              // For non-repeating tasks on their due date, use the position property
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

                // For repeating tasks, store position by date
                if (task.repeatedDays.length > 0 || task.dueDate !== day) {
                  if (!task.positionsByDate) {
                    task.positionsByDate = {};
                  }
                  task.positionsByDate[day] = index + 1;
                } else {
                  // For non-repeating tasks on their due date, use the position property
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

        // For repeating tasks, get position by date
        if (task.repeatedDays.length > 0 || task.dueDate !== date) {
          return task.positionsByDate?.[date] || task.position || 999;
        }

        // For non-repeating tasks on their due date, use the position property
        return task.position || 999;
      },

      // 📆 Get tasks for a specific day
      getTasksForDate: (date) => {
        const dayOfWeek = format(new Date(date), "EEEE");
        const dateObj = new Date(date);
        const store = get();

        return store.tasks
          .filter((t) => {
            // Case 1: Task is due on this exact date
            if (t.dueDate === date) {
              return true;
            }

            // Case 2: Task is repetitive and should appear on this day of week
            if (t.repeatedDays.includes(dayOfWeek)) {
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

      // Check if a task is completed on a specific date
      isTaskCompletedOnDate: (taskId, date) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return false;

        // For repeating tasks, check the completedDates array
        if (task.repeatedDays.length > 0 || task.dueDate !== date) {
          return task.completedDates?.includes(date) || false;
        }

        // For non-repeating tasks on their due date, use the isCompleted flag
        return task.isCompleted;
      },
    }),
    {
      name: "task-store", // localStorage key
    }
  )
);

export type { Task, Goal };
