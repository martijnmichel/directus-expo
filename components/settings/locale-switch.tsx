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
import { Horizontal, Vertical } from "../layout/Stack";
import { DirectusIcon } from "../display/directus-icon";

export const LocaleSelect = () => {
  const { i18n } = useTranslation();
  const { data } = useLocalStorage<AppSettings>(LocalStorageKeys.APP_SETTINGS);
  const { data: languages } = useLanguages();
  const { mutate } = mutateLocalStorage(LocalStorageKeys.APP_SETTINGS);
  const { theme } = useStyles();
  const { t } = useTranslation();

  return (
    <Select
      value={i18n.language}
      helper={t("components.localeSwitch.helperText")}
      onValueChange={(value) => {
        i18n.changeLanguage(value as string);
        DateUtils.setLocale(value as string);
        mutate({
          ...data,
          locale: value as string,
        });
      }}
      options={map(languages, (lang, key) => ({
        value: lang.code,
        text: `${lang.name}`,
        append: !!localeSettings[lang.code as keyof typeof localeSettings] ? (
          <Horizontal>
            <DirectusIcon name="check" size={16} />
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontSize: theme.typography.helper.fontSize,
              }}
            >
              {t("components.localeSwitch.supported")}
            </Text>
          </Horizontal>
        ) : null,
      }))}
    />
  );
};
