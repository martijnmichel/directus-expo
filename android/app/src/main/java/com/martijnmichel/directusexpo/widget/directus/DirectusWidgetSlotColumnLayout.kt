package com.martijnmichel.directusexpo.widget.directus

import android.os.Build
import android.util.TypedValue
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Left/right column width from flow `options` (`widthBehaviour`, `width`), aligned with
 * `constants/widget.ts` and iOS `WidgetSlotSideColumnLayout`.
 *
 * API 31+ ([RemoteViews.setViewLayoutWidth]): only **fixed** behaviour sets a dip width from
 * `width` (% of row). **fit** does not call RemoteViews at all — row XML `wrap_content` + the
 * stored numeric `width` must not affect layout (avoids measuring as if fixed).
 */
object DirectusWidgetSlotColumnLayout {

  fun behaviour(opt: JSONObject?): String {
    if (opt == null) return "fit"
    val raw = opt.optString("widthBehaviour", "").trim().lowercase()
    return when (raw) {
      "fixed" -> "fixed"
      "fit" -> "fit"
      else -> "fit"
    }
  }

  /** Percent of row width for **fixed** slots only — never read for `fit` (see [applyContainerWidth]). */
  fun widthPercent(opt: JSONObject?): Float {
    if (opt == null || !opt.has("width")) return 24f
    return when (val v = opt.opt("width")) {
      is Number -> v.toDouble().toFloat().coerceIn(0f, 100f)
      is String -> (v.toDoubleOrNull() ?: 24.0).toFloat().coerceIn(0f, 100f)
      else -> opt.optDouble("width", 24.0).toFloat().coerceIn(0f, 100f)
    }
  }

  fun applyContainerWidth(
    rowRv: RemoteViews,
    containerId: Int,
    slot: DirectusWidgetSlotValue?,
    rowWidthDp: Float,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    val s = slot ?: return
    val v = s.value.trim()
    if (v.isEmpty()) return

    val opt = s.options
    when (behaviour(opt)) {
      "fit" -> {
        // Do not call setViewLayoutWidth — rely on XML wrap_content. Never use `width` % here.
        return
      }
      else -> {
        val widthDp = rowWidthDp * widthPercent(opt) / 100f
        rowRv.setViewLayoutWidth(containerId, widthDp, TypedValue.COMPLEX_UNIT_DIP)
      }
    }
  }
}
