"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  soundEnabled: boolean;
}

interface TimerPreferencesProps {
  settings: TimerSettings;
  updateSettings: (settings: Partial<TimerSettings>) => void;
}

export function TimerPreferences({
  settings,
  updateSettings,
}: TimerPreferencesProps) {
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
    <div className="flex justify-center h-full flex-col gap-8">
      <div className="space-y-1">
        <h3 className="text-lg">Set Pomodoro Time</h3>
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
              className="text-white rounded-xs text-xl"
              onClick={() => selectPomodoroOption(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg">Set Short Break</h3>
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
              variant={settings.shortBreak === option ? "default" : "secondary"}
              className="text-white rounded-xs text-xl"
              onClick={() => selectShortBreakOption(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg">Set Long Break</h3>
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
              variant={settings.longBreak === option ? "default" : "secondary"}
              className="text-white rounded-xs text-xl"
              onClick={() => selectLongBreakOption(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
