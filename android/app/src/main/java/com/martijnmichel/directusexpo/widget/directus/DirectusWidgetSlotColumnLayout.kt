package com.martijnmichel.directusexpo.widget.directus

import android.os.Build
import android.util.TypedValue
import android.view.ViewGroup
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Left/right column width from flow `options` (`widthBehaviour`, `width`), aligned with
 * `constants/widget.ts` and iOS `WidgetSlotSideColumnLayout`.
 *
 * API 31+ ([RemoteViews.setViewLayoutWidth]): apply exact widths / wrap_content.
 * Below 31, row XML weights are used (see [widget_latest_items_row.xml]).
 */
object DirectusWidgetSlotColumnLayout {

  fun behaviour(opt: JSONObject?): String {
    val raw = opt?.optString("widthBehaviour", "")?.trim()?.lowercase().orEmpty()
    if (raw == "fit" || raw == "fixed" || raw == "stretch") return raw
    if (opt?.optBoolean("stretch", false) == true) return "stretch"
    return "fixed"
  }

  fun widthPercent(opt: JSONObject?): Float {
    if (opt == null || !opt.has("width")) return 24f
    return when (val v = opt.opt("width")) {
      is Number -> v.toDouble().toFloat().coerceIn(0f, 100f)
      is String -> (v.toDoubleOrNull() ?: 24.0).toFloat().coerceIn(0f, 100f)
      else -> opt.optDouble("width", 24.0).toFloat().coerceIn(0f, 100f)
    }
  }

  /** Rough width of the other column (dp) for stretch calculations. */
  fun roughPeerWidthDp(slot: DirectusWidgetSlotValue?, rowWidthDp: Float): Float {
    val s = slot ?: return 0f
    val v = s.value.trim()
    if (v.isEmpty()) return 0f
    val opt = s.options
    return when (behaviour(opt)) {
      "fixed" -> rowWidthDp * widthPercent(opt) / 100f
      "fit" -> 96f
      "stretch" -> rowWidthDp * 0.28f
      else -> rowWidthDp * 0.24f
    }
  }

  private fun stretchWidthDp(rowWidthDp: Float, peerDp: Float): Float {
    val titleReserve = rowWidthDp * 0.5f
    return (rowWidthDp - titleReserve - peerDp).coerceIn(44f, rowWidthDp * 0.48f)
  }

  fun applyContainerWidth(
    rowRv: RemoteViews,
    containerId: Int,
    slot: DirectusWidgetSlotValue?,
    rowWidthDp: Float,
    peerWidthDp: Float,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
    val s = slot ?: return
    val v = s.value.trim()
    if (v.isEmpty()) return

    val opt = s.options
    val beh = behaviour(opt)
    val (widthValue, units) =
      when (beh) {
        "fit" ->
          Pair(ViewGroup.LayoutParams.WRAP_CONTENT.toFloat(), TypedValue.COMPLEX_UNIT_PX)
        "stretch" ->
          Pair(stretchWidthDp(rowWidthDp, peerWidthDp), TypedValue.COMPLEX_UNIT_DIP)
        else ->
          Pair(rowWidthDp * widthPercent(opt) / 100f, TypedValue.COMPLEX_UNIT_DIP)
      }
    rowRv.setViewLayoutWidth(containerId, widthValue, units)
  }
}
