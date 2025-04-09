import {
  ArrowUp,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const data = [
  [
    {
      label: "Settings",
      icon: Settings,
    },
    {
      label: "Resources",
      icon: BookOpen,
    },
    {
      label: "What's new",
      icon: ArrowUp,
    },
  ],

  [
    {
      label: "Upgrade to Pro",
      icon: BadgeCheck,
    },
  ],

  [
    {
      label: "Log out",
      icon: LogOut,
    },
  ],
];

export function ProfileActions() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="!px-1">
          <Avatar className="size-6 rounded-md">
            <AvatarImage src="https://avatars.githubusercontent.com/u/98880087" />
            <AvatarFallback>NZ</AvatarFallback>
          </Avatar>

          <span className="font-medium">Username</span>
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="py-0">
        {data.map((group, index) => (
          <div key={index} className="border-b last:border-none py-1">
            {group.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start"
              >
                <item.icon /> <span>{item.label}</span>
              </Button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
