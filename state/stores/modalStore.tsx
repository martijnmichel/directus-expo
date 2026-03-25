import { create } from "zustand";
import React from "react";
import { router } from "expo-router";

interface ModalState {
  Content: React.FC | null;
  title: string;
  open: (component: React.FC, title?: string) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  Content: null,
  title: "",
  open: (component, title = "") => {
    set({ Content: component, title });
    router.push("/modals/dynamic");
  },
  close: () => {
    set({ Content: null, title: "" });
    router.dismiss();
  },
}));
