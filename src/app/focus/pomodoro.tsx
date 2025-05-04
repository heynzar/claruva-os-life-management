"use client";

import type { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TimerPreferences } from "./timer-preferences";
import { SoundPreferences } from "./sound-preferences";
import { useTaskStore } from "@/stores/useTaskStore";
import { usePomodoroStore } from "@/stores/usePomodoroStore";
import { usePomodoroTimer } from "@/hooks/use-pomodoro-timer";
import type { PreferenceType } from "./page";

interface PomodoroTimerProps {
  preferenceType: PreferenceType;
  setPreferenceType: Dispatch<SetStateAction<PreferenceType>>;
}

export function PomodoroTimer({
  preferenceType,
  setPreferenceType,
}: PomodoroTimerProps) {
  const { selectedTaskId, setSelectedTaskId, showSkipDialog, settings } =
    usePomodoroStore();

  const {
    timerState,
    timerStatus,
    pomodoroCount,
    progress,
    formattedTime,
    stateLabel,
    buttonLabel,
    toggleTimer,
    handleSkip,
    skipWithoutTime,
    skipWithFullPomodoroTime,
    formatMinutes,
  } = usePomodoroTimer();

  const today = format(new Date(), "yyyy-MM-dd");
  const { getTasksForDate } = useTaskStore();
  const todayTasks = getTasksForDate(today);

  const circumference = 2 * Math.PI * 120;

  return (
    <div className="flex flex-col-reverse sm:flex-row w-full h-full sm:overflow-clip justify-center items-center">
      <div className="flex flex-1 flex-col h-full items-center justify-center p-8 transition-all duration-300">
        <div className="mb-4">
          <Select
            value={selectedTaskId || ""}
            onValueChange={setSelectedTaskId}
            disabled={timerStatus === "running" || timerState !== "pomodoro"}
          >
            <SelectTrigger className="max-w-xs hover:!bg-secondary text-muted-foreground !bg-transparent border-none !h-8 cursor-pointer shadow-none">
              <SelectValue placeholder="Select a task to focus on" />
            </SelectTrigger>
            <SelectContent align="center" className="w-xs max-h-[300px]">
              {todayTasks.map((task) => {
                const truncatedName =
                  task.name.length > 40
                    ? `${task.name.slice(0, 40)}...`
                    : task.name;

                return (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center justify-between w-[274px]">
                      {truncatedName}
                      <Badge variant="outline">
                        {formatMinutes(task.pomodoros)} 🍅
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="relative mb-8 scale-105">
          <svg width="280" height="280" viewBox="0 0 280 280">
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              className="stroke-muted-foreground/20"
              strokeWidth="8"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              className="stroke-primary"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={
                circumference - (circumference * progress) / 100
              }
              transform="rotate(-90 140 140)"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-muted-foreground">
              {stateLabel}{" "}
              {timerState === "pomodoro" && `(${(pomodoroCount % 4) + 1}/4)`}
            </span>
            <span className="text-6xl p-2 mb-4 rounded-2xl hover:bg-card font-semibold">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Timer controls */}
        <div className="flex gap-2">
          <Button className="px-8" size="sm" onClick={toggleTimer}>
            {buttonLabel}
          </Button>

          {timerStatus === "paused" && (
            <Button variant="outline" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          )}
        </div>

        {/* Skip dialog */}
        <Dialog open={showSkipDialog} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip Pomodoro Session</DialogTitle>
              <DialogDescription>
                Do you want to count the time you&apos;ve already spent on this
                task?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="secondary" size="sm" onClick={skipWithoutTime}>
                Skip Without Counting
              </Button>

              <Button size="sm" onClick={skipWithFullPomodoroTime}>
                Count Full Pomodoro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div
        className={`${
          preferenceType !== "none" && "w-full sm:max-w-[350px]"
        } h-full `}
      >
        {preferenceType === "timer" && (
          <TimerPreferences
            settings={settings}
            setPreferenceType={setPreferenceType}
          />
        )}

        {preferenceType === "sound" && (
          <SoundPreferences
            settings={settings}
            setPreferenceType={setPreferenceType}
          />
        )}
      </div>
    </div>
  );
}
