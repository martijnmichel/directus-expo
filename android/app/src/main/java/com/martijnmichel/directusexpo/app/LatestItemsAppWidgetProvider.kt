package com.martijnmichel.directusexpo.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.SizeF
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.martijnmichel.directusexpo.app.R
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetBitmapLoader
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetFlowRepository
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetFlowSetup
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetJson
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetSlotDisplay
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetSlotItem
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetSlotValue
import com.martijnmichel.directusexpo.widget.directus.DirectusWidgetUrls
import org.json.JSONArray
import java.util.Locale
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import kotlin.math.ceil

class LatestItemsAppWidgetProvider : AppWidgetProvider() {
  companion object {
    private val executor = Executors.newSingleThreadExecutor()

    /** Max row count − 1 (0..[WIDGET_ROW_LAST_INDEX] inclusive ⇒ 9 rows). */
    private const val WIDGET_ROW_LAST_INDEX = 8

    /** Title + padding + optional subtitle (dp) — subtract from host height for list area. */
    private const val WIDGET_LIST_HEADER_RESERVE_DP = 88f

    /** Approximate list row height incl. divider margins (dp); tune if rows clip or look sparse. */
    private const val WIDGET_LIST_ROW_BUDGET_DP = 50f

    private val resizeRefreshHandler = Handler(Looper.getMainLooper())
    private val pendingResizeRunnables = ConcurrentHashMap<Int, Runnable>()
  }

  // AppWidgetProvider runs inside the host app process. Downloading/decoding too
  // many bitmaps can OOM the app, especially on low-swap devices.
  // Keep this intentionally low for stability.
  // RemoteViews widgets run in-process, so we must strictly cap bitmap decoding.
  // 64x64 thumbs still allocate, so keep this small.
  /** Match max list rows we can show (see [maxRowsForWidgetOptions] + size-keyed [RemoteViews]). */
  private val maxThumbnailsToLoadPerUpdate = 12
  private val bitmapInSampleSize = 4
  private val shouldLoadFaviconBitmap = true

  private val prefsName = "directus_widgets_latest_items"
  private val configListKey = "directus.widgets.latestItems.v1.configList"
  private val payloadPrefix = "directus.widgets.latestItems.v1.payload."

  private data class SelectedConfig(
    val id: String,
    val title: String,
    val collection: String,
    val instanceUrl: String?,
    val widgetId: String,
    val webhookUrl: String?,
  )

  private fun SelectedConfig.toFlowSetup(): DirectusWidgetFlowSetup =
    DirectusWidgetFlowSetup(
      id = id,
      collection = collection,
      widgetId = widgetId,
      webhookUrl = webhookUrl,
    )

  private fun widgetConfigKey(widgetId: Int): String =
    "directus.widgets.latestItems.v1.widgetConfig.$widgetId"

  private fun parseAllConfigs(prefs: SharedPreferences): List<SelectedConfig> {
    val json = prefs.getString(configListKey, null) ?: return emptyList()
    if (json.isBlank()) return emptyList()

    val arr = try {
      JSONArray(json)
    } catch (_: Exception) {
      return emptyList()
    }
    if (arr.length() <= 0) return emptyList()

    val out = ArrayList<SelectedConfig>(arr.length())
    for (i in 0 until arr.length()) {
      val obj = arr.optJSONObject(i) ?: continue
      val id = DirectusWidgetJson.string(obj.opt("id")).trim()
      if (id.isEmpty()) continue

      val collection = DirectusWidgetJson.string(obj.opt("collection")).trim()
      val title = DirectusWidgetJson.string(obj.opt("title")).takeIf { it.isNotBlank() }
        ?: collection.takeIf { it.isNotBlank() }
        ?: "Latest"

      val instanceUrl =
        obj.opt("instanceUrl")?.let { DirectusWidgetJson.string(it) }?.takeIf { it.isNotBlank() }
      val widgetId =
        DirectusWidgetJson.string(obj.opt("widgetId")).takeIf { it.isNotBlank() } ?: id
      val webhookUrl =
        obj.opt("webhookUrl")?.let { DirectusWidgetJson.string(it) }?.takeIf { it.isNotBlank() }

      out.add(
        SelectedConfig(
          id = id,
          title = title,
          collection = collection,
          instanceUrl = instanceUrl,
          widgetId = widgetId,
          webhookUrl = webhookUrl,
        ),
      )
    }
    return out
  }

  /**
   * Widget height in **dp** from host-reported options ([AppWidgetManager]).
   *
   * **API 31+:** Prefer [AppWidgetManager.OPTION_APPWIDGET_SIZES] — each [SizeF] is in **dips**; use
   * the largest height among reported sizes (typical when the host lists portrait/landscape variants).
   *
   * **Fallback:** [AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT] /
   * [AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT] are documented as **dips**; use `max(min, max)`.
   */
  @Suppress("DEPRECATION")
  private fun widgetHeightDpFromOptions(options: Bundle): Float {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val sizes: ArrayList<SizeF>? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES, SizeF::class.java)
        } else {
          options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES)
        }
      if (!sizes.isNullOrEmpty()) {
        return sizes.maxOf { it.height }
      }
    }

    val minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)
    val maxH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, minH)
    val dp = maxOf(minH, maxH)
    return if (dp > 0) dp.toFloat() else 0f
  }

  /**
   * List rows from host **height in dp** (same signal as [widgetHeightDpFromOptions]).
   *
   * This mirrors the idea in
   * [Provide responsive layouts](https://developer.android.com/develop/ui/views/appwidgets/layouts#provide-responsive-layouts):
   * pick density based on **reported size** rather than rounding to an integer “cell span” (which
   * collapsed spans 2 and 3 to the same row count and stuck many sizes at 3 rows).
   *
   * Cell geometry from
   * [Determine a size](https://developer.android.com/develop/ui/views/appwidgets/layouts#anatomy_determining_size)
   * is still useful for XML `minResize*`; here we only use **dp** from `OPTION_*` / [SizeF].
   */
  private fun listRowsForWidgetHeightDp(heightDp: Float): Int {
    val maxR = WIDGET_ROW_LAST_INDEX + 1
    if (heightDp <= 0f) {
      return 4.coerceAtMost(maxR)
    }
    val listDp = (heightDp - WIDGET_LIST_HEADER_RESERVE_DP).coerceAtLeast(0f)
    val rows = ceil(listDp.toDouble() / WIDGET_LIST_ROW_BUDGET_DP.toDouble()).toInt()
    return rows.coerceIn(2, maxR)
  }

  /**
   * [AppWidgetManager.OPTION_APPWIDGET_SIZES] when the launcher provides it (API 31+).
   * If null/empty, use [singleRemoteViewsUpdate] path instead of size-keyed [RemoteViews].
   *
   * @see [Provide exact layouts](https://developer.android.com/develop/ui/views/appwidgets/layouts#provide-exact-layouts)
   */
  @Suppress("DEPRECATION")
  private fun optionAppWidgetSizesList(options: Bundle): List<SizeF>? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null
    val sizes: ArrayList<SizeF>? =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES, SizeF::class.java)
      } else {
        options.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES)
      }
    if (sizes.isNullOrEmpty()) return null
    return sizes.toList()
  }

  /** Max list rows needed for this widget (max across size profiles when multiple). */
  private fun maxRowsForWidgetOptions(options: Bundle): Int {
    val profiles = optionAppWidgetSizesList(options)
    return if (!profiles.isNullOrEmpty()) {
      profiles.maxOf { listRowsForWidgetHeightDp(it.height) }
    } else {
      listRowsForWidgetHeightDp(widgetHeightDpFromOptions(options))
    }
  }

  /**
   * API 31+: one [RemoteViews] per launcher [SizeF] so row count matches each reported size.
   * Otherwise a single [RemoteViews] using [widgetHeightDpFromOptions].
   *
   * @see [Provide responsive layouts](https://developer.android.com/develop/ui/views/appwidgets/layouts#provide-responsive-layouts)
   */
  private fun updateLatestItemsAppWidget(
    context: Context,
    appWidgetManager: AppWidgetManager,
    widgetId: Int,
    populate: (RemoteViews, maxRows: Int) -> Unit,
  ) {
    val options = appWidgetManager.getAppWidgetOptions(widgetId) ?: Bundle()
    val profiles = optionAppWidgetSizesList(options)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !profiles.isNullOrEmpty()) {
      val viewBySize = linkedMapOf<SizeF, RemoteViews>()
      for (size in profiles) {
        val maxRows = listRowsForWidgetHeightDp(size.height)
        val views = RemoteViews(context.packageName, R.layout.widget_latest_items)
        populate(views, maxRows)
        viewBySize[size] = views
      }
      appWidgetManager.updateAppWidget(widgetId, RemoteViews(viewBySize))
    } else {
      val maxRows = listRowsForWidgetHeightDp(widgetHeightDpFromOptions(options))
      val views = RemoteViews(context.packageName, R.layout.widget_latest_items)
      populate(views, maxRows)
      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }

  private fun statusForegroundColor(value: String): Int {
    return when (value.trim().lowercase(Locale.US)) {
      "published" -> Color.parseColor("#2E7D32")
      "archived" -> Color.parseColor("#616161")
      "draft" -> Color.parseColor("#F57C00")
      else -> Color.parseColor("#111111")
    }
  }

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    val prefs: SharedPreferences = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val allConfigs = parseAllConfigs(prefs)
    val defaultConfig = allConfigs.firstOrNull()

    val configByWidgetId: Map<Int, SelectedConfig?> = appWidgetIds.associateWith { widgetId ->
      val selectedId = prefs.getString(widgetConfigKey(widgetId), null)
      if (!selectedId.isNullOrBlank()) {
        allConfigs.firstOrNull { it.id == selectedId } ?: defaultConfig
      } else {
        defaultConfig
      }
    }

    // Optimistically render a header immediately; then refresh content in background.
    for (widgetId in appWidgetIds) {
      val selectedConfig = configByWidgetId[widgetId]
      val instanceBase =
        selectedConfig?.let {
          DirectusWidgetUrls.resolveInstanceBaseUrl(it.instanceUrl, it.webhookUrl)
        }
      val setupText = "Open app to add a widget setup"
      val titleText =
        selectedConfig?.title ?: context.getString(R.string.widget_latest_items_title)

      updateLatestItemsAppWidget(context, appWidgetManager, widgetId) { views, _ ->
        views.setViewVisibility(R.id.widget_favicon, View.GONE)
        if (!instanceBase.isNullOrBlank()) {
          views.setViewVisibility(R.id.widget_subtitle, View.GONE)
        } else {
          views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
          views.setTextViewText(R.id.widget_subtitle, setupText)
        }
        views.setTextViewText(R.id.widget_title, titleText)
      }
    }

    executor.execute {
      val cfgByWidgetId: Map<Int, SelectedConfig> = configByWidgetId.mapNotNull { (widgetId, cfg) ->
        if (cfg == null) null else widgetId to cfg
      }.toMap()

      if (cfgByWidgetId.isEmpty()) return@execute

      val flowRepo =
        DirectusWidgetFlowRepository(
          prefs,
          payloadPrefix,
          shouldLoadFaviconBitmap,
          bitmapInSampleSize,
        )

      // Group by config so we fetch at most once per setup.
      val groupsByConfigId: Map<String, List<Map.Entry<Int, SelectedConfig>>> =
        cfgByWidgetId.entries.groupBy { it.value.id }

      for ((_, entries) in groupsByConfigId) {
        val cfg = entries.first().value
        val instanceBase =
          DirectusWidgetUrls.resolveInstanceBaseUrl(cfg.instanceUrl, cfg.webhookUrl)

        val maxRowsByWidget: Map<Int, Int> =
          entries.associate { (widgetId, _) ->
            widgetId to maxRowsForWidgetOptions(appWidgetManager.getAppWidgetOptions(widgetId) ?: Bundle())
          }

        val result = flowRepo.fetch(cfg.toFlowSetup(), instanceBase)
        val items = result.items
        val faviconBitmap = result.faviconBitmap
        val statusMessage = result.statusMessage

        val maxThumbItems = (maxRowsByWidget.values.maxOrNull() ?: 3)
        val thumbBitmapsByFileId: Map<String, Bitmap> =
          DirectusWidgetBitmapLoader.preloadThumbnailBitmaps(
            items.take(maxThumbItems),
            instanceBase,
            maxThumbnailsToLoadPerUpdate,
            bitmapInSampleSize,
          )

        val widgetIds = entries.map { it.key }
        for (widgetId in widgetIds) {
          updateLatestItemsAppWidget(context, appWidgetManager, widgetId) { views, maxRows ->
            if (faviconBitmap != null) {
              views.setViewVisibility(R.id.widget_favicon, View.VISIBLE)
              views.setImageViewBitmap(R.id.widget_favicon, faviconBitmap)
            } else {
              views.setViewVisibility(R.id.widget_favicon, View.GONE)
            }

            views.setTextViewText(R.id.widget_title, cfg.title)

            if (items.isEmpty()) {
              views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
              views.setTextViewText(R.id.widget_subtitle, statusMessage ?: "Open the app to refresh")
              renderEmptyRows(views)
            } else {
              if (!instanceBase.isNullOrBlank()) {
                views.setViewVisibility(R.id.widget_subtitle, View.GONE)
              } else {
                views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
                views.setTextViewText(R.id.widget_subtitle, "Open app to add a widget setup")
              }
              renderRows(
                context,
                views,
                maxRows,
                items,
                cfg,
                instanceBase,
                thumbBitmapsByFileId,
                widgetId,
              )
            }
          }
        }
      }
    }
  }

  private fun renderEmptyRows(views: RemoteViews) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      views.removeAllViews(R.id.widget_rows_container)
    }
  }

  private fun renderSideSlot(
    views: RemoteViews,
    sideContainerId: Int,
    sideImageId: Int,
    sideTextId: Int,
    slot: DirectusWidgetSlotValue?,
    thumbBitmapsByFileId: Map<String, Bitmap>,
  ) {
    val value = slot?.value?.trim().orEmpty()
    if (slot == null || value.isEmpty()) {
      views.setViewVisibility(sideContainerId, View.GONE)
      return
    }

    views.setViewVisibility(sideContainerId, View.VISIBLE)

    when (slot.type.lowercase(Locale.US)) {
      "thumbnail" -> {
        views.setViewVisibility(sideImageId, View.VISIBLE)
        views.setViewVisibility(sideTextId, View.GONE)

        // Set placeholder first so we clear stale bitmaps from previous renders.
        views.setImageViewResource(sideImageId, R.drawable.widget_thumb_placeholder)

        thumbBitmapsByFileId[value]?.let { bmp ->
          views.setImageViewBitmap(sideImageId, bmp)
        }
      }
      "status" -> {
        // Match iOS: capsule with status label text (not a dot).
        views.setViewVisibility(sideImageId, View.GONE)
        views.setViewVisibility(sideTextId, View.VISIBLE)

        views.setTextViewText(sideTextId, value)
        views.setInt(sideTextId, "setTextColor", statusForegroundColor(value))
        views.setInt(sideTextId, "setBackgroundResource", statusPillDrawable(value))
      }
      else -> {
        views.setViewVisibility(sideImageId, View.GONE)
        views.setViewVisibility(sideTextId, View.VISIBLE)

        views.setTextViewText(
          sideTextId,
          DirectusWidgetSlotDisplay.displayText(slot.type, slot.value),
        )
        views.setInt(sideTextId, "setBackgroundColor", Color.TRANSPARENT)
        views.setInt(sideTextId, "setTextColor", Color.parseColor("#666666"))
      }
    }
  }

  private fun statusPillDrawable(value: String): Int {
    return when (value.trim().lowercase(Locale.US)) {
      "published" -> R.drawable.widget_status_pill_published
      "archived" -> R.drawable.widget_status_pill_archived
      "draft" -> R.drawable.widget_status_pill_draft
      else -> R.drawable.widget_status_pill_unknown
    }
  }

  private fun renderRows(
    context: Context,
    views: RemoteViews,
    widgetMaxRows: Int,
    items: List<DirectusWidgetSlotItem>,
    cfg: SelectedConfig,
    instanceBase: String?,
    thumbBitmapsByFileId: Map<String, Bitmap>,
    appWidgetId: Int,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return

    val visibleCount = items.size.coerceAtMost(widgetMaxRows)
    views.removeAllViews(R.id.widget_rows_container)

    val pkg = context.packageName
    for (i in 0 until visibleCount) {
      val item = items[i]
      val rowRv = RemoteViews(pkg, R.layout.widget_latest_items_row)

      val leftSlot = item.slots["left"]
      val titleSlot = item.slots["title"]
      val subtitleSlot = item.slots["subtitle"]
      val rightSlot = item.slots["right"]

      rowRv.setTextViewText(
        R.id.widget_row_title,
        DirectusWidgetSlotDisplay.displayText(titleSlot?.type, titleSlot?.value),
      )
      rowRv.setTextViewText(
        R.id.widget_row_subtitle,
        DirectusWidgetSlotDisplay.displayText(subtitleSlot?.type, subtitleSlot?.value),
      )

      renderSideSlot(
        rowRv,
        R.id.widget_row_left_container,
        R.id.widget_row_left_image,
        R.id.widget_row_left_text,
        leftSlot,
        thumbBitmapsByFileId,
      )
      renderSideSlot(
        rowRv,
        R.id.widget_row_right_container,
        R.id.widget_row_right_image,
        R.id.widget_row_right_text,
        rightSlot,
        thumbBitmapsByFileId,
      )

      rowRv.setViewVisibility(
        R.id.widget_row_divider,
        if (i < visibleCount - 1) View.VISIBLE else View.GONE,
      )

      val deepLink =
        item.deepLink
          ?: if (cfg.collection.isNotBlank() && item.id.isNotBlank()) {
            "directus://content/${cfg.collection}/${item.id}"
          } else {
            null
          }
      if (!deepLink.isNullOrBlank()) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
        val requestCode = (appWidgetId * 1_000 + i) xor deepLink.hashCode()
        val pendingIntent =
          PendingIntent.getActivity(
            context,
            requestCode and 0x7fffffff,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
        rowRv.setOnClickPendingIntent(R.id.widget_row_item_root, pendingIntent)
      }

      views.addView(R.id.widget_rows_container, rowRv)
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle?
  ) {
    super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
    // Launchers may still be applying bounds; debounce so OPTION_* min/max reflect the new size.
    val appCtx = context.applicationContext
    pendingResizeRunnables.remove(appWidgetId)?.let { resizeRefreshHandler.removeCallbacks(it) }
    val r = Runnable {
      try {
        onUpdate(appCtx, appWidgetManager, intArrayOf(appWidgetId))
      } finally {
        pendingResizeRunnables.remove(appWidgetId)
      }
    }
    pendingResizeRunnables[appWidgetId] = r
    resizeRefreshHandler.postDelayed(r, 250L)
  }
}
