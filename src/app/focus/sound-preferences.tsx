"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudioLines, Volume2, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import sounds from "@/data/sounds";
import { quranList, reciterList } from "@/data/quran";
import {
  usePomodoroStore,
  type PomodoroSettings,
} from "@/stores/usePomodoroStore";
import type { PreferenceType } from "./page";

interface SoundPreferencesProps {
  settings: PomodoroSettings;
  setPreferenceType: Dispatch<SetStateAction<PreferenceType>>;
}

export function SoundPreferences({
  settings,
  setPreferenceType,
}: SoundPreferencesProps) {
  const { updateSettings } = usePomodoroStore();
  const [volume, setVolume] = useState(settings.volume);
  const [quranVolume, setQuranVolume] = useState(settings.quranVolume);
  const [reciterSearch, setReciterSearch] = useState("");
  const [surahSearch, setSurahSearch] = useState("");

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    updateSettings({ volume: newVolume });
  };

  const handleQuranVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setQuranVolume(newVolume);
    updateSettings({ quranVolume: newVolume });
  };

  const toggleSound = (soundName: string) => {
    let newActiveSounds: string[];

    if (settings.activeSounds.includes(soundName)) {
      // Remove sound if already active
      newActiveSounds = settings.activeSounds.filter(
        (name) => name !== soundName
      );
    } else {
      // Add sound if not active
      newActiveSounds = [...settings.activeSounds, soundName];
    }

    updateSettings({
      activeSounds: newActiveSounds,
      soundEnabled:
        newActiveSounds.length > 0 ||
        (!!settings.quranReciter && !!settings.quranSurah) ||
        settings.soundEnabled,
    });
  };

  const handleReciterChange = (value: string) => {
    updateSettings({
      quranReciter: value,
      soundEnabled: true,
    });
  };

  const handleSurahChange = (value: string) => {
    updateSettings({
      quranSurah: value,
      soundEnabled: true,
    });
  };

  const togglePlayDuringBreaks = () => {
    updateSettings({ playDuringBreaks: !settings.playDuringBreaks });
  };

  const toggleSoundEnabled = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const togglePlayNextSurah = () => {
    updateSettings({ playNextSurah: !settings.playNextSurah });
  };

  // Filter reciters based on search input
  const filteredReciters = reciterList.filter(
    (reciter) =>
      reciter.name_en.toLowerCase().includes(reciterSearch.toLowerCase()) ||
      reciter.name_ar.includes(reciterSearch)
  );

  // Filter surahs based on search input
  const filteredSurahs = quranList.filter(
    (surah) =>
      surah.name_en.toLowerCase().includes(surahSearch.toLowerCase()) ||
      surah.name_ar.includes(surahSearch)
  );

  return (
    <div className="w-full h-full border-b-4 sm:border-b-0 sm:border-l-4 border-background">
      <div className="p-5 border-b flex justify-between items-center">
        <h2 className="text-lg flex gap-2 items-center">
          <AudioLines className="size-4" />
          Audio Settings
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

      {/* Quran Audio Section */}
      <div className="flex flex-col gap-10 h-full p-5">
        <div className="space-y-1 ">
          <div className="flex justify-between items-center rounded-xs mb-2">
            <h3 className="text-lg">Quran Audio</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="size-7" size="icon">
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-32 p-3">
                <Slider
                  value={[quranVolume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleQuranVolumeChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Select
            value={settings.quranReciter || ""}
            onValueChange={handleReciterChange}
          >
            <SelectTrigger className="bg-secondary border-none rounded-xs cursor-pointer w-full">
              <SelectValue placeholder="Select Reciter" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="mb-1">
                <input
                  type="text"
                  placeholder="Search reciter..."
                  value={reciterSearch}
                  onChange={(e) => setReciterSearch(e.target.value)}
                  className="w-full bg-muted/60 border-none rounded-md px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              {filteredReciters.map((reciter) => (
                <SelectItem key={reciter.query} value={reciter.query}>
                  {reciter.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={settings.quranSurah || ""}
            onValueChange={handleSurahChange}
            disabled={!settings.quranReciter}
          >
            <SelectTrigger className="bg-secondary border-none rounded-xs cursor-pointer w-full">
              <SelectValue placeholder="Select Surah" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <div className="mb-1">
                <input
                  type="text"
                  placeholder="Search surah..."
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  className="w-full bg-muted/60 border-none rounded-md px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              {filteredSurahs.map((surah) => (
                <SelectItem key={surah.query} value={surah.query}>
                  {surah.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Natural Sounds Section */}
        <div>
          <div className="flex justify-between items-center rounded-xs mb-2">
            <h3 className="text-lg">Natural Sounds</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="size-7" size="icon">
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-32 p-3">
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {sounds.map((sound) => {
              const isActive = settings.activeSounds.includes(sound.name);
              return (
                <Button
                  key={sound.name}
                  variant={isActive ? "default" : "secondary"}
                  className="rounded-xs text-xl"
                  onClick={() => toggleSound(sound.name)}
                >
                  <sound.Icon size={24} />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-1.5">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <span>Play next surah automatically</span>
            <Switch
              checked={settings.playNextSurah}
              onCheckedChange={togglePlayNextSurah}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Play sounds during breaks</span>
            <Switch
              checked={settings.playDuringBreaks}
              onCheckedChange={togglePlayDuringBreaks}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Enable sounds during sessions</span>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={toggleSoundEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
