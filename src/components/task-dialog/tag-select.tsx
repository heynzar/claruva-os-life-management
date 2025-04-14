"use client";
import { useState, useEffect, useRef } from "react";
import { Tag, Plus, Check, Trash, XIcon, Ellipsis } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TagsSelectProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  availableTags?: string[];
}

const TagsSelect = ({
  selectedTags = [],
  setSelectedTags,
  availableTags = ["Work", "Personal", "Urgent", "Later", "Ideas"],
}: TagsSelectProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState(availableTags);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tagMenuOpen, setTagMenuOpen] = useState<string | null>(null);

  // Filter tags and check if we need to show create option
  useEffect(() => {
    const shouldShowCreate =
      inputValue.trim() !== "" &&
      !tags.some((tag) => tag.toLowerCase() === inputValue.toLowerCase());

    setShowCreateOption(shouldShowCreate);
  }, [inputValue, tags]);

  // Toggle a tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Create and select a new tag
  const createNewTag = () => {
    if (inputValue.trim() === "") return;

    const newTag = inputValue.trim();
    if (!tags.includes(newTag)) {
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      setSelectedTags([...selectedTags, newTag]);
      setInputValue("");

      // Focus back on input after creating
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }
  };

  // Remove a selected tag
  const removeTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const deleteTag = (tagToDelete: string) => {
    const updatedTags = tags.filter((t) => t !== tagToDelete);
    const updatedSelectedTags = selectedTags.filter((t) => t !== tagToDelete);
    setTags(updatedTags);
    setSelectedTags(updatedSelectedTags);
    setTagMenuOpen(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" aria-expanded={open}>
          <Tag
            className={`${
              selectedTags.length ? "text-primary" : "opacity-70"
            } size-4`}
          />
          {selectedTags.length > 0 && selectedTags.length} Tags
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={inputValue}
            onValueChange={setInputValue}
            ref={inputRef}
          />
          <CommandList>
            <CommandEmpty className="p-2">
              {showCreateOption ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={createNewTag}
                  className="w-full"
                >
                  <Plus className="size-4" />
                  Create "{inputValue}" tag
                </Button>
              ) : (
                // <p>aaaaaaaa</p>
                <span>No tags found.</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {tags
                .filter((tag) =>
                  tag.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((tag) => (
                  <CommandItem
                    key={tag}
                    onSelect={() => toggleTag(tag)}
                    className="flex group items-center justify-between cursor-pointer py-0 px-1 h-8"
                  >
                    <p className="flex items-center gap-2">
                      <Tag
                        className={`size-4 flex-shrink-0 ${
                          selectedTags.includes(tag)
                            ? "text-blue-500"
                            : "text-gray-500"
                        }`}
                      />
                      <span>{tag}</span>
                    </p>
                    {selectedTags.includes(tag) ? (
                      <Check className="size-4 mr-1 flex-shrink-0" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 hidden group-hover:flex hover:!bg-muted-foreground/20 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagMenuOpen(tag);
                        }}
                      >
                        <Ellipsis className="size-4" />
                      </Button>
                    )}

                    {tagMenuOpen === tag && (
                      <div className="bg-card cursor-default absolute inset-0 w-full h-8 rounded-md p-0 text-sm">
                        <div className="flex dark:bg-destructive/60 bg-destructive rounded-sm h-8 px-2 py-1 justify-between items-center w-full pr-0.5">
                          <button
                            className="hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTag(tag);
                            }}
                          >
                            Delete "{tag}" Tag
                          </button>
                          <span
                            className="size-7 hover:bg-muted-foreground/20 cursor-pointer flex items-center justify-center rounded-sm"
                            onClick={() => setTagMenuOpen(null)}
                          >
                            <XIcon className="size-4 text-white" />
                          </span>
                        </div>
                      </div>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TagsSelect;
