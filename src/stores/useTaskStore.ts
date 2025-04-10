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
  position: number;
  // Track completion status per day for repeating tasks
  completedDates?: string[]; // Array of dates (YYYY-MM-DD) when this task was completed
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

  // Selectors
  getTasksForDate: (date: string) => Task[];
  isTaskCompletedOnDate: (taskId: string, date: string) => boolean;
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
          })
        ),

      // 🔁 Reorder tasks based on sorted ids for a given day
      reorderTasks: (day, orderedIds) =>
        set(
          produce((state: TaskStore) => {
            const dayTasks = state.tasks.filter(
              (t) =>
                t.dueDate === day ||
                t.repeatedDays.includes(format(new Date(day), "EEEE"))
            );

            orderedIds.forEach((id, index) => {
              const task = dayTasks.find((t) => t.id === id);
              if (task) {
                task.position = index + 1;
              }
            });
          })
        ),

      // 📆 Get tasks for a specific day
      getTasksForDate: (date) => {
        const dayOfWeek = format(new Date(date), "EEEE");

        return get()
          .tasks.filter(
            (t) => t.dueDate === date || t.repeatedDays.includes(dayOfWeek)
          )
          .sort((a, b) => a.position - b.position);
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
