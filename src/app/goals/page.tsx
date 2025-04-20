"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  getWeek,
  getYear,
} from "date-fns";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2Icon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import GoalContainer from "@/components/goal-container";
import TaskCard from "@/components/task-card";
import KeyboardShortcuts from "@/components/keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { useTaskStore, type Task } from "@/stores/useTaskStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, RotateCcw } from "lucide-react";
import TagsSelect from "@/components/task-dialog/tags-select";

// Goal preferences type
interface GoalPreferences {
  showCompleted: boolean;
  showHabits: boolean; // Added for repeated goals
  selectedTags: string[];
  selectedPriority: "high" | "medium" | "low" | null;
  duplicateWhenDragging: boolean; // New preference for drag behavior
  showRepeatedGoals: boolean; // New preference for showing repeated goals
}

// Default preferences
const defaultPreferences: GoalPreferences = {
  showCompleted: true,
  showHabits: true,
  selectedTags: [],
  selectedPriority: null,
  duplicateWhenDragging: false, // Default to false (move instead of duplicate)
  showRepeatedGoals: true, // Default to true (show repeated goals)
};

// Goal types
type GoalType = "weekly" | "monthly" | "yearly" | "life";

export default function GoalsPage() {
  // Get tasks and actions from the Zustand store
  const {
    tasks,
    addTask,
    getTasksByType,
    updateTask,
    getGoalPositionForTimeFrame,
    setGoalPositionForTimeFrame,
  } = useTaskStore();

  // Current selected goal type
  const [selectedGoalType, setSelectedGoalType] = useState<GoalType>("weekly");

  // Current reference date for navigation
  const [referenceDate, setReferenceDate] = useState(new Date());

  // User preferences state
  const [preferences, setPreferences] =
    useState<GoalPreferences>(defaultPreferences);

  // Load preferences from localStorage on initial render
  useEffect(() => {
    const savedPreferences = localStorage.getItem("goalPreferences");
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences({
          ...defaultPreferences,
          ...parsedPreferences,
        });
      } catch (e) {
        console.error("Error loading preferences:", e);
      }
    }
  }, []);

  // Handle preferences change
  const handlePreferencesChange = (newPreferences: GoalPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem("goalPreferences", JSON.stringify(newPreferences));
  };

  // Generate timeframe keys based on the selected goal type and reference date
  const generateTimeframeKeys = (type: GoalType, date: Date): string[] => {
    switch (type) {
      case "weekly": {
        // Generate 5 week keys: previous, current, and 3 future weeks
        const currentWeek = getWeek(date, { weekStartsOn: 1 });
        const currentYear = getYear(date);

        return [
          // Previous week
          `${getYear(subWeeks(date, 1))}-W${getWeek(subWeeks(date, 1), {
            weekStartsOn: 1,
          })
            .toString()
            .padStart(2, "0")}`,
          // Current week
          `${currentYear}-W${currentWeek.toString().padStart(2, "0")}`,
          // Next 3 weeks
          `${getYear(addWeeks(date, 1))}-W${getWeek(addWeeks(date, 1), {
            weekStartsOn: 1,
          })
            .toString()
            .padStart(2, "0")}`,
          `${getYear(addWeeks(date, 2))}-W${getWeek(addWeeks(date, 2), {
            weekStartsOn: 1,
          })
            .toString()
            .padStart(2, "0")}`,
          `${getYear(addWeeks(date, 3))}-W${getWeek(addWeeks(date, 3), {
            weekStartsOn: 1,
          })
            .toString()
            .padStart(2, "0")}`,
        ];
      }
      case "monthly": {
        // Generate 5 month keys: previous, current, and 3 future months
        return [
          // Previous month
          `${getYear(subMonths(date, 1))}-${(subMonths(date, 1).getMonth() + 1)
            .toString()
            .padStart(2, "0")}`,
          // Current month
          `${getYear(date)}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`,
          // Next 3 months
          `${getYear(addMonths(date, 1))}-${(addMonths(date, 1).getMonth() + 1)
            .toString()
            .padStart(2, "0")}`,
          `${getYear(addMonths(date, 2))}-${(addMonths(date, 2).getMonth() + 1)
            .toString()
            .padStart(2, "0")}`,
          `${getYear(addMonths(date, 3))}-${(addMonths(date, 3).getMonth() + 1)
            .toString()
            .padStart(2, "0")}`,
        ];
      }
      case "yearly": {
        // Generate 5 year keys: previous, current, and 3 future years
        const currentYear = getYear(date);
        return [
          (currentYear - 1).toString(),
          currentYear.toString(),
          (currentYear + 1).toString(),
          (currentYear + 2).toString(),
          (currentYear + 3).toString(),
        ];
      }
      case "life": {
        // For life goals, just return a single key
        return ["life"];
      }
      default:
        return [];
    }
  };

  // Get timeframe keys for the current view
  const timeframeKeys = generateTimeframeKeys(selectedGoalType, referenceDate);

  // Apply filters based on preferences
  const filterGoals = (goals: Task[]) => {
    let filteredGoals = [...goals];

    // Filter by completion status
    if (!preferences.showCompleted) {
      filteredGoals = filteredGoals.filter((goal) => !goal.isCompleted);
    }

    // Filter by repeated goals
    if (!preferences.showHabits) {
      filteredGoals = filteredGoals.filter(
        (goal) => !goal.repeatedDays?.length
      );
    }

    // Filter by tags - case insensitive comparison
    if (preferences.selectedTags.length > 0) {
      filteredGoals = filteredGoals.filter((goal) => {
        if (!goal.tags || goal.tags.length === 0) return false;
        return preferences.selectedTags.some((selectedTag) =>
          goal.tags!.some(
            (goalTag) => goalTag.toLowerCase() === selectedTag.toLowerCase()
          )
        );
      });
    }

    // Filter by priority
    if (preferences.selectedPriority !== null) {
      filteredGoals = filteredGoals.filter(
        (goal) => goal.priority === preferences.selectedPriority
      );
    }

    return filteredGoals;
  };

  // Get goals for each timeframe key
  const getGoalsForTimeframeKeys = () => {
    // Get the current timeframe key based on today's date
    const now = new Date();
    let currentTimeframeKey = "";

    switch (selectedGoalType) {
      case "weekly":
        currentTimeframeKey = `${getYear(now)}-W${getWeek(now, {
          weekStartsOn: 1,
        })
          .toString()
          .padStart(2, "0")}`;
        break;
      case "monthly":
        currentTimeframeKey = `${getYear(now)}-${(now.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        break;
      case "yearly":
        currentTimeframeKey = getYear(now).toString();
        break;
      case "life":
        currentTimeframeKey = "life";
        break;
    }

    return timeframeKeys.map((timeframeKey, index) => {
      // Determine the status of this container
      let status: "previous" | "current" | "next" | "other" = "other";

      if (timeframeKey === currentTimeframeKey) {
        status = "current";
      } else if (index === timeframeKeys.indexOf(currentTimeframeKey) - 1) {
        status = "previous";
      } else if (index === timeframeKeys.indexOf(currentTimeframeKey) + 1) {
        status = "next";
      }

      const goals = getTasksByType(selectedGoalType, timeframeKey);
      return {
        timeframeKey,
        goals: filterGoals(goals),
        status,
      };
    });
  };

  // Navigation functions
  const navigatePrevious = () => {
    switch (selectedGoalType) {
      case "weekly":
        setReferenceDate((date) => subWeeks(date, 1));
        break;
      case "monthly":
        setReferenceDate((date) => subMonths(date, 1));
        break;
      case "yearly":
        setReferenceDate((date) => subYears(date, 1));
        break;
      default:
        break;
    }
  };

  const navigateNext = () => {
    switch (selectedGoalType) {
      case "weekly":
        setReferenceDate((date) => addWeeks(date, 1));
        break;
      case "monthly":
        setReferenceDate((date) => addMonths(date, 1));
        break;
      case "yearly":
        setReferenceDate((date) => addYears(date, 1));
        break;
      default:
        break;
    }
  };

  const navigatePreviousMultiple = () => {
    switch (selectedGoalType) {
      case "weekly":
        setReferenceDate((date) => subWeeks(date, 5));
        break;
      case "monthly":
        setReferenceDate((date) => subMonths(date, 5));
        break;
      case "yearly":
        setReferenceDate((date) => subYears(date, 5));
        break;
      default:
        break;
    }
  };

  const navigateNextMultiple = () => {
    switch (selectedGoalType) {
      case "weekly":
        setReferenceDate((date) => addWeeks(date, 5));
        break;
      case "monthly":
        setReferenceDate((date) => addMonths(date, 5));
        break;
      case "yearly":
        setReferenceDate((date) => addYears(date, 5));
        break;
      default:
        break;
    }
  };

  // Navigate back to current period
  const navigateToCurrent = () => {
    setReferenceDate(new Date());
  };

  // Helper function to extract the original task ID from a draggable ID
  const extractTaskId = (draggableId: string): string => {
    return draggableId.includes(":") ? draggableId.split(":")[0] : draggableId;
  };

  // Helper function to get all goal IDs for a specific type and timeframe
  const getGoalIds = (type: Task["type"], timeFrameKey: string): string[] => {
    const goals = getTasksByType(type, timeFrameKey);
    return goals.map((goal) => goal.id);
  };

  // Helper function to check if a goal is repetitive
  const isGoalRepetitive = (goal: Task): boolean => {
    return Boolean(goal.repeatedDays?.includes(goal.type));
  };

  // Handle drag end event
  const handleDragEnd = (result: DropResult): void => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back in its original position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // Extract the original task ID from the draggable ID
    const taskId = extractTaskId(draggableId);

    // Extract type and timeFrameKey from source and destination droppableIds
    const [sourceType, sourceTimeFrameKey] = source.droppableId.split(":");
    const [destType, destTimeFrameKey] = destination.droppableId.split(":");

    // Get the task being dragged
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // If moving within the same container
    if (source.droppableId === destination.droppableId) {
      // Get all goal IDs for this container
      const goalIds = getGoalIds(
        sourceType as Task["type"],
        sourceTimeFrameKey
      );

      // Reorder the goal IDs
      const [removed] = goalIds.splice(source.index, 1);
      goalIds.splice(destination.index, 0, removed);

      // Update positions for each goal in the container
      goalIds.forEach((id, index) => {
        const goal = tasks.find((t) => t.id === id);
        if (!goal) return;

        if (isGoalRepetitive(goal)) {
          // For repetitive goals, update position only for this specific timeframe
          setGoalPositionForTimeFrame(id, sourceTimeFrameKey, index + 1);
        } else {
          // For non-repetitive goals, update the regular position
          updateTask(id, { position: index + 1 });
        }
      });
    } else {
      // Moving between different containers
      // Check if we should duplicate or move
      const shouldDuplicate = preferences.duplicateWhenDragging || false;

      if (shouldDuplicate) {
        // Create a new goal with the destination type and timeFrameKey (duplicate behavior)
        const newTask: Task = {
          id: uuidv4(),
          name: task.name,
          description: task.description,
          isCompleted: false,
          type: destType as Task["type"],
          timeFrameKey: destTimeFrameKey,
          tags: task.tags,
          priority: task.priority,
          // Don't make it repetitive by default
          repeatedDays: [],
          pomodoros: task.pomodoros,
          position: 999,
          completedDates: [],
          positionsByDate: {},
          positionsByTimeFrame: {},
        };

        // Add the new goal
        addTask(newTask);

        // Get the current goal IDs for the destination container
        const destinationGoalIds = getGoalIds(
          destType as Task["type"],
          destTimeFrameKey
        );

        // Insert the new goal at the destination index
        destinationGoalIds.splice(destination.index, 0, newTask.id);

        // Update the positions for each goal in the destination container
        destinationGoalIds.forEach((id, index) => {
          const goal = tasks.find((t) => t.id === id);
          if (!goal) return;

          if (isGoalRepetitive(goal)) {
            // For repetitive goals, update position only for this specific timeframe
            setGoalPositionForTimeFrame(id, destTimeFrameKey, index + 1);
          } else {
            // For non-repetitive goals, update the regular position
            updateTask(id, { position: index + 1 });
          }
        });
      } else {
        // Move the goal by updating its type and timeFrameKey (move behavior)
        updateTask(taskId, {
          type: destType as Task["type"],
          timeFrameKey: destTimeFrameKey,
        });

        // Get the current goal IDs for the source container
        const sourceGoalIds = getGoalIds(
          sourceType as Task["type"],
          sourceTimeFrameKey
        ).filter((id) => id !== taskId);

        // Update positions for each goal in the source container
        sourceGoalIds.forEach((id, index) => {
          const goal = tasks.find((t) => t.id === id);
          if (!goal) return;

          if (isGoalRepetitive(goal)) {
            // For repetitive goals, update position only for this specific timeframe
            setGoalPositionForTimeFrame(id, sourceTimeFrameKey, index + 1);
          } else {
            // For non-repetitive goals, update the regular position
            updateTask(id, { position: index + 1 });
          }
        });

        // Get the current goal IDs for the destination container
        const destinationGoalIds = getGoalIds(
          destType as Task["type"],
          destTimeFrameKey
        ).filter((id) => id !== taskId);

        // Insert the goal at the destination index
        destinationGoalIds.splice(destination.index, 0, taskId);

        // Update positions for each goal in the destination container
        destinationGoalIds.forEach((id, index) => {
          const goal = tasks.find((t) => t.id === id);
          if (!goal) return;

          if (isGoalRepetitive(goal)) {
            // For repetitive goals, update position only for this specific timeframe
            setGoalPositionForTimeFrame(id, destTimeFrameKey, index + 1);
          } else {
            // For non-repetitive goals, update the regular position
            updateTask(id, { position: index + 1 });
          }
        });
      }
    }
  };

  // Render the goal card component with proper props
  const renderGoalCard = (goal: Task, index: number, timeFrameKey: string) => {
    // Check if this is a repeating goal
    const isRepeating = goal.repeatedDays?.includes(goal.type) || false;

    // For repeating goals, use a unique key that includes the timeframe
    const cardKey = isRepeating ? `${goal.id}-${timeFrameKey}` : goal.id;

    // Create a unique draggable ID for repetitive goals
    const draggableId = isRepeating ? `${goal.id}:${timeFrameKey}` : goal.id;

    return (
      <TaskCard
        key={cardKey}
        id={goal.id}
        name={goal.name}
        description={goal.description}
        type={goal.type}
        tags={goal.tags || []}
        priority={goal.priority}
        timeFrameKey={goal.timeFrameKey}
        dueDate={goal.dueDate}
        date={format(new Date(), "yyyy-MM-dd")} // Use current date as context
        pomodoros={goal.pomodoros || 0}
        position={
          isRepeating
            ? getGoalPositionForTimeFrame(goal.id, timeFrameKey)
            : goal.position || 999
        }
        index={index}
        isRepeating={isRepeating}
        repeatedDays={goal.repeatedDays || []}
        draggableId={draggableId} // Pass the custom draggable ID
      />
    );
  };

  // Format display titles for different timeframes
  const formatTimeframeTitle = (
    type: GoalType,
    timeframeKey: string
  ): string => {
    switch (type) {
      case "weekly": {
        const [year, weekNum] = timeframeKey.split("-W");
        return `Week ${weekNum}, ${year}`;
      }
      case "monthly": {
        const [year, month] = timeframeKey.split("-");
        const date = new Date(
          Number.parseInt(year),
          Number.parseInt(month) - 1,
          1
        );
        return format(date, "MMMM yyyy");
      }
      case "yearly":
        return timeframeKey;
      case "life":
        return "Life Goals";
      default:
        return timeframeKey;
    }
  };

  // Format display subtitles for different timeframes
  const formatTimeframeSubtitle = (
    type: GoalType,
    timeframeKey: string
  ): string => {
    const now = new Date();
    const currentWeekKey = `${getYear(now)}-W${getWeek(now, { weekStartsOn: 1 })
      .toString()
      .padStart(2, "0")}`;
    const currentMonthKey = `${getYear(now)}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const currentYearKey = getYear(now).toString();

    if (timeframeKey === currentWeekKey && type === "weekly")
      return "Current Week";
    if (timeframeKey === currentMonthKey && type === "monthly")
      return "Current Month";
    if (timeframeKey === currentYearKey && type === "yearly")
      return "Current Year";

    switch (type) {
      case "weekly":
        return "Weekly Goals";
      case "monthly":
        return "Monthly Goals";
      case "yearly":
        return "Yearly Goals";
      case "life":
        return "Long-term Goals";
      default:
        return "";
    }
  };

  // Check if we're showing the current period
  const isCurrentPeriod = (): boolean => {
    const now = new Date();
    const currentWeekKey = `${getYear(now)}-W${getWeek(now, { weekStartsOn: 1 })
      .toString()
      .padStart(2, "0")}`;
    const currentMonthKey = `${getYear(now)}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const currentYearKey = getYear(now).toString();

    switch (selectedGoalType) {
      case "weekly":
        return timeframeKeys.includes(currentWeekKey);
      case "monthly":
        return timeframeKeys.includes(currentMonthKey);
      case "yearly":
        return timeframeKeys.includes(currentYearKey);
      default:
        return true;
    }
  };

  // Goal Preference Popover Component
  const GoalPreferencePopover = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const [showCompleted, setShowCompleted] = useState(
      preferences.showCompleted
    );
    const [showHabits, setShowHabits] = useState(preferences.showHabits);
    const [selectedTags, setSelectedTags] = useState<string[]>(
      preferences.selectedTags
    );
    const [selectedPriority, setSelectedPriority] = useState<
      "high" | "medium" | "low" | null
    >(preferences.selectedPriority);
    const [duplicateWhenDragging, setDuplicateWhenDragging] = useState(
      preferences.duplicateWhenDragging
    );
    const [showRepeatedGoals, setShowRepeatedGoals] = useState(
      preferences.showRepeatedGoals
    );
    const [hasChanges, setHasChanges] = useState(false);
    const [hasFilters, setHasFilters] = useState(false);

    const priorities = [
      { id: "high", label: "High", color: "text-red-500" },
      { id: "medium", label: "Medium", color: "text-yellow-500" },
      { id: "low", label: "Low", color: "text-blue-400" },
    ];

    // Track changes to enable/disable save button
    useEffect(() => {
      const hasChanged =
        showCompleted !== preferences.showCompleted ||
        showHabits !== preferences.showHabits ||
        JSON.stringify(selectedTags) !==
          JSON.stringify(preferences.selectedTags) ||
        selectedPriority !== preferences.selectedPriority ||
        duplicateWhenDragging !== preferences.duplicateWhenDragging ||
        showRepeatedGoals !== preferences.showRepeatedGoals;

      setHasChanges(hasChanged);
    }, [
      showCompleted,
      showHabits,
      selectedTags,
      selectedPriority,
      duplicateWhenDragging,
      showRepeatedGoals,
    ]);

    // Check if any filters are applied
    useEffect(() => {
      setHasFilters(
        !showCompleted ||
          !showHabits ||
          selectedTags.length > 0 ||
          selectedPriority !== null
      );
    }, [showCompleted, showHabits, selectedTags, selectedPriority]);

    const savePreferences = () => {
      // Apply preferences
      handlePreferencesChange({
        showCompleted,
        showHabits,
        selectedTags,
        selectedPriority,
        duplicateWhenDragging,
        showRepeatedGoals,
      });

      setHasChanges(false);
    };

    const resetAllFilters = () => {
      setShowCompleted(true);
      setShowHabits(true);
      setSelectedTags([]);
      setSelectedPriority(null);
      setHasChanges(true);
    };

    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="w-80 p-2"
          align="end"
          aria-label="Goal Preferences Popover"
        >
          <div className="rounded-lg flex flex-col">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-completed">Show completed goals</Label>
                <Switch
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                  aria-label="Toggle completed goals"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-habits">
                  Show habits (repeated tasks)
                </Label>
                <Switch
                  id="show-habits"
                  checked={showHabits}
                  onCheckedChange={setShowHabits}
                  aria-label="Toggle habits"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-repeated-goals">Show repeated goals</Label>
                <Switch
                  id="show-repeated-goals"
                  checked={showRepeatedGoals}
                  onCheckedChange={setShowRepeatedGoals}
                  aria-label="Toggle repeated goals"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="duplicate-when-dragging">
                  Duplicate when dragging between types
                </Label>
                <Switch
                  id="duplicate-when-dragging"
                  checked={duplicateWhenDragging}
                  onCheckedChange={setDuplicateWhenDragging}
                  aria-label="Toggle duplicate when dragging"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 mb-4">
              <Label id="priority-label" className="block mb-2">
                Filter by Priority
              </Label>
              <RadioGroup
                value={selectedPriority || ""}
                onValueChange={(value) =>
                  setSelectedPriority(
                    value ? (value as "high" | "medium" | "low") : null
                  )
                }
                className="flex justify-between"
              >
                {priorities.map((priority) => (
                  <div
                    key={priority.id}
                    className="flex items-center space-x-1"
                  >
                    <RadioGroupItem
                      value={priority.id}
                      id={`priority-${priority.id}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`priority-${priority.id}`}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer ${
                        selectedPriority === priority.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Flag className={`h-3 w-3 ${priority.color}`} />
                      <span className="text-xs">{priority.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2 mb-4">
              <Label id="tags-label" className="block mb-2">
                Filter by Tags
              </Label>
              <TagsSelect
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
              />
            </div>

            <div className="mt-4 flex justify-between">
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex items-center gap-1"
                  onClick={resetAllFilters}
                >
                  <RotateCcw className="size-3" />
                  Reset Filters
                </Button>
              )}
              <Button
                disabled={!hasChanges}
                variant="default"
                size="sm"
                className="h-8 ml-auto"
                onClick={savePreferences}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen flex flex-col">
        {/* Keyboard shortcuts component */}
        <KeyboardShortcuts />

        <header className="flex bg-muted/20 items-center justify-between w-full p-2">
          <Tabs
            value={selectedGoalType}
            onValueChange={(value) => {
              setSelectedGoalType(value as GoalType);
              setReferenceDate(new Date()); // Reset to current date when changing tabs
            }}
            className="w-full max-w-md"
          >
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
              <TabsTrigger value="life">Life</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center ml-auto">
            {selectedGoalType !== "life" && (
              <>
                {!isCurrentPeriod() && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={navigateToCurrent}
                    className="font-normal mr-2"
                  >
                    <span>Current</span>
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={navigatePreviousMultiple}
                >
                  <span className="sr-only">Jump multiple periods back</span>
                  <ChevronsLeft />
                </Button>
                <Button size="icon" variant="ghost" onClick={navigatePrevious}>
                  <span className="sr-only">Jump one period back</span>
                  <ChevronLeft />
                </Button>
                <Button size="icon" variant="ghost" onClick={navigateNext}>
                  <span className="sr-only">Jump one period forward</span>
                  <ChevronRight />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={navigateNextMultiple}
                >
                  <span className="sr-only">Jump multiple periods forward</span>
                  <ChevronsRight />
                </Button>
              </>
            )}

            <GoalPreferencePopover>
              <Button size="icon" variant="ghost" className="ml-2">
                <span className="sr-only">Settings</span>
                <Settings2Icon />
              </Button>
            </GoalPreferencePopover>
          </div>
        </header>

        <main className="w-full h-full bg-muted/20 grid grid-cols-5 gap-1 p-1 pt-0 overflow-hidden">
          {/* Render goal containers based on the selected goal type */}
          {getGoalsForTimeframeKeys().map(({ timeframeKey, goals, status }) => (
            <div
              key={`${selectedGoalType}-${timeframeKey}`}
              className="w-full h-full"
            >
              <GoalContainer
                title={formatTimeframeTitle(selectedGoalType, timeframeKey)}
                subtitle={formatTimeframeSubtitle(
                  selectedGoalType,
                  timeframeKey
                )}
                type={selectedGoalType}
                timeFrameKey={timeframeKey}
                droppableId={`${selectedGoalType}:${timeframeKey}`}
                status={status}
              >
                {goals.map((goal, goalIndex) =>
                  renderGoalCard(goal, goalIndex, timeframeKey)
                )}
              </GoalContainer>
            </div>
          ))}
        </main>
      </div>
    </DragDropContext>
  );
}
