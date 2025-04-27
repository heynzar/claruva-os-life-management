"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TimerPreferences } from "./timer-preferences";
import { SoundPreferences } from "./sound-preferences";
import { cn } from "@/lib/utils";
import { quranList, reciterList } from "@/data/quran";
import sounds from "@/data/sounds";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/stores/useTaskStore";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TimerState = "pomodoro" | "shortBreak" | "longBreak";
type TimerStatus = "running" | "paused" | "idle" | "completed";

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  soundEnabled: boolean;
  volume: number;
  activeSounds: string[];
  playDuringBreaks: boolean;
  quranReciter: string | null;
  quranSurah: string | null;
  quranVolume: number;
  playNextSurah: boolean; // Add this new setting
}

export function PomodoroTimer({
  showPreferences,
  showSoundPreferences,
}: {
  showSoundPreferences: boolean;
  showPreferences: boolean;
}) {
  const [timerState, setTimerState] = useState<TimerState>("pomodoro");
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    soundEnabled: true,
    volume: 40,
    activeSounds: ["Birds", "Waterfall"],
    playDuringBreaks: false,
    quranReciter: "https://server6.mp3quran.net/qtm",
    quranSurah: "002",
    quranVolume: 80,
    playNextSurah: false, // Add this new setting with default value
  });

  // Add these refs at the top of the PomodoroTimer component, after the state declarations
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const quranAudioRef = useRef<HTMLAudioElement | null>(null);

  // Store the original total time for progress calculation
  const totalTimeRef = useRef(0);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem("pomodoroSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const savedCount = localStorage.getItem("pomodoroCount");
    if (savedCount) {
      setPomodoroCount(Number.parseInt(savedCount));
    }
  }, []);

  // Initialize timer when timer state changes
  useEffect(() => {
    // Only initialize timer if it's not already running or paused
    if (timerStatus !== "running" && timerStatus !== "paused") {
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
      totalTimeRef.current = initialTime; // Store the initial total time
      setTimerStatus("idle");
    }
  }, [timerState]);

  // This effect only runs when settings change
  // We don't want to reset the timer if it's already running or paused
  useEffect(() => {
    // No action needed, just prevent timer reset
  }, [settings]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerStatus === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            playNotificationSound();
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
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerStatus !== "running" && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus, timeLeft]);

  // Save pomodoro count to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("pomodoroCount", pomodoroCount.toString());
  }, [pomodoroCount]);

  // Add this effect to initialize audio elements
  useEffect(() => {
    // Create audio elements for each sound
    sounds.forEach((sound) => {
      if (!audioRefs.current[sound.name]) {
        const audio = new Audio(sound.src);
        audio.loop = true;
        audioRefs.current[sound.name] = audio;
      }
    });

    // Cleanup function to stop and remove all audio elements
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      if (quranAudioRef.current) {
        quranAudioRef.current.pause();
        quranAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Add this effect to manage natural sound playback
  useEffect(() => {
    // Update volume for all audio elements
    Object.entries(audioRefs.current).forEach(([name, audio]) => {
      if (audio) {
        audio.volume = settings.volume / 100;

        // Play or pause based on whether the sound is active and timer state
        if (settings.activeSounds.includes(name) && shouldPlayAmbientSounds()) {
          if (audio.paused) {
            audio
              .play()
              .catch((e) => console.error(`Error playing ${name}:`, e));
          }
        } else {
          audio.pause();
        }
      }
    });
  }, [
    settings.activeSounds,
    settings.volume,
    timerStatus,
    timerState,
    settings.soundEnabled,
    settings.playDuringBreaks,
  ]);

  // Add this effect to manage Quran audio playback
  useEffect(() => {
    // If both reciter and surah are selected
    if (settings.quranReciter && settings.quranSurah && shouldPlayQuran()) {
      const reciter = reciterList.find(
        (r) => r.query === settings.quranReciter
      );
      const surah = quranList.find((s) => s.query === settings.quranSurah);

      if (reciter && surah) {
        const audioUrl = `${reciter.query}/${surah.query}.mp3`;

        // Create a new audio element if needed
        if (!quranAudioRef.current) {
          quranAudioRef.current = new Audio(audioUrl);
          quranAudioRef.current.loop = !settings.playNextSurah; // Only loop if not playing next surah
          quranAudioRef.current.addEventListener("ended", handleQuranEnded);
        } else {
          // Remove previous event listener before adding a new one
          quranAudioRef.current.removeEventListener("ended", handleQuranEnded);

          // Update loop setting based on playNextSurah
          quranAudioRef.current.loop = !settings.playNextSurah;

          // Add the event listener again
          quranAudioRef.current.addEventListener("ended", handleQuranEnded);

          // If the URL has changed, update it
          if (quranAudioRef.current.src !== audioUrl) {
            quranAudioRef.current.pause();
            quranAudioRef.current.src = audioUrl;
            quranAudioRef.current.load();
          }
        }

        // Set volume and play
        if (quranAudioRef.current) {
          quranAudioRef.current.volume = settings.quranVolume / 100;
          quranAudioRef.current
            .play()
            .catch((e) => console.error("Error playing Quran:", e));
        }
      }
    } else if (quranAudioRef.current) {
      // Pause if conditions are not met
      quranAudioRef.current.pause();
    }

    // Cleanup function
    return () => {
      if (quranAudioRef.current) {
        quranAudioRef.current.removeEventListener("ended", handleQuranEnded);
      }
    };
  }, [
    settings.quranReciter,
    settings.quranSurah,
    settings.quranVolume,
    settings.playNextSurah,
    timerStatus,
    timerState,
    settings.soundEnabled,
    settings.playDuringBreaks,
  ]);

  // Add this function to handle when a surah finishes playing
  const handleQuranEnded = () => {
    if (
      settings.playNextSurah &&
      settings.quranReciter &&
      settings.quranSurah &&
      shouldPlayQuran()
    ) {
      // Find the current surah index
      const currentSurahIndex = quranList.findIndex(
        (s) => s.query === settings.quranSurah
      );

      if (currentSurahIndex !== -1) {
        // Get the next surah (or loop back to the first one)
        const nextSurahIndex = (currentSurahIndex + 1) % quranList.length;
        const nextSurah = quranList[nextSurahIndex].query;

        // Play the next surah directly
        if (quranAudioRef.current) {
          const reciter = reciterList.find(
            (r) => r.query === settings.quranReciter
          );
          if (reciter) {
            const audioUrl = `${reciter.query}/${nextSurah}.mp3`;
            quranAudioRef.current.src = audioUrl;
            quranAudioRef.current.load();
            quranAudioRef.current
              .play()
              .catch((e) =>
                console.error("Error playing next Quran surah:", e)
              );

            // Update the settings after starting playback
            updateSettings({ quranSurah: nextSurah });
          }
        }
      }
    } else if (quranAudioRef.current && !settings.playNextSurah) {
      // If not playing next surah, just replay the current one
      quranAudioRef.current.currentTime = 0;
      quranAudioRef.current
        .play()
        .catch((e) => console.error("Error replaying Quran:", e));
    }
  };

  const toggleTimer = () => {
    if (timerStatus === "running") {
      // When pausing, calculate and store the time spent in this session
      setTimerStatus("paused");
      if (startTime !== null) {
        const sessionTime = (Date.now() - startTime) / 1000; // in seconds
        setAccumulatedTime((prev) => prev + sessionTime);

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
        // Reset accumulated time when starting a new timer
        setAccumulatedTime(0);
      }
      // Record the start time when the timer starts/resumes
      setStartTime(Date.now());
      setTimerStatus("running");
    }
  };

  const handleSkip = () => {
    // Only show dialog if we're in a pomodoro session and have a selected task
    if (timerState === "pomodoro" && selectedTaskId) {
      setShowSkipDialog(true);
    } else {
      // For breaks, just move to next state without asking
      moveToNextState();
    }
  };

  const skipWithTime = () => {
    if (selectedTaskId && timerState === "pomodoro") {
      // Calculate how much time was spent in this session
      let timeSpent = 0;
      if (startTime !== null) {
        const sessionTime = (Date.now() - startTime) / 1000; // in seconds
        timeSpent = sessionTime + accumulatedTime; // total seconds spent
      } else {
        timeSpent = accumulatedTime; // just the accumulated time from previous runs
      }

      const minutesSpent = timeSpent / 60;
      updatePomodoro(selectedTaskId, Math.round(minutesSpent));
    }

    setShowSkipDialog(false);
    moveToNextState();
  };

  const skipWithoutTime = () => {
    setShowSkipDialog(false);
    moveToNextState();
  };

  const skipWithFullPomodoroTime = () => {
    if (selectedTaskId && timerState === "pomodoro") {
      // Add the full pomodoro time (in minutes)
      updatePomodoro(selectedTaskId, Math.round(timeLeft / 60));
    }

    setShowSkipDialog(false);
    moveToNextState();
  };

  const moveToNextState = () => {
    if (timerState === "pomodoro") {
      // Increment pomodoro count
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      // Don't update task here - we already did it in the timer completion handler

      // After 4 pomodoros, take a long break
      if (newCount % 4 === 0) {
        setTimerState("longBreak");
      } else {
        setTimerState("shortBreak");
      }
    } else {
      // After any break, go back to pomodoro
      setTimerState("pomodoro");
    }

    // Reset accumulated time when moving to a new state
    setAccumulatedTime(0);
    setStartTime(null);

    // Reset timer status to idle so it doesn't auto-start
    setTimerStatus("idle");
  };

  const playNotificationSound = () => {
    if (settings.soundEnabled) {
      const audio = new Audio("/notification.mp3");
      audio.volume = settings.volume / 100;
      audio.play().catch((e) => console.error("Error playing sound:", e));
    }
  };

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem("pomodoroSettings", JSON.stringify(updatedSettings));
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
    if (totalTimeRef.current === 0) return 0;
    return (timeLeft / totalTimeRef.current) * 100;
  };

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

  // Determine if ambient sounds should be playing
  const shouldPlayAmbientSounds = () => {
    if (!settings.soundEnabled || settings.activeSounds.length === 0) {
      return false;
    }

    if (timerStatus !== "running") {
      return false;
    }

    // Play during Pomodoro sessions
    if (timerState === "pomodoro") {
      return true;
    }

    // Play during breaks only if the setting is enabled
    if (
      (timerState === "shortBreak" || timerState === "longBreak") &&
      settings.playDuringBreaks
    ) {
      return true;
    }

    return false;
  };

  // Determine if Quran should be playing
  const shouldPlayQuran = () => {
    if (
      !settings.soundEnabled ||
      !settings.quranReciter ||
      !settings.quranSurah
    ) {
      return false;
    }

    if (timerStatus !== "running") {
      return false;
    }

    // Play during Pomodoro sessions
    if (timerState === "pomodoro") {
      return true;
    }

    // Play during breaks only if the setting is enabled
    if (
      (timerState === "shortBreak" || timerState === "longBreak") &&
      settings.playDuringBreaks
    ) {
      return true;
    }

    return false;
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const { tasks, getTasksForDate, updateTask } = useTaskStore();
  const todayTasks = getTasksForDate(today);

  const progress = calculateProgress();
  const circumference = 2 * Math.PI * 120;

  console.log(selectedTaskId);

  const updatePomodoro = (taskId: string, pomodorosToAdd: number) => {
    if (!taskId || pomodorosToAdd <= 0) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentPomodoros = task.pomodoros ?? 0;

    updateTask(taskId, {
      pomodoros: currentPomodoros + pomodorosToAdd,
    });
  };

  return (
    <div className="flex w-full h-full justify-center items-center">
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center p-8 transition-all duration-300",
          showPreferences || showSoundPreferences ? "w-1/2" : "w-full"
        )}
      >
        <div className="mb-4">
          <Select
            value={selectedTaskId || ""}
            onValueChange={setSelectedTaskId}
            disabled={timerStatus === "running" || timerState !== "pomodoro"}
          >
            <SelectTrigger className="max-w-xs hover:!bg-secondary text-muted-foreground !bg-transparent border-none !h-8 cursor-pointer">
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
                    {truncatedName} - {task.pomodoros}
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
              {getStateLabel()}{" "}
              {timerState === "pomodoro" && `(${(pomodoroCount % 4) + 1}/4)`}
            </span>
            <span className="text-6xl p-2 mb-4 rounded-2xl hover:bg-card font-semibold">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Rest of the timer UI */}

        <div className="flex gap-2">
          <Button className="px-8" size="sm" onClick={toggleTimer}>
            {getButtonLabel()}
          </Button>

          {timerStatus === "paused" && (
            <Button variant="outline" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          )}
        </div>

        {/* Skip dialog */}
        <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip Pomodoro Session</DialogTitle>
              <DialogDescription>
                Do you want to count the time you've already spent on this task?
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

      {showPreferences && (
        <div className="w-1/2 max-w-[340px] h-full border-l-4 border-background p-5 overflow-auto">
          <TimerPreferences
            settings={settings}
            updateSettings={updateSettings}
          />
        </div>
      )}

      {showSoundPreferences && (
        <div className="w-1/2 max-w-[340px] h-full border-l-4 border-background p-5 overflow-auto">
          <SoundPreferences
            settings={settings}
            updateSettings={updateSettings}
            shouldPlaySounds={shouldPlayAmbientSounds()}
            shouldPlayQuran={shouldPlayQuran()}
            timerState={timerState}
            timerStatus={timerStatus}
          />
        </div>
      )}
    </div>
  );
}
