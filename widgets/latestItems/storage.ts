import { LatestItemsWidgetConfig } from "./types";

import AsyncStorage from "@react-native-async-storage/async-storage";

const CONFIGS_KEY = "@widget/latest-items/configs";

export async function getLatestItemsWidgetConfigs(): Promise<
  LatestItemsWidgetConfig[]
> {
  const raw = await AsyncStorage.getItem(CONFIGS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as LatestItemsWidgetConfig[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function getLatestItemsWidgetConfig(
  id: string
): Promise<LatestItemsWidgetConfig | null> {
  const configs = await getLatestItemsWidgetConfigs();
  return configs.find((c) => c.id === id) ?? null;
}

export async function setLatestItemsWidgetConfigs(
  configs: LatestItemsWidgetConfig[]
): Promise<void> {
  await AsyncStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
}

export async function addLatestItemsWidgetConfig(
  config: Omit<LatestItemsWidgetConfig, "id">
): Promise<LatestItemsWidgetConfig> {
  const configs = await getLatestItemsWidgetConfigs();
  const newConfig: LatestItemsWidgetConfig = {
    ...config,
    id: uuidv4(),
  };
  await setLatestItemsWidgetConfigs([...configs, newConfig]);
  return newConfig;
}

export async function updateLatestItemsWidgetConfig(
  id: string,
  patch: Partial<Omit<LatestItemsWidgetConfig, "id">>
): Promise<LatestItemsWidgetConfig | null> {
  const configs = await getLatestItemsWidgetConfigs();
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ...configs[idx], ...patch, id };
  configs[idx] = updated;
  await setLatestItemsWidgetConfigs(configs);
  return updated;
}

export async function removeLatestItemsWidgetConfig(
  id: string
): Promise<boolean> {
  const configs = await getLatestItemsWidgetConfigs();
  const next = configs.filter((c) => c.id !== id);
  if (next.length === configs.length) return false;
  await setLatestItemsWidgetConfigs(next);
  return true;
}
