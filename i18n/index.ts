import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import your translation files
import en from "./locales/en.json";
import nl from "./locales/nl.json";
import { DirectusIconName } from "@/components/display/directus-icon";

i18n.use(initReactI18next).init({
  resources: {
    "en-US": {
      translation: en,
    },
    "nl-NL": {
      translation: nl,
    },
  },
  lng: "en-US", // default language
  fallbackLng: "en-US",
  interpolation: {
    escapeValue: false,
  },
});

export const Locales = ["en-US", "nl-NL"];

export const localeSettings = {
  "en-US": {
    label: "English",
    icon: "globe",
    flag: "🇬🇧" as DirectusIconName,
    code: "en-US",
  },
  "nl-NL": {
    label: "Nederlands",
    icon: "globe",
    flag: "🇳🇱" as DirectusIconName,
    code: "nl-NL",
  },
};

export default i18n;
