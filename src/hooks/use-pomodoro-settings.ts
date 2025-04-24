"use client";

import { useState, useEffect } from "react";

type PomodoroSettings = {
  pomodoro: number;
  shortBreak: number;
};

export function usePomodoroSettings() {
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    pomodoro: 25,
    shortBreak: 5,
  });

  useEffect(() => {
    setPomodoroSettings(getPomodoroSettings());
  }, []);

  return { pomodoroSettings };
}

// Helper function to get pomodoro settings from localStorage
function getPomodoroSettings(): PomodoroSettings {
  if (typeof window === "undefined") {
    return { pomodoro: 25, shortBreak: 5 };
  }

  try {
    const settings = localStorage.getItem("pomodoroSettings");
    return settings ? JSON.parse(settings) : { pomodoro: 25, shortBreak: 5 };
  } catch (error) {
    console.error("Error reading pomodoro settings:", error);
    return { pomodoro: 25, shortBreak: 5 };
  }
}
