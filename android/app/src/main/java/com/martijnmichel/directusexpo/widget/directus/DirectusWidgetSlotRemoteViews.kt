package com.martijnmichel.directusexpo.widget.directus

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import com.martijnmichel.directusexpo.app.R
import java.util.Locale

/**
 * Binds a flow slot into [RemoteViews].
 *
 * - **Title / subtitle:** `transformSlotTypes = false` — only [DirectusWidgetSlotDisplay.displayText]
 *   (no thumbnail, no status pill).
 * - **Left / right:** `transformSlotTypes = true` — thumbnail, status capsule, or styled text in a
 *   container with optional image.
 *
 * Pairs with iOS `DirectusWidgetSideSlotView` for the transformed side columns; title/subtitle there
 * use `DirectusWidgetSlotDisplay.text` only.
 */
object DirectusWidgetSlotRemoteViews {

  /**
   * @param textViewId Target [TextView] (always updated for text modes; for thumbnails it is hidden).
   * @param transformSlotTypes If true, interpret `thumbnail` / `status` / etc.; requires [containerId]
   *   and [imageId]. If false, only [DirectusWidgetSlotDisplay.displayText] is written to [textViewId].
   * @param context Required when [transformSlotTypes] is true (status pill padding in px).
   */
  fun renderSlot(
    views: RemoteViews,
    textViewId: Int,
    slot: DirectusWidgetSlotValue?,
    transformSlotTypes: Boolean,
    context: Context? = null,
    containerId: Int? = null,
    imageId: Int? = null,
    thumbBitmapsByFileId: Map<String, Bitmap> = emptyMap(),
  ) {
    if (!transformSlotTypes) {
      val raw = slot?.value?.trim().orEmpty()
      if (slot == null || raw.isEmpty()) {
        views.setViewVisibility(textViewId, View.GONE)
        views.setTextViewText(textViewId, "")
        return
      }
      val text = DirectusWidgetSlotDisplay.displayText(slot.type, slot.value)
      if (text.isBlank()) {
        views.setViewVisibility(textViewId, View.GONE)
        views.setTextViewText(textViewId, "")
        return
      }
      views.setViewVisibility(textViewId, View.VISIBLE)
      views.setTextViewText(textViewId, text)
      return
    }

    val c = containerId ?: error("renderSlot: containerId required when transformSlotTypes=true")
    val img = imageId ?: error("renderSlot: imageId required when transformSlotTypes=true")

    val value = slot?.value?.trim().orEmpty()
    if (slot == null || value.isEmpty()) {
      views.setViewVisibility(c, View.GONE)
      return
    }

    val ctx = context ?: error("renderSlot: context required when transformSlotTypes=true")
    views.setViewVisibility(c, View.VISIBLE)

    val res = ctx.resources
    val statusPadH = res.getDimensionPixelSize(R.dimen.widget_status_pill_padding_horizontal)
    val statusPadV = res.getDimensionPixelSize(R.dimen.widget_status_pill_padding_vertical)

    when (slot.type.lowercase(Locale.US)) {
      "thumbnail" -> {
        views.setViewPadding(textViewId, 0, 0, 0, 0)
        views.setViewVisibility(img, View.VISIBLE)
        views.setViewVisibility(textViewId, View.GONE)
        views.setImageViewResource(img, R.drawable.widget_thumb_placeholder)
        thumbBitmapsByFileId[value]?.let { bmp -> views.setImageViewBitmap(img, bmp) }
      }
      "status" -> {
        views.setViewVisibility(img, View.GONE)
        views.setViewVisibility(textViewId, View.VISIBLE)
        views.setViewPadding(textViewId, statusPadH, statusPadV, statusPadH, statusPadV)
        views.setTextViewText(textViewId, value)
        views.setInt(textViewId, "setTextColor", statusForegroundColor(value))
        views.setInt(textViewId, "setBackgroundResource", statusPillDrawableRes(value))
      }
      else -> {
        views.setViewPadding(textViewId, 0, 0, 0, 0)
        views.setViewVisibility(img, View.GONE)
        val sideText = DirectusWidgetSlotDisplay.displayText(slot.type, slot.value)
        if (sideText.isBlank()) {
          views.setViewVisibility(textViewId, View.GONE)
          views.setTextViewText(textViewId, "")
        } else {
          views.setViewVisibility(textViewId, View.VISIBLE)
          views.setTextViewText(textViewId, sideText)
        }
        views.setInt(textViewId, "setBackgroundColor", Color.TRANSPARENT)
        views.setInt(textViewId, "setTextColor", Color.parseColor("#666666"))
      }
    }
  }

  /** Status label color (align with iOS `DirectusWidgetSlotDisplay.statusForeground`). */
  fun statusForegroundColor(value: String): Int {
    return when (value.trim().lowercase(Locale.US)) {
      "published" -> Color.parseColor("#2E7D32")
      "archived" -> Color.parseColor("#616161")
      "draft" -> Color.parseColor("#F57C00")
      else -> Color.parseColor("#111111")
    }
  }

  fun statusPillDrawableRes(value: String): Int {
    return when (value.trim().lowercase(Locale.US)) {
      "published" -> R.drawable.widget_status_pill_published
      "archived" -> R.drawable.widget_status_pill_archived
      "draft" -> R.drawable.widget_status_pill_draft
      else -> R.drawable.widget_status_pill_unknown
    }
  }
}
