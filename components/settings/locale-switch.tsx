import { useTranslation } from "react-i18next";
import { Select } from "../interfaces/select";
import { localeSettings } from "@/i18n";
import { Locales } from "@/i18n";
import { map } from "lodash";
import { DateUtils } from "@/utils/dayjs";
import {
  mutateLocalStorage,
  useLocalStorage,
} from "@/state/local/useLocalStorage";
import { AppSettings } from "@/hooks/useAppSettings";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { useLanguages } from "@/state/queries/directus/server";
import { Text } from "../display/typography";
import { useStyles } from "react-native-unistyles";

export const LocaleSelect = () => {
  const { i18n } = useTranslation();
  const { data } = useLocalStorage<AppSettings>(LocalStorageKeys.APP_SETTINGS);
  const { data: languages } = useLanguages();
  const { mutate } = mutateLocalStorage(LocalStorageKeys.APP_SETTINGS);

  return (
    <Select
      value={i18n.language}
      onValueChange={(value) => {
        i18n.changeLanguage(value as string);
        DateUtils.setLocale(value as string);
        mutate({
          ...data,
          locale: value as string,
        });
      }}
      options={map(Locales, (lang) => ({
        value: lang,
        text: `${localeSettings[lang as keyof typeof localeSettings]?.label}`,
      }))}
    />
  );
};
