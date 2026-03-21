package com.martijnmichel.directusexpo.widget.directus

import android.graphics.Bitmap
import org.json.JSONObject

/**
 * Minimal setup needed to decode flow payloads and build deep links (any Directus home-screen widget).
 */
data class DirectusWidgetFlowSetup(
  val id: String,
  val collection: String,
  val widgetId: String,
  val webhookUrl: String?,
)

/**
 * One cell in a row: resolved field type + string value, optional per-slot UI options from the flow
 * (e.g. `widthBehaviour`, `width` for left/right — see `constants/widget.ts` / flow `normalizeSlots`).
 */
data class DirectusWidgetSlotValue(
  val type: String,
  val value: String,
  val options: JSONObject? = null,
)

data class DirectusWidgetSlotItem(
  val id: String,
  val deepLink: String?,
  val slots: Map<String, DirectusWidgetSlotValue>,
)

/**
 * Result of fetching/decoding widget list data for UI.
 */
data class DirectusWidgetFetchResult(
  val items: List<DirectusWidgetSlotItem>,
  val faviconBitmap: Bitmap?,
  val statusMessage: String?,
)
