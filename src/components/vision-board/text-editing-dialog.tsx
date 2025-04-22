"use client";
import React, { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  onSave?: () => void;
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
  onSave,
}: TextEditingDialogProps) => {
  const { updateItem } = useVisionBoardStore();

  // Font size mapping for radio buttons
  const fontSizeMap = {
    small: 14,
    medium: 18,
    large: 24,
  };

  // Get current font size category
  const getCurrentFontSize = (): "small" | "medium" | "large" => {
    if (editFontSize <= 14) return "small";
    if (editFontSize >= 24) return "large";
    return "medium";
  };

  const [fontSize, setFontSize] = React.useState<"small" | "medium" | "large">(
    getCurrentFontSize
  );

  // Update editFontSize when fontSize changes
  React.useEffect(() => {
    setEditFontSize(fontSizeMap[fontSize]);
  }, [fontSize, setEditFontSize]);

  // Update fontSize when editFontSize changes from outside
  React.useEffect(() => {
    setFontSize(getCurrentFontSize());
  }, [editFontSize]);

  const handleSaveTextEdit = () => {
    if (!editingItemId) return;

    updateItem(editingItemId, {
      caption: editTextContent,
      textBackground: editTextBackground,
      textColor: editTextColor,
      fontSize: fontSizeMap[fontSize],
    });

    if (onSave) {
      onSave();
    }

    setEditingItemId(null);
  };

  return (
    <Dialog
      open={Boolean(editingItemId)}
      onOpenChange={(open) => !open && setEditingItemId(null)}
    >
      <DialogContent className="sm:max-w-md p-2">
        <DialogHeader>
          <DialogTitle className="text-center">Edit Text</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          <div>
            <Label htmlFor="text-content" className="sr-only">
              Text Content
            </Label>
            <Textarea
              id="text-content"
              placeholder="Enter your text here..."
              value={editTextContent}
              onChange={(e) => setEditTextContent(e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div className="flex justify-between items-center">
            <Label id="font-size-label" className="sr-only">
              Font Size
            </Label>
            <RadioGroup
              value={fontSize}
              onValueChange={(value) =>
                setFontSize(value as "small" | "medium" | "large")
              }
              className="flex w-full gap-2"
            >
              {[
                { id: "small", label: "Small" },
                { id: "medium", label: "Medium" },
                { id: "large", label: "Large" },
              ].map((size) => (
                <div key={size.id} className="flex flex-1 items-center">
                  <RadioGroupItem
                    value={size.id}
                    id={`font-size-${size.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`font-size-${size.id}`}
                    className={
                      buttonVariants({
                        variant: fontSize === size.id ? "secondary" : "outline",
                        size: "sm",
                      }) + " w-full border"
                    }
                  >
                    <span className="text-xs">{size.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="background-color" className="sr-only">
                Background
              </Label>
              <div className="flex">
                <div
                  className="w-8 h-8 border rounded-l-md"
                  style={{ backgroundColor: editTextBackground }}
                >
                  <input
                    type="color"
                    value={editTextBackground}
                    onChange={(e) => setEditTextBackground(e.target.value)}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <Input
                  id="background-color"
                  value={editTextBackground}
                  onChange={(e) => setEditTextBackground(e.target.value)}
                  className="rounded-l-none flex-1 h-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="text-color" className="sr-only">
                Text Color
              </Label>
              <div className="flex">
                <div
                  className="w-8 h-8 border rounded-l-md"
                  style={{ backgroundColor: editTextColor }}
                >
                  <input
                    type="color"
                    value={editTextColor}
                    onChange={(e) => setEditTextColor(e.target.value)}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <Input
                  id="text-color"
                  value={editTextColor}
                  onChange={(e) => setEditTextColor(e.target.value)}
                  className="rounded-l-none flex-1 h-8"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border p-1">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Preview
            </Label>
            <div
              style={{
                backgroundColor: editTextBackground,
                color: editTextColor,
                fontSize: `${fontSizeMap[fontSize]}px`,
              }}
              className="flex items-center justify-center text-center min-h-[100px] rounded"
            >
              {editTextContent || "Preview text will appear here"}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingItemId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTextEdit}
              disabled={!editTextContent.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditingDialog;
