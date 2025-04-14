"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProfileActions } from "./profile-actions";
import { Button } from "@/components/ui/button";
import {
  PanelRight,
  Home,
  Target,
  Calendar,
  Timer,
  Map,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TaskDialog from "../task-dialog/add-task-dialog";
import { Task, useTaskStore } from "@/stores/useTaskStore";
import { useState } from "react";

const Sidebar = () => {
  const pathname = usePathname();
  const { updateTask } = useTaskStore();

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/habits", label: "Habits", icon: Calendar },
    { href: "/pomodoros", label: "Pomodoros", icon: Timer },
    { href: "/journey", label: "Journey", icon: Map },
  ];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleTaskUpdate = (updates: Partial<Task>) => {
    updateTask(id, updates);
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="absolute inset-0 m-2 z-10"
        >
          <PanelRight />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px]">
        <SheetHeader className="border-b">
          <SheetTitle>
            <ProfileActions />
          </SheetTitle>
          <SheetDescription className="sr-only">Sidebar</SheetDescription>
        </SheetHeader>

        <nav className="px-2 border-b pb-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "ghost"}
                      className={"w-full justify-start font-normal"}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4">
          <TaskDialog
            dialog_type="add"
            id={"1"}
            name={""}
            description={""}
            type={"daily"}
            tags={[]}
            priority={"low"}
            timeFrameKey={""}
            repeatedDays={[]}
            dueDate={""}
            pomodoros={0}
            onUpdate={handleTaskUpdate}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          />
          <Button
            onClick={handleOpenDialog}
            variant="outline"
            size="sm"
            className="w-full font-normal"
          >
            <Plus />
            Add Task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
