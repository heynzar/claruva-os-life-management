import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Volume2 } from "lucide-react";
import sounds from "@/data/sounds";
import { quranList, reciterList } from "@/data/quran";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Update the TimerSettings interface to include the new playNextSurah setting
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

interface SoundPreferencesProps {
  settings: TimerSettings;
  updateSettings: (settings: Partial<TimerSettings>) => void;
  shouldPlaySounds: boolean;
  shouldPlayQuran: boolean;
  timerState: "pomodoro" | "shortBreak" | "longBreak";
  timerStatus: "idle" | "running" | "paused" | "completed";
}

// Update the SoundPreferences component to include the new playNextSurah toggle
export function SoundPreferences({
  settings,
  updateSettings,
}: SoundPreferencesProps) {
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
    <div className="flex justify-center flex-col gap-10 h-full">
      {/* Quran Audio Section */}
      <div className="space-y-1">
        <div className="flex justify-between items-center rounded-xs mb-2">
          <h3 className="text-lg">Select Quran Preffernces</h3>
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
                // className=" [&>span:first-child]:bg-[#333333] [&>span:first-child]:h-2 [&>span:first-child_span]:bg-primary [&_[role=slider]]:bg-white [&_[role=slider]]:border-none [&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
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
          <h3 className="text-lg">Select Natural Sound</h3>
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
                className="text-white rounded-xs text-xl"
                onClick={() => toggleSound(sound.name)}
              >
                <sound.Icon size={24} />
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
