"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { usePomodoroStore } from "@/stores/usePomodoroStore";

export function PreferencePopover() {
  const { settings, updateSettings } = usePomodoroStore();

  const togglePlayNextSurah = () => {
    updateSettings({ playNextSurah: !settings.playNextSurah });
  };

  const togglePlayDuringBreaks = () => {
    updateSettings({ playDuringBreaks: !settings.playDuringBreaks });
  };

  const toggleSoundEnabled = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Preferences">
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <h3 className="font-medium border-b pb-2 mb-4">Quick Preferences</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Play next surah automatically</span>
            <Switch
              checked={settings.playNextSurah}
              onCheckedChange={togglePlayNextSurah}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Play sounds during breaks</span>
            <Switch
              checked={settings.playDuringBreaks}
              onCheckedChange={togglePlayDuringBreaks}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Enable sounds during sessions</span>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={toggleSoundEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
