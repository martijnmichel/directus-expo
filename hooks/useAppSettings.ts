import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppSettings = {
  theme: "light" | "dark";
  locale: string;
};
