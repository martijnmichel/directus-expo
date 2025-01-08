import { useEffect } from "react";
import { Redirect, Slot, Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
