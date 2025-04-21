"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useVisionBoardStore } from "@/stores/useVisionBoardStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";

const AddContentDialog = ({ children }: { children: React.ReactNode }) => {
  const { addItem } = useVisionBoardStore();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [multipleUrls, setMultipleUrls] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textBackground, setTextBackground] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Handle file selection for uploads
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  // Handle uploading multiple files
  const handleUploadMultipleFiles = () => {
    if (selectedFiles.length === 0) return;

    const processFiles = async () => {
      for (const file of selectedFiles) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string;
            if (imageUrl) {
              addItem({
                id: uuidv4(),
                x: 0,
                y: Infinity, // Add at the bottom
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
    };

    processFiles().then(() => {
      setSelectedFiles([]);
      setAddDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  // Handle adding multiple URLs
  const handleAddMultipleUrls = () => {
    const urls = multipleUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) return;

    urls.forEach((url) => {
      addItem({
        id: uuidv4(),
        x: 0,
        y: Infinity, // Add at the bottom
        width: 2,
        height: 2,
        imageUrl: url,
        isText: false,
      });
    });

    setMultipleUrls("");
    setAddDialogOpen(false);
  };

  // Handle adding text
  const handleAddText = () => {
    if (!textContent.trim()) return;

    addItem({
      id: uuidv4(),
      x: 0,
      y: Infinity, // Add at the bottom
      width: 2,
      height: 2,
      imageUrl: "", // No image for text items
      caption: textContent,
      textBackground,
      textColor,
      fontSize,
      isText: true,
    });

    setTextContent("");
    setTextBackground("#ffffff");
    setTextColor("#000000");
    setFontSize(16);
    setAddDialogOpen(false);
  };

  return (
    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-2">
        <DialogHeader className="sr-only">
          <DialogTitle>Add to Vision Board</DialogTitle>
          <DialogDescription>
            Add images or text to visualize your goals and dreams
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="grid bg-transparent gap-1 w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Images</TabsTrigger>
            <TabsTrigger value="urls">Image URLs</TabsTrigger>
            <TabsTrigger value="text">Add Text</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Upload Images
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleFileSelection}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-sm text-blue-500">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <Button
                onClick={handleUploadMultipleFiles}
                disabled={selectedFiles.length === 0}
                className="flex-1"
              >
                Upload{" "}
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} Image${
                      selectedFiles.length > 1 ? "s" : ""
                    }`
                  : "Images"}
              </Button>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="urls" className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Image URLs (one per line)
              </label>
              <Textarea
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                value={multipleUrls}
                onChange={(e) => setMultipleUrls(e.target.value)}
                className="w-full min-h-32"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Button
                onClick={handleAddMultipleUrls}
                disabled={!multipleUrls.trim()}
                className="flex-1"
              >
                Add Images from URLs
              </Button>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Text Content
              </label>
              <Textarea
                placeholder="Your affirmation or goal text"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
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
                    value={textBackground}
                    onChange={(e) => setTextBackground(e.target.value)}
                    className="w-8 h-8 mr-2 border rounded"
                  />
                  <Input
                    type="text"
                    value={textBackground}
                    onChange={(e) => setTextBackground(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Text Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 mr-2 border rounded"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Font Size: {fontSize}px
              </label>
              <Slider
                defaultValue={[fontSize]}
                min={10}
                max={40}
                step={1}
                onValueChange={(value) => setFontSize(value[0])}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Preview</label>
              <div
                style={{
                  backgroundColor: textBackground,
                  color: textColor,
                  fontSize: `${fontSize}px`,
                }}
                className="p-4 rounded border flex items-center justify-center text-center min-h-24"
              >
                {textContent || "Preview text will appear here"}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Button
                onClick={handleAddText}
                disabled={!textContent.trim()}
                className="flex-1"
              >
                Add Text Block
              </Button>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddContentDialog;
