"use client";

import { useEffect, useRef } from "react";
import { useTaskStore } from "@/stores/useTaskStore";
import { usePomodoroStore } from "@/stores/usePomodoroStore";
import { useAudioPlayer } from "./use-audio-player";

export function usePomodoroTimer() {
  const {
    timerState,
    timerStatus,
    timeLeft,
    pomodoroCount,
    selectedTaskId,
    startTime,
    accumulatedTime,
    showSkipDialog,
    settings,
    setTimerStatus,
    setTimeLeft,
    setShowSkipDialog,
    moveToNextState,
    decrementTimeLeft,
  } = usePomodoroStore();

  const { tasks, updateTask } = useTaskStore();
  const { playNotificationSound } = useAudioPlayer();

  // Store the original total time for progress calculation
  const totalTimeRef = useRef(0);

  // Initialize timer with correct duration from settings when in idle state
  useEffect(() => {
    if (timerStatus === "idle") {
      let initialTime = 0;
      switch (timerState) {
        case "pomodoro":
          initialTime = settings.pomodoro * 60;
          break;
        case "shortBreak":
          initialTime = settings.shortBreak * 60;
          break;
        case "longBreak":
          initialTime = settings.longBreak * 60;
          break;
      }
      setTimeLeft(initialTime);
      totalTimeRef.current = initialTime;
    }
  }, [
    timerState,
    timerStatus,
    settings.pomodoro,
    settings.shortBreak,
    settings.longBreak,
  ]);

  // Initialize total time ref when timer state changes
  useEffect(() => {
    if (timerStatus === "idle") {
      totalTimeRef.current = timeLeft;
    }
  }, [timerStatus, timeLeft]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerStatus === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        decrementTimeLeft();

        // Check if timer is completed
        if (timeLeft <= 1) {
          // Play notification sound based on timer state and settings
          const shouldPlaySound =
            (timerState === "pomodoro" && !settings.soundEnabled) ||
            ((timerState === "shortBreak" || timerState === "longBreak") &&
              !settings.playDuringBreaks);

          if (shouldPlaySound) {
            playNotificationSound();
          }

          clearInterval(interval!);

          // When timer completes, calculate final time
          if (
            startTime !== null &&
            selectedTaskId &&
            timerState === "pomodoro"
          ) {
            const sessionTime = (Date.now() - startTime) / 1000; // in seconds
            const totalTimeSpent = (accumulatedTime + sessionTime) / 60; // convert to minutes
            updatePomodoro(selectedTaskId, Math.round(totalTimeSpent));
          }

          setTimerStatus("completed");
        }
      }, 1000);
    } else if (timerStatus !== "running" && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    timerStatus,
    timeLeft,
    startTime,
    selectedTaskId,
    timerState,
    accumulatedTime,
    settings.soundEnabled,
    settings.playDuringBreaks,
  ]);

  // Update task with pomodoro time
  const updatePomodoro = (taskId: string, pomodorosToAdd: number) => {
    if (!taskId || pomodorosToAdd <= 0) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentPomodoros = task.pomodoros ?? 0;
    updateTask(taskId, {
      pomodoros: currentPomodoros + pomodorosToAdd,
    });
  };

  // Toggle timer between running, paused, and completed states
  const toggleTimer = () => {
    if (timerStatus === "running") {
      // When pausing, calculate and store the time spent in this session
      setTimerStatus("paused");
      if (startTime !== null) {
        const sessionTime = (Date.now() - startTime) / 1000; // in seconds
        const totalTimeSpent = accumulatedTime + sessionTime;

        // Update task with the actual minutes spent when paused
        if (selectedTaskId && timerState === "pomodoro") {
          const minutesSpent = sessionTime / 60;
          updatePomodoro(selectedTaskId, Math.round(minutesSpent));
        }
      }
    } else if (timerStatus === "completed") {
      moveToNextState();
    } else {
      if (timerStatus === "idle") {
        totalTimeRef.current = timeLeft; // Store the starting time
      }
      setTimerStatus("running");
    }
  };

  // Handle skip button click
  const handleSkip = () => {
    // Only show dialog if we're in a pomodoro session and have a selected task
    if (timerState === "pomodoro" && selectedTaskId) {
      setShowSkipDialog(true);
    } else {
      // For breaks, just move to next state without asking
      moveToNextState();
    }
  };

  // Skip without counting time
  const skipWithoutTime = () => {
    setShowSkipDialog(false);
    moveToNextState();
  };

  // Skip and count full pomodoro time
  const skipWithFullPomodoroTime = () => {
    if (selectedTaskId && timerState === "pomodoro") {
      // Add the full pomodoro time (in minutes)
      updatePomodoro(selectedTaskId, settings.pomodoro);
    }

    setShowSkipDialog(false);
    moveToNextState();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress for the circular indicator
  const calculateProgress = () => {
    if (totalTimeRef.current === 0) return 100; // Return 100 instead of 0
    return (timeLeft / totalTimeRef.current) * 100;
  };

  // Get label for current timer state
  const getStateLabel = () => {
    switch (timerState) {
      case "pomodoro":
        return "Focus";
      case "shortBreak":
        return "Short Break";
      case "longBreak":
        return "Long Break";
    }
  };

  // Get label for timer button
  const getButtonLabel = () => {
    if (timerStatus === "completed") {
      if (timerState === "pomodoro") {
        return "Start Break";
      } else {
        return "Start Focus";
      }
    }

    if (timerStatus === "idle") {
      return "Start";
    }

    return timerStatus === "running" ? "Pause" : "Continue";
  };

  // Format minutes for display
  const formatMinutes = (totalMinutes: number | undefined) => {
    // Handle invalid input
    if (
      totalMinutes === undefined ||
      totalMinutes === null ||
      isNaN(totalMinutes)
    ) {
      return "0min";
    }

    // Handle negative values
    totalMinutes = Math.abs(totalMinutes);

    // Calculate hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format the result
    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };

  return {
    // State
    timerState,
    timerStatus,
    timeLeft,
    pomodoroCount,
    selectedTaskId,
    showSkipDialog,

    // Derived values
    progress: calculateProgress(),
    formattedTime: formatTime(timeLeft),
    stateLabel: getStateLabel(),
    buttonLabel: getButtonLabel(),

    // Actions
    toggleTimer,
    handleSkip,
    skipWithoutTime,
    skipWithFullPomodoroTime,
    formatMinutes,
  };
}
