import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

export interface VisionBoardItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
}

interface VisionBoardStore {
  items: VisionBoardItem[];
  addItem: (item: VisionBoardItem) => void;
  updateItem: (id: string, updates: Partial<VisionBoardItem>) => void;
  removeItem: (id: string) => void;
  updateItemPosition: (id: string, x: number, y: number) => void;
  updateItemSize: (id: string, width: number, height: number) => void;
}

export const useVisionBoardStore = create<VisionBoardStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set(
          produce((state: VisionBoardStore) => {
            state.items.push(item);
          })
        ),

      updateItem: (id, updates) =>
        set(
          produce((state: VisionBoardStore) => {
            const index = state.items.findIndex((item) => item.id === id);
            if (index !== -1) {
              state.items[index] = { ...state.items[index], ...updates };
            }
          })
        ),

      removeItem: (id) =>
        set(
          produce((state: VisionBoardStore) => {
            state.items = state.items.filter((item) => item.id !== id);
          })
        ),

      updateItemPosition: (id, x, y) =>
        set(
          produce((state: VisionBoardStore) => {
            const index = state.items.findIndex((item) => item.id === id);
            if (index !== -1) {
              state.items[index].x = x;
              state.items[index].y = y;
            }
          })
        ),

      updateItemSize: (id, width, height) =>
        set(
          produce((state: VisionBoardStore) => {
            const index = state.items.findIndex((item) => item.id === id);
            if (index !== -1) {
              state.items[index].width = width;
              state.items[index].height = height;
            }
          })
        ),
    }),
    {
      name: "vision-board-store",
    }
  )
);
