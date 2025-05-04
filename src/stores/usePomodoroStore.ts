import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerState = "pomodoro" | "shortBreak" | "longBreak";
export type TimerStatus = "running" | "paused" | "idle" | "completed";

export interface PomodoroSettings {
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
  playNextSurah: boolean;
}

interface PomodoroStore {
  // Timer state
  timerState: TimerState;
  timerStatus: TimerStatus;
  timeLeft: number;
  pomodoroCount: number;
  selectedTaskId: string | null;
  startTime: number | null;
  accumulatedTime: number;
  showSkipDialog: boolean;

  // Settings
  settings: PomodoroSettings;

  // Actions
  setTimerState: (state: TimerState) => void;
  setTimerStatus: (status: TimerStatus) => void;
  setTimeLeft: (time: number) => void;
  setPomodoroCount: (count: number) => void;
  setSelectedTaskId: (id: string | null) => void;
  setStartTime: (time: number | null) => void;
  setAccumulatedTime: (time: number) => void;
  setShowSkipDialog: (show: boolean) => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;

  // Timer operations
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeTimer: () => void;
  moveToNextState: () => void;
  decrementTimeLeft: () => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
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
  playNextSurah: false,
};

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      // Timer state
      timerState: "pomodoro",
      timerStatus: "idle",
      timeLeft: DEFAULT_SETTINGS.pomodoro * 60,
      pomodoroCount: 0,
      selectedTaskId: null,
      startTime: null,
      accumulatedTime: 0,
      showSkipDialog: false,

      // Settings
      settings: DEFAULT_SETTINGS,

      // Actions
      setTimerState: (state) => {
        set({ timerState: state });
        // Initialize timer based on new state
        const { settings } = get();
        let initialTime = 0;
        switch (state) {
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
        set({ timeLeft: initialTime });
      },

      setTimerStatus: (status) => set({ timerStatus: status }),
      setTimeLeft: (time) => set({ timeLeft: time }),
      setPomodoroCount: (count) => set({ pomodoroCount: count }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setStartTime: (time) => set({ startTime: time }),
      setAccumulatedTime: (time) => set({ accumulatedTime: time }),
      setShowSkipDialog: (show) => set({ showSkipDialog: show }),

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Timer operations
      startTimer: () => {
        const { timerStatus } = get();
        if (timerStatus !== "running") {
          set({
            timerStatus: "running",
            startTime: Date.now(),
          });
        }
      },

      pauseTimer: () => {
        const { startTime, accumulatedTime } = get();
        if (startTime !== null) {
          const sessionTime = (Date.now() - startTime) / 1000; // in seconds
          set({
            timerStatus: "paused",
            accumulatedTime: accumulatedTime + sessionTime,
            startTime: null,
          });
        } else {
          set({ timerStatus: "paused" });
        }
      },

      resetTimer: () => {
        const { timerState, settings } = get();
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
        set({
          timeLeft: initialTime,
          timerStatus: "idle",
          startTime: null,
          accumulatedTime: 0,
        });
      },

      completeTimer: () => {
        set({ timerStatus: "completed", timeLeft: 0 });
      },

      moveToNextState: () => {
        const { timerState, pomodoroCount, settings } = get();

        let newCount = pomodoroCount;
        let nextState = timerState;

        if (timerState === "pomodoro") {
          // Increment pomodoro count
          newCount = pomodoroCount + 1;

          // After 4 pomodoros, take a long break
          if (newCount % 4 === 0) {
            nextState = "longBreak";
          } else {
            nextState = "shortBreak";
          }
        } else {
          // After any break, go back to pomodoro
          nextState = "pomodoro";
        }

        // Reset accumulated time and start time
        set({
          timerState: nextState,
          pomodoroCount: newCount,
          accumulatedTime: 0,
          startTime: null,
          timerStatus: "idle",
        });

        // Initialize timer based on new state
        let initialTime = 0;
        switch (nextState) {
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
        set({ timeLeft: initialTime });
      },

      decrementTimeLeft: () => {
        const { timeLeft } = get();
        if (timeLeft > 0) {
          set({ timeLeft: timeLeft - 1 });
        } else {
          get().completeTimer();
        }
      },
    }),
    {
      name: "pomodoro-store",
      partialize: (state) => ({
        settings: state.settings,
        pomodoroCount: state.pomodoroCount,
      }),
    }
  )
);
