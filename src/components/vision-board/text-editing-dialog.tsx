"use client";
import React, { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useVisionBoardStore } from "@/stores/useVisionBoardStore";

type TextEditingDialogProps = {
  editingItemId: string | null;
  setEditingItemId: Dispatch<SetStateAction<string | null>>;

  editFontSize: number;
  setEditFontSize: Dispatch<SetStateAction<number>>;

  editTextColor: string;
  setEditTextColor: Dispatch<SetStateAction<string>>;

  editTextContent: string;
  setEditTextContent: Dispatch<SetStateAction<string>>;

  editTextBackground: string;
  setEditTextBackground: Dispatch<SetStateAction<string>>;
};

const TextEditingDialog = ({
  editingItemId,
  setEditingItemId,
  editTextContent,
  editTextColor,
  setEditFontSize,
  editFontSize,
  setEditTextColor,
  setEditTextContent,
  editTextBackground,
  setEditTextBackground,
}: TextEditingDialogProps) => {
  const { updateItem } = useVisionBoardStore();
  const handleSaveTextEdit = () => {
    if (!editingItemId) return;

    updateItem(editingItemId, {
      caption: editTextContent,
      textBackground: editTextBackground,
      textColor: editTextColor,
      fontSize: editFontSize,
    });

    setEditingItemId(null);
  };
  return (
    <Dialog
      open={Boolean(editingItemId)}
      onOpenChange={(open) => !open && setEditingItemId(null)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Text</DialogTitle>
          <DialogDescription>
            Update your text content and styling
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Text Content</label>
          <Textarea
            placeholder="Your affirmation or goal text"
            value={editTextContent}
            onChange={(e) => setEditTextContent(e.target.value)}
            className="w-full min-h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Background Color
            </label>
            <div className="flex items-center">
              <input
                type="color"
                value={editTextBackground}
                onChange={(e) => setEditTextBackground(e.target.value)}
                className="w-8 h-8 mr-2 border rounded"
              />
              <Input
                type="text"
                value={editTextBackground}
                onChange={(e) => setEditTextBackground(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Text Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={editTextColor}
                onChange={(e) => setEditTextColor(e.target.value)}
                className="w-8 h-8 mr-2 border rounded"
              />
              <Input
                type="text"
                value={editTextColor}
                onChange={(e) => setEditTextColor(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Font Size: {editFontSize}px
          </label>
          <Slider
            defaultValue={[editFontSize]}
            min={10}
            max={40}
            step={1}
            onValueChange={(value) => setEditFontSize(value[0])}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Preview</label>
          <div
            style={{
              backgroundColor: editTextBackground,
              color: editTextColor,
              fontSize: `${editFontSize}px`,
            }}
            className="p-4 rounded border flex items-center justify-center text-center min-h-24"
          >
            {editTextContent || "Preview text will appear here"}
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setEditingItemId(null)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button onClick={handleSaveTextEdit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditingDialog;
