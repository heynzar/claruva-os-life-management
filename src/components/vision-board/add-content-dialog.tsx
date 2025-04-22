"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useVisionBoardStore } from "@/stores/useVisionBoardStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Link, Type } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const AddContentDialog = ({ children }: { children: React.ReactNode }) => {
  const { addItem } = useVisionBoardStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Image uploads state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // URL input state
  const [imageUrl, setImageUrl] = useState("");

  // Text content state
  const [textContent, setTextContent] = useState("");
  const [textBackground, setTextBackground] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState("medium");

  // Font size mapping for radio buttons
  const fontSizeMap = {
    small: 14,
    medium: 18,
    large: 24,
  };

  // Reset all form states
  const resetForms = () => {
    setSelectedFiles([]);
    setImageUrl("");
    setTextContent("");
    setTextBackground("#ffffff");
    setTextColor("#000000");
    setFontSize("medium");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Close dialog and reset forms
  const handleClose = () => {
    setAddDialogOpen(false);
    resetForms();
  };

  // Handle file selection
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  // Upload images
  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          if (imageUrl) {
            addItem({
              id: uuidv4(),
              x: 0,
              y: Infinity,
              width: 2,
              height: 2,
              imageUrl,
              isText: false,
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    handleClose();
  };

  // Add image from URL
  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) return;

    addItem({
      id: uuidv4(),
      x: 0,
      y: Infinity,
      width: 2,
      height: 2,
      imageUrl: imageUrl.trim(),
      isText: false,
    });

    handleClose();
  };

  // Add text block
  const handleAddText = () => {
    if (!textContent.trim()) return;

    addItem({
      id: uuidv4(),
      x: 0,
      y: Infinity,
      width: 2,
      height: 2,
      imageUrl: "",
      caption: textContent,
      textBackground,
      textColor,
      fontSize: fontSizeMap[fontSize as keyof typeof fontSizeMap],
      isText: true,
    });

    handleClose();
  };

  return (
    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-2">
        <DialogHeader>
          <DialogTitle className="text-center">Add to Vision Board</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload size={16} />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link size={16} />
              <span>URL</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type size={16} />
              <span>Text</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Images Tab */}
          <TabsContent value="upload" className="mt-4 space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleFileSelection}
                className="hidden"
              />
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload images</p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF, SVG
              </p>
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-sm text-primary font-medium">
                  {selectedFiles.length}{" "}
                  {selectedFiles.length === 1 ? "file" : "files"} selected
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadImages}
                disabled={selectedFiles.length === 0}
              >
                Upload
              </Button>
            </div>
          </TabsContent>

          {/* Image URL Tab */}
          <TabsContent value="url" className="mt-4 space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAddImageUrl} disabled={!imageUrl.trim()}>
                Add Image
              </Button>
            </div>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="mt-4 space-y-2">
            <div>
              <Label htmlFor="text-content" className="sr-only">
                Text Content
              </Label>
              <Textarea
                id="text-content"
                placeholder="Enter your text here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
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
                          variant:
                            fontSize === size.id ? "secondary" : "outline",
                          size: "sm",
                        }) + " w w-full border"
                      }
                    >
                      <span className="text-xs">{size.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="background-color" className="sr-only">
                  Background
                </Label>
                <div className="flex">
                  <div
                    className="w-8 h-8 border rounded-l-md"
                    style={{ backgroundColor: textBackground }}
                  >
                    <input
                      type="color"
                      value={textBackground}
                      onChange={(e) => setTextBackground(e.target.value)}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <Input
                    id="background-color"
                    value={textBackground}
                    onChange={(e) => setTextBackground(e.target.value)}
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
                    style={{ backgroundColor: textColor }}
                  >
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <Input
                    id="text-color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
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
                  backgroundColor: textBackground,
                  color: textColor,
                  fontSize: `${
                    fontSizeMap[fontSize as keyof typeof fontSizeMap]
                  }px`,
                }}
                className="flex items-center justify-center text-center min-h-[100px] rounded"
              >
                {textContent || "Preview text will appear here"}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAddText} disabled={!textContent.trim()}>
                Add Text
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddContentDialog;
