import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TagsStore {
  tags: string[];
  addTag: (tag: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
  deleteTag: (tag: string) => void;
  resetToDefaults: () => void;
}

const defaultTags = ["Deen", "Growth", "Work", "Study", "Health"];

export const useTagsStore = create<TagsStore>()(
  persist(
    (set) => ({
      tags: [...defaultTags],

      addTag: (tag: string) =>
        set((state) => ({
          tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag],
        })),

      updateTag: (oldTag: string, newTag: string) =>
        set((state) => ({
          tags: state.tags.map((tag) => (tag === oldTag ? newTag : tag)),
        })),

      deleteTag: (tag: string) =>
        set((state) => ({
          tags: state.tags.filter((t) => t !== tag),
        })),

      resetToDefaults: () =>
        set({
          tags: [...defaultTags],
        }),
    }),
    {
      name: "tags-store",
    }
  )
);
