"use client";
import Sidebar from "@/components/sidebar/sidebar";
import DayContainer from "@/components/day-container";
import GoalContainer from "@/components/goal-container";
import TaskCard from "@/components/task-card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2Icon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { format, addDays, subDays } from "date-fns";

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
  const { tasks, addTask, getTasksForDate } = useTaskStore();

  // Current date state for navigation
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

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

  return (
    <div className="w-full h-screen flex flex-col items-end">
      <header className="flex bg-muted/20 items-center justify-between w-full p-2">
        <Sidebar />
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
        <DayContainer date={yesterdayDate} tasks={yesterdayTasks}>
          {yesterdayTasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              name={task.name}
              description={task.description}
              isCompleted={task.isCompleted}
              goalId={task.goalId}
              repeatedDays={task.repeatedDays}
              dueDate={task.dueDate}
              date={yesterdayDate} // Pass the current date context
              pomodoros={task.pomodoros}
              position={task.position}
            />
          ))}
        </DayContainer>

        {/* Today's tasks */}
        <DayContainer date={currentDate} tasks={todayTasks}>
          {todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              name={task.name}
              description={task.description}
              isCompleted={task.isCompleted}
              goalId={task.goalId}
              repeatedDays={task.repeatedDays}
              dueDate={task.dueDate}
              date={currentDate} // Pass the current date context
              pomodoros={task.pomodoros}
              position={task.position}
            />
          ))}
        </DayContainer>

        {/* Tomorrow's tasks */}
        <DayContainer date={tomorrowDate} tasks={tomorrowTasks}>
          {tomorrowTasks.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              name={task.name}
              description={task.description}
              isCompleted={task.isCompleted}
              goalId={task.goalId}
              repeatedDays={task.repeatedDays}
              dueDate={task.dueDate}
              date={tomorrowDate} // Pass the current date context
              pomodoros={task.pomodoros}
              position={task.position}
            />
          ))}
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
  );
}
