"use client";

import { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/stores/usePomodoroStore";
import { quranList, reciterList } from "@/data/quran";
import sounds from "@/data/sounds";

// Create singleton audio instances to persist across component remounts
const audioInstances: { [key: string]: HTMLAudioElement } = {};
let quranAudioInstance: HTMLAudioElement | null = null;
let quranCurrentTime = 0;
let quranIsPlaying = false;

export function useAudioPlayer() {
  const { settings, timerState, timerStatus, updateSettings } =
    usePomodoroStore();

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>(
    audioInstances
  );
  const quranAudioRef = useRef<HTMLAudioElement | null>(quranAudioInstance);

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements for each sound
    sounds.forEach((sound) => {
      if (!audioRefs.current[sound.name]) {
        const audio = new Audio(sound.src);
        audio.loop = true;
        audioRefs.current[sound.name] = audio;
        audioInstances[sound.name] = audio;
      }
    });

    // Cleanup function to stop and remove all audio elements
    return () => {
      // Save Quran audio state before unmounting
      if (quranAudioRef.current) {
        quranCurrentTime = quranAudioRef.current.currentTime;
        quranIsPlaying = !quranAudioRef.current.paused;
      }
    };
  }, []);

  // Manage ambient sound playback
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

  // Manage Quran audio playback
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
          quranAudioRef.current.loop = !settings.playNextSurah;
          quranAudioRef.current.addEventListener("ended", handleQuranEnded);
          quranAudioInstance = quranAudioRef.current;

          // Restore playback position if we have one
          if (quranCurrentTime > 0) {
            quranAudioRef.current.currentTime = quranCurrentTime;
          }
        } else {
          // Remove previous event listener before adding a new one
          quranAudioRef.current.removeEventListener("ended", handleQuranEnded);

          // Update loop setting based on playNextSurah
          quranAudioRef.current.loop = !settings.playNextSurah;

          // Add the event listener again
          quranAudioRef.current.addEventListener("ended", handleQuranEnded);

          // If the URL has changed, update it
          if (quranAudioRef.current.src !== audioUrl) {
            const wasPlaying = !quranAudioRef.current.paused;
            quranAudioRef.current.pause();
            quranAudioRef.current.src = audioUrl;
            quranAudioRef.current.load();

            // If it was playing before, resume playback
            if (wasPlaying) {
              quranAudioRef.current
                .play()
                .catch((e) => console.error("Error playing Quran:", e));
            }
          }
        }

        // Set volume and play
        if (quranAudioRef.current) {
          quranAudioRef.current.volume = settings.quranVolume / 100;

          // Only start playing if it's not already playing or if we're resuming from a saved state
          if (
            quranAudioRef.current.paused &&
            (quranIsPlaying || timerStatus === "running")
          ) {
            quranAudioRef.current
              .play()
              .catch((e) => console.error("Error playing Quran:", e));
            quranIsPlaying = false; // Reset the flag after attempting to play
          }
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

  // Handle when a surah finishes playing
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

  // Play notification sound - always play regardless of sound enabled setting
  const playNotificationSound = () => {
    // Always play notification sound when timer completes, but respect the settings
    // for different timer states
    const shouldPlay =
      (timerState === "pomodoro" && !settings.soundEnabled) ||
      ((timerState === "shortBreak" || timerState === "longBreak") &&
        !settings.playDuringBreaks);

    if (shouldPlay) {
      const audio = new Audio("/check.wav");
      audio.volume = settings.volume / 100;
      audio.play().catch((e) => console.error("Error playing sound:", e));
    }
  };

  return {
    playNotificationSound,
    shouldPlayAmbientSounds,
    shouldPlayQuran,
  };
}
