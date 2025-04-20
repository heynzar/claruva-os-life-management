"use client";
import { useState, useEffect, useRef } from "react";
import { Tag, Plus, Check, XIcon, Ellipsis, Edit2, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTagsStore } from "@/stores/useTagsStore";

interface TagsSelectProps {
  type?: "task-dialog" | "preference";
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  availableTags?: string[];
}

const TagsSelect = ({
  type = "task-dialog",
  selectedTags = [],
  setSelectedTags,
  availableTags,
}: TagsSelectProps) => {
  const { tags: storeTags, addTag, updateTag, deleteTag } = useTagsStore();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tagMenuOpen, setTagMenuOpen] = useState<string | null>(null);

  // Tag editing state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<string | null>(null);
  const [editedTagValue, setEditedTagValue] = useState("");

  // Initialize tags from store or props
  useEffect(() => {
    setTags(availableTags || storeTags);
  }, [availableTags, storeTags]);

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
      // Add to global store
      addTag(newTag);

      // Add to selected tags
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

  // Delete a tag
  const handleDeleteTag = (tagToDelete: string) => {
    // Remove from global store
    deleteTag(tagToDelete);

    // Remove from selected tags if present
    if (selectedTags.includes(tagToDelete)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagToDelete));
    }

    setTagMenuOpen(null);
  };

  // Open edit dialog
  const openEditDialog = (tag: string) => {
    setTagToEdit(tag);
    setEditedTagValue(tag);
    setIsEditDialogOpen(true);
    setTagMenuOpen(null);
  };

  // Save edited tag
  const saveEditedTag = () => {
    if (
      tagToEdit &&
      editedTagValue.trim() !== "" &&
      editedTagValue !== tagToEdit
    ) {
      // Update in global store
      updateTag(tagToEdit, editedTagValue.trim());

      // Update in selected tags if present
      if (selectedTags.includes(tagToEdit)) {
        setSelectedTags(
          selectedTags.map((t) => (t === tagToEdit ? editedTagValue.trim() : t))
        );
      }
    }

    setIsEditDialogOpen(false);
    setTagToEdit(null);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            className={
              type === "task-dialog" ? "w-min" : "justify-start w-full"
            }
            variant="outline"
            aria-expanded={open}
          >
            <Tag
              className={`${
                selectedTags.length ? "text-primary" : "opacity-70"
              } size-4`}
            />
            {type === "task-dialog"
              ? selectedTags.length > 0
                ? `${selectedTags.length} Tags`
                : "Tags"
              : selectedTags.length > 0
              ? selectedTags.length === 1
                ? selectedTags[0]
                : `${selectedTags[0]} + ${selectedTags.length - 1} more`
              : "Tags"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command className="max-h-[10.8rem]">
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
                    Create &quot;{inputValue}&quot; tag
                  </Button>
                ) : (
                  <span>No tags found.</span>
                )}
              </CommandEmpty>
              <CommandGroup className="overflow-auto">
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
                          className={`size-4 ml-1 flex-shrink-0 ${
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
                          className="size-6 hidden rounded-sm group-hover:flex hover:!bg-muted-foreground/20 flex-shrink-0"
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
                          <div className="flex dark:bg-muted/80 bg-muted rounded-sm h-8 px-1 py-1 justify-between items-center w-full">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 rounded-sm hover:!bg-muted-foreground/20 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(tag);
                                }}
                              >
                                <Edit2 className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 rounded-sm hover:!bg-muted-foreground/20 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTag(tag);
                                }}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                            <span
                              className="size-6 hover:bg-muted-foreground/20 cursor-pointer flex items-center justify-center rounded-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTagMenuOpen(null);
                              }}
                            >
                              <XIcon className="size-4" />
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

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedTagValue}
              onChange={(e) => setEditedTagValue(e.target.value)}
              placeholder="Tag name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveEditedTag();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedTag} disabled={!editedTagValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TagsSelect;
