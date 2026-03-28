import { CoreSchema } from "@directus/sdk";
import { useRouter } from "expo-router";
import { merge } from "lodash";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
interface Draft {
  meta?: {
    documentSessionId: string;
    field: string;
    collection: keyof CoreSchema;
  };
  data: Record<string, any>;
}

interface DraftState {
  drafts: { [draftId: string]: Draft };
  pushPatch: (draftId: string, data: Record<string, any>) => void;
}

export const useDraftStore = create<DraftState>()(
  devtools(
    (set) => ({
      drafts: {},
      pushPatch: (draftId: string, data: Record<string, any>) => {
        set((state) => ({
          drafts: {
            ...state.drafts,
            [draftId]: {
              ...state.drafts[draftId],
              data: merge(state.drafts[draftId]?.data, data),
            },
          },
        }));
      },
    }),
    {
      name: "draftStore",
      enabled: true,
      trace: true,
    },
  ),
);

export const useDraft = (draftId: string) => {
  const { drafts } = useDraftStore();
  return drafts[draftId];
};
