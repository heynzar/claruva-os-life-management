"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timer, X } from "lucide-react";
import {
  usePomodoroStore,
  type PomodoroSettings,
} from "@/stores/usePomodoroStore";
import type { PreferenceType } from "./page";

interface TimerPreferencesProps {
  settings: PomodoroSettings;
  setPreferenceType: Dispatch<SetStateAction<PreferenceType>>;
}

export function TimerPreferences({
  settings,
  setPreferenceType,
}: TimerPreferencesProps) {
  const { updateSettings } = usePomodoroStore();
  const [pomodoroInput, setPomodoroInput] = useState(
    settings.pomodoro.toString()
  );
  const [shortBreakInput, setShortBreakInput] = useState(
    settings.shortBreak.toString()
  );
  const [longBreakInput, setLongBreakInput] = useState(
    settings.longBreak.toString()
  );

  const pomodoroOptions = [20, 25, 30, 45, 50, 60, 90, 120];
  const shortBreakOptions = [5, 10, 15, 20];
  const longBreakOptions = [15, 20, 25, 30];

  const handlePomodoroChange = (value: string) => {
    setPomodoroInput(value);
    const numValue = Number.parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateSettings({ pomodoro: numValue });
    }
  };

  const handleShortBreakChange = (value: string) => {
    setShortBreakInput(value);
    const numValue = Number.parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateSettings({ shortBreak: numValue });
    }
  };

  const handleLongBreakChange = (value: string) => {
    setLongBreakInput(value);
    const numValue = Number.parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateSettings({ longBreak: numValue });
    }
  };

  const selectPomodoroOption = (value: number) => {
    setPomodoroInput(value.toString());
    updateSettings({ pomodoro: value });
  };

  const selectShortBreakOption = (value: number) => {
    setShortBreakInput(value.toString());
    updateSettings({ shortBreak: value });
  };

  const selectLongBreakOption = (value: number) => {
    setLongBreakInput(value.toString());
    updateSettings({ longBreak: value });
  };

  return (
    <div className="w-full h-full border-b-4 sm:border-b-0 sm:border-l-4 border-background">
      <div className="p-5 border-b flex justify-between items-center">
        <h2 className="text-lg flex gap-2 items-center">
          <Timer className="size-4" />
          Timer Settings
        </h2>
        <Button
          variant="ghost"
          className="size-7"
          size="icon"
          onClick={() => setPreferenceType("none")}
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-col gap-8 h-full p-5">
        <div className="space-y-1">
          <h3 className="text-lg">Focus Duration</h3>
          <div className="relative flex items-center gap-2">
            <Input
              type="number"
              value={pomodoroInput}
              onChange={(e) => handlePomodoroChange(e.target.value)}
              className="bg-card border-none rounded-xs"
              min="1"
            />
            <span className="absolute right-0 m-1 rounded-xs text-muted-foreground px-2 py-0.5 bg-card">
              minutes
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {pomodoroOptions.map((option) => (
              <Button
                key={option}
                variant={settings.pomodoro === option ? "default" : "secondary"}
                className="rounded-xs text-xl"
                onClick={() => selectPomodoroOption(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg">Short Break Duration</h3>
          <div className="relative flex items-center gap-2">
            <Input
              type="number"
              value={shortBreakInput}
              onChange={(e) => handleShortBreakChange(e.target.value)}
              className="bg-card border-none rounded-xs"
              min="1"
            />
            <span className="absolute right-0 m-1 rounded-xs text-muted-foreground px-2 py-0.5 bg-card">
              minutes
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {shortBreakOptions.map((option) => (
              <Button
                key={option}
                variant={
                  settings.shortBreak === option ? "default" : "secondary"
                }
                className="rounded-xs text-xl"
                onClick={() => selectShortBreakOption(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg">Long Break Duration</h3>
          <div className="relative flex items-center gap-2">
            <Input
              type="number"
              value={longBreakInput}
              onChange={(e) => handleLongBreakChange(e.target.value)}
              className="bg-card border-none rounded-xs"
              min="1"
            />
            <span className="absolute right-0 m-1 rounded-xs text-muted-foreground px-2 py-0.5 bg-card">
              minutes
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {longBreakOptions.map((option) => (
              <Button
                key={option}
                variant={
                  settings.longBreak === option ? "default" : "secondary"
                }
                className="rounded-xs text-xl"
                onClick={() => selectLongBreakOption(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
