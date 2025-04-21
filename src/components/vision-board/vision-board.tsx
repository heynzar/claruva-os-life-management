"use client";
import { useState } from "react";
import {
  useVisionBoardStore,
  type VisionBoardItem,
} from "@/stores/useVisionBoardStore";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Trash2, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextEditingDialog from "./text-editing-dialog";

// Update the VisionBoardItem interface to include the new properties
// This should match what's in your actual store file
declare module "@/stores/useVisionBoardStore" {
  interface VisionBoardItem {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageUrl: string;
    caption?: string;
    textBackground?: string;
    textColor?: string;
    fontSize?: number;
    isText?: boolean;
  }
}

// Width provider enhances the Responsive Grid Layout with auto width detection
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function VisionBoard() {
  const { items, removeItem, updateItemPosition, updateItemSize } =
    useVisionBoardStore();

  const [isLayoutChanging, setIsLayoutChanging] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTextContent, setEditTextContent] = useState("");
  const [editTextBackground, setEditTextBackground] = useState("#ffffff");
  const [editTextColor, setEditTextColor] = useState("#000000");
  const [editFontSize, setEditFontSize] = useState(16);

  // Convert the items to the format expected by react-grid-layout
  const layouts = {
    lg: items.map((item) => ({
      i: item.id,
      x: item.x,
      y: item.y,
      w: item.width,
      h: item.height,
      minW: 1,
      minH: 1,
    })),
  };

  // Handle when items are repositioned on the grid
  const handleLayoutChange = (layout: Layout[]) => {
    layout.forEach((l) => {
      const item = items.find((i) => i.id === l.i);
      if (item) {
        updateItemPosition(l.i, l.x, l.y);
        updateItemSize(l.i, l.w, l.h);
      }
    });
  };

  // Open edit dialog for text
  const handleEditText = (item: VisionBoardItem) => {
    setEditingItemId(item.id);
    setEditTextContent(item.caption || "");
    setEditTextBackground(item.textBackground || "#ffffff");
    setEditTextColor(item.textColor || "#000000");
    setEditFontSize(item.fontSize || 16);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Text editing dialog */}
      <TextEditingDialog
        editingItemId={editingItemId}
        setEditingItemId={setEditingItemId}
        editTextContent={editTextContent}
        editTextColor={editTextColor}
        setEditFontSize={setEditFontSize}
        editFontSize={editFontSize}
        setEditTextColor={setEditTextColor}
        setEditTextContent={setEditTextContent}
        editTextBackground={editTextBackground}
        setEditTextBackground={setEditTextBackground}
      />
      <div
        id="vision-board-container"
        className={`flex-1 bg-muted/40 ${isLayoutChanging ? "bg-muted" : ""}`}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h3 className="text-lg font-medium mb-2">
              Your vision board is empty
            </h3>
            <p className="text-muted-foreground mb-4">
              Add images or text that represent your goals and dreams
            </p>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            containerPadding={[10, 10]}
            margin={[10, 10]}
            onLayoutChange={(layout: Layout[]) => handleLayoutChange(layout)}
            onDragStart={() => setIsLayoutChanging(true)}
            onDragStop={() => setIsLayoutChanging(false)}
            onResizeStart={() => setIsLayoutChanging(true)}
            onResizeStop={() => setIsLayoutChanging(false)}
            isDraggable
            isResizable
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-md overflow-hidden"
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
              >
                <div className="relative h-full flex flex-col">
                  {/* Control buttons - visible on hover */}
                  {hoveredItemId === item.id && (
                    <div className="absolute top-1 right-1 z-10 gap-1 flex control-buttons">
                      {item.isText && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="control-button"
                          onClick={() => handleEditText(item)}
                        >
                          <Pen />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => removeItem(item.id)}
                        className="control-button text-red-500"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )}

                  {/* Display image or text content */}
                  {item.isText ? (
                    <div
                      className="flex-1 flex items-center justify-center p-4 pt-3 text-center"
                      style={{
                        backgroundColor: item.textBackground || "#ffffff",
                        color: item.textColor || "#000000",
                        fontSize: `${item.fontSize || 16}px`,
                      }}
                    >
                      <p className="font-medium">{item.caption}</p>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <img
                        src={item.imageUrl}
                        alt={item.caption || "Vision board image"}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/api/placeholder/400/300";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  );
}
