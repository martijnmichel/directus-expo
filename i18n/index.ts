import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import your translation files
import en from "./locales/en.json";
import nl from "./locales/nl.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    nl: {
      translation: nl,
    },
  },
  lng: "en", // default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
