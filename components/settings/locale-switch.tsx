import { useTranslation } from "react-i18next";
import { Select } from "../interfaces/select";
import { localeSettings } from "@/i18n";
import { Locales } from "@/i18n";

export const LocaleSelect = () => {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onChange={(value) => i18n.changeLanguage(value)}
      options={Locales.map((lng) => ({
        label: localeSettings[lng].label,
        value: lng,
        text: localeSettings[lng].flag,
      }))}
    />
  );
};
