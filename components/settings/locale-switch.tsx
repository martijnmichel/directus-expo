import { useTranslation } from "react-i18next";
import { Select } from "../interfaces/select";
import { localeSettings } from "@/i18n";
import { Locales } from "@/i18n";
import { map } from "lodash";
import { DateUtils } from "@/utils/dayjs";

export const LocaleSelect = () => {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onValueChange={(value) => {
        i18n.changeLanguage(value as string);
        DateUtils.setLocale(value as string);
      }}
      options={map(localeSettings, (lang, key) => ({
        value: key,
        text: `${lang.flag} ${lang.label}`,
      }))}
    />
  );
};
