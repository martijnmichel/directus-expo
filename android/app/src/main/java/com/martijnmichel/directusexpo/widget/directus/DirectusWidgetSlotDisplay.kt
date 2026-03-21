package com.martijnmichel.directusexpo.widget.directus

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.math.abs

/**
 * Plain-text rules for flow slot `type` + `value` (shared with iOS `DirectusWidgetSlotDisplay.swift`).
 *
 * Row binding: Android `DirectusWidgetSlotRemoteViews.renderSlot(transformSlotTypes = …)` / iOS
 * title+subtitle use `text(for:)` only; side columns use `DirectusWidgetSideSlotView`.
 */
object DirectusWidgetSlotDisplay {
  fun displayText(type: String?, value: String?): String {
    val raw = value?.trim().orEmpty()
    if (raw.isEmpty()) return "-"

    val t = type?.trim()?.lowercase(Locale.US).orEmpty()
    return when (t) {
      "date" -> formatDateIfPossible(raw)
      "image", "thumbnail" -> "."
      else -> raw
    }
  }

  fun formatDateIfPossible(raw: String): String {
    val t = raw.trim()
    if (t.isEmpty() || t == "-") return "-"

    val digits = t.filter { it.isDigit() }
    if (digits.isNotEmpty() && (digits.length == 10 || digits.length == 13)) {
      return formatDateFromEpoch(digits)
    }

    val patterns =
      listOf(
        "yyyy-MM-dd",
        "yyyy-MM-dd HH:mm",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm:ss.SSS",
      )

    for (pattern in patterns) {
      try {
        val sdf = SimpleDateFormat(pattern, Locale.US)
        sdf.timeZone = TimeZone.getDefault()
        val date = sdf.parse(t) ?: continue
        return formatDateForWidget(date, t)
      } catch (_: Exception) {
        // continue
      }
    }

    return raw
  }

  private fun formatDateFromEpoch(digits: String): String {
    val epochMs = if (digits.length == 13) digits.toLong() else digits.toLong() * 1000L
    val date = Date(epochMs)
    return formatDateForWidget(date, digits)
  }

  private fun formatDateForWidget(date: Date, originalRaw: String): String {
    val now = Date()
    val diffDays = ((startOfDay(now).time - startOfDay(date).time) / 86400000L).toInt()
    val hasTimeComponent = originalRaw.contains(":")
    if (hasTimeComponent && diffDays == 0) {
      val df = SimpleDateFormat("HH:mm", Locale.getDefault())
      return df.format(date)
    }

    return when (diffDays) {
      0 -> "Today"
      1 -> "Yesterday"
      -1 -> "Tomorrow"
      else -> {
        val n = abs(diffDays)
        if (diffDays > 1) "$n days ago" else "in $n days"
      }
    }
  }

  private fun startOfDay(d: Date): Date {
    val cal = java.util.Calendar.getInstance()
    cal.time = d
    cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
    cal.set(java.util.Calendar.MINUTE, 0)
    cal.set(java.util.Calendar.SECOND, 0)
    cal.set(java.util.Calendar.MILLISECOND, 0)
    return cal.time
  }
}
