import { useEffect, useMemo, useState } from "react";
import { Select } from "./interfaces/select";
import { useTranslation } from "react-i18next";
import type { API } from "./APIForm";
import { readSessionWrapper } from "@/state/auth/directusSessionStorage";

type SessionOption = {
  value: string;
  text: string;
};

function shortSessionSuffix(sessionId: string): string {
  const s = sessionId.trim();
  if (s.length <= 10) return s;
  return `…${s.slice(-6)}`;
}

function makeOptionLabel(
  sessionId: string,
  userLabel: string | undefined,
  t: (key: string) => string,
): string {
  if (userLabel?.trim()) return userLabel.trim();
  return `${t("form.savedSession")} (${shortSessionSuffix(sessionId)})`;
}

export function InstanceSessionSelect({
  api,
  sessionId,
  onSessionChange,
}: {
  api?: API;
  sessionId?: string;
  onSessionChange: (sessionId?: string) => void;
}) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<SessionOption[]>([]);

  const ids = useMemo(() => api?.sessionIds ?? [], [api?.sessionIds]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const next: SessionOption[] = [
        { value: "__new__", text: t("form.newAccount") },
      ];
      for (const sid of ids) {
        const wrapper = await readSessionWrapper(sid);
        next.push({
          value: sid,
          text: makeOptionLabel(sid, wrapper?.userLabel, t),
        });
      }
      if (alive) setOptions(next);
    };
    load();
    return () => {
      alive = false;
    };
  }, [ids, t]);

  if (!api?.id) return null;

  return (
    <Select
      label={t("form.userSession")}
      placeholder={t("form.userSession")}
      options={options}
      value={sessionId?.trim() ? sessionId : "__new__"}
      onValueChange={(v) => {
        const value = String(v);
        if (value === "__new__") {
          onSessionChange(undefined);
          return;
        }
        onSessionChange(value);
      }}
    />
  );
}
