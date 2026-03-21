/** Collection that stores per-user widget configs used by native widgets. */
export const APP_WIDGET_CONFIG_COLLECTION = "app_widget_config";

/** Single flow that resolves widget requests (webhook with widget_id in body). */
export const APP_WIDGET_FLOW_NAME = "App widgets data";

/**
 * Contract version for the widget webhook response.
 * Keep this in sync with the Directus Flow script.
 *
 * v104: `widthBehaviour` is only `fit` | `fixed` (no `stretch` — it broke Android title layout).
 * Default for left/right is `fit` so side columns hug content and the title uses remaining width.
 * Legacy `stretch` / `widthBehaviour: "stretch"` / `stretch: true` → `fixed`. Title/subtitle: no options.
 */
export const APP_WIDGET_FLOW_VERSION = 104;

/** Widget type identifier used across app + Directus flow. */
export const APP_WIDGET_TYPE_LATEST_ITEMS = "latest-items" as const;

export const APP_WIDGET_TYPES = [
  { value: APP_WIDGET_TYPE_LATEST_ITEMS, label: "Latest items" },
] as const;

export function getWidgetTypeLabel(value: string | null | undefined): string {
  const hit = APP_WIDGET_TYPES.find((t) => t.value === value);
  return hit?.label ?? String(value ?? "");
}

/** Capabilities the app expects the flow to support. */
export const APP_WIDGET_SUPPORTED = [APP_WIDGET_TYPE_LATEST_ITEMS] as const;

export type AppWidgetSlotOptionType = "boolean" | "number" | "select";

export type AppWidgetSlotSelectChoice = {
  value: string;
  labelKey: string;
};

export type AppWidgetSlotOptionDef = {
  key: string;
  type: AppWidgetSlotOptionType;
  label: string;
  hint?: string;
  default?: boolean | number | string;
  min?: number;
  max?: number;
  step?: number;
  /** When `type === "select"`, choices (labels via i18n `labelKey`). */
  selectOptions?: readonly AppWidgetSlotSelectChoice[];
  /** Show this control only when every `resolvedOptions[depKey] === value`. */
  dependsOn?: Record<string, boolean | number | string>;
};

/** Allowed `widthBehaviour` values — only used for **left** and **right** slots (not title/subtitle). */
export const APP_WIDGET_SLOT_WIDTH_BEHAVIOUR_VALUES = ["fit", "fixed"] as const;

export type AppWidgetSlotWidthBehaviour =
  (typeof APP_WIDGET_SLOT_WIDTH_BEHAVIOUR_VALUES)[number];

export const APP_WIDGET_SLOT_OPTIONS = {
  widthBehaviour: {
    key: "widthBehaviour",
    type: "select",
    label: "widget.slot.options.widthBehaviour.label",
    hint: "widget.slot.options.widthBehaviour.hint",
    default: "fit",
    selectOptions: [
      { value: "fit", labelKey: "widget.slot.options.widthBehaviour.opt.fit" },
      {
        value: "fixed",
        labelKey: "widget.slot.options.widthBehaviour.opt.fixed",
      },
    ],
  },
  width: {
    key: "width",
    type: "number",
    label: "widget.slot.options.width.label",
    hint: "widget.slot.options.width.hint",
    min: 0,
    max: 100,
    step: 1,
    default: 24,
    dependsOn: { widthBehaviour: "fixed" },
  },
} as const satisfies Record<string, AppWidgetSlotOptionDef>;

/** One row in the latest-items widget editor `extra.slots` JSON. */
export type LatestItemsWidgetFormSlot = {
  key: string;
  label: string;
  field: string;
  options?: Record<string, boolean | number | string>;
};

export type LatestItemsSlotDef = (typeof APP_WIDGET_LATEST_ITEMS_SLOTS)[number];

function slotDefHasOptions(
  def: LatestItemsSlotDef,
): def is LatestItemsSlotDef & {
  options: readonly AppWidgetSlotOptionDef[];
} {
  return "options" in def && Array.isArray(def.options) && def.options.length > 0;
}

/** Default `options` map for a slot (from option defs), if any. */
export function defaultOptionsForLatestItemsSlot(
  def: LatestItemsSlotDef,
): Record<string, boolean | number | string> | undefined {
  if (!slotDefHasOptions(def)) return undefined;
  const out: Record<string, boolean | number | string> = {};
  for (const opt of def.options) {
    if (opt.default !== undefined) out[opt.key] = opt.default;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Initial `extra.slots` for the editor and new configs. */
export function buildDefaultLatestItemsFormSlots(): LatestItemsWidgetFormSlot[] {
  return APP_WIDGET_LATEST_ITEMS_SLOTS.map((def) => {
    const base: LatestItemsWidgetFormSlot = {
      key: def.key,
      label: "",
      field: "",
    };
    const opts = defaultOptionsForLatestItemsSlot(def);
    if (opts) base.options = { ...opts };
    return base;
  });
}

function coerceOptionValue(
  opt: AppWidgetSlotOptionDef,
  raw: unknown,
): boolean | number | string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (opt.type === "boolean") {
    if (typeof raw === "boolean") return raw;
    if (raw === "true" || raw === 1) return true;
    if (raw === "false" || raw === 0) return false;
    return undefined;
  }
  if (opt.type === "select") {
    if (typeof raw !== "string") return undefined;
    const allowed = new Set(
      (opt.selectOptions ?? []).map((c) => c.value),
    );
    return allowed.has(raw) ? raw : undefined;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Merge saved Directus `extra.slots` with schema defaults (options + missing keys). */
export function normalizeLatestItemsSlotsFromSaved(
  saved: LatestItemsWidgetFormSlot[] | undefined,
): LatestItemsWidgetFormSlot[] {
  const defaults = buildDefaultLatestItemsFormSlots();
  if (!saved?.length) return defaults;
  return defaults.map((d) => {
    const found = saved.find((s) => s.key === d.key);
    if (!found) return d;
    const def = APP_WIDGET_LATEST_ITEMS_SLOTS.find((x) => x.key === d.key);
    let mergedOpts: Record<string, boolean | number | string> | undefined;
    if (d.options && def && slotDefHasOptions(def)) {
      mergedOpts = { ...d.options };
      if (found.options) {
        const fo = found.options as Record<string, unknown>;
        const wbRaw = fo.widthBehaviour;
        if (fo.stretch === true || wbRaw === "stretch") {
          mergedOpts.widthBehaviour = "fixed";
        } else if (
          typeof wbRaw === "string" &&
          (APP_WIDGET_SLOT_WIDTH_BEHAVIOUR_VALUES as readonly string[]).includes(
            wbRaw,
          )
        ) {
          mergedOpts.widthBehaviour = wbRaw;
        }
        delete (mergedOpts as Record<string, unknown>).stretch;

        for (const opt of def.options) {
          if (!(opt.key in found.options)) continue;
          const coerced = coerceOptionValue(opt, found.options[opt.key]);
          if (coerced !== undefined) mergedOpts[opt.key] = coerced;
        }
      }
    }
    return {
      key: d.key,
      label: found.label ?? "",
      field: found.field ?? "",
      ...(mergedOpts ? { options: mergedOpts } : {}),
    };
  });
}

export function slotOptionShouldShow(
  opt: AppWidgetSlotOptionDef,
  resolved: Record<string, unknown>,
): boolean {
  if (!opt.dependsOn) return true;
  for (const [depKey, required] of Object.entries(opt.dependsOn)) {
    if (resolved[depKey] !== required) return false;
  }
  return true;
}

function isValidWidthBehaviour(v: unknown): v is AppWidgetSlotWidthBehaviour {
  return (
    typeof v === "string" &&
    (APP_WIDGET_SLOT_WIDTH_BEHAVIOUR_VALUES as readonly string[]).includes(v)
  );
}

/** Resolved option values for one slot row (defaults + stored). */
export function resolvedOptionsForSlotRow(
  slotRow: LatestItemsWidgetFormSlot,
  def: LatestItemsSlotDef,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!slotDefHasOptions(def)) return out;
  const stored = slotRow.options ?? {};
  for (const opt of def.options) {
    const v = stored[opt.key];
    out[opt.key] =
      v !== undefined && v !== null ? v : (opt.default ?? null);
  }
  let wb = out.widthBehaviour;
  if (wb === "stretch") wb = "fixed";
  if (!isValidWidthBehaviour(wb)) {
    out.widthBehaviour = "fixed";
  } else {
    out.widthBehaviour = wb;
  }
  return out;
}

/** Latest-items slot definitions (single source of truth for UI + flow defaults). */
export const APP_WIDGET_LATEST_ITEMS_SLOTS = [
  {
    key: "left",
    labelKey: "widget.latestItems.slots.left.label",
    hintKey: "widget.latestItems.slots.left.hint",
    options: [
      APP_WIDGET_SLOT_OPTIONS.widthBehaviour,
      APP_WIDGET_SLOT_OPTIONS.width,
    ],
  },
  {
    key: "title",
    labelKey: "widget.latestItems.slots.title.label",
    hintKey: "widget.latestItems.slots.title.hint",
    // No `options`: title always expands to fill space between left and right (native + flow).
  },
  {
    key: "subtitle",
    labelKey: "widget.latestItems.slots.subtitle.label",
    hintKey: "widget.latestItems.slots.subtitle.hint",
    // No `options`: subtitle is full-width below the title row.
  },
  {
    key: "right",
    labelKey: "widget.latestItems.slots.right.label",
    hintKey: "widget.latestItems.slots.right.hint",
    options: [
      APP_WIDGET_SLOT_OPTIONS.widthBehaviour,
      APP_WIDGET_SLOT_OPTIONS.width,
    ],
  },
] as const;

/** Flow operation type ids (same as push). */
export const WIDGET_FLOW_OPERATION_TYPES = {
  readData: "item-read",
  runScript: "exec",
  condition: "condition",
} as const;
