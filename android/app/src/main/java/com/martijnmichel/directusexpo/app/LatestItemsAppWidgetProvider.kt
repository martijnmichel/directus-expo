package com.martijnmichel.directusexpo.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.martijnmichel.directusexpo.app.R
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.Executors
import kotlin.math.abs

class LatestItemsAppWidgetProvider : AppWidgetProvider() {
  companion object {
    private val executor = Executors.newSingleThreadExecutor()
  }

  // AppWidgetProvider runs inside the host app process. Downloading/decoding too
  // many bitmaps can OOM the app, especially on low-swap devices.
  // Keep this intentionally low for stability.
  // RemoteViews widgets run in-process, so we must strictly cap bitmap decoding.
  // 64x64 thumbs still allocate, so keep this small.
  private val maxThumbnailsToLoadPerUpdate = 2
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

  private data class SlotValue(val type: String, val value: String)
  private data class SlotItem(
    val id: String,
    val deepLink: String?,
    val slots: Map<String, SlotValue>,
  )

  private data class FetchResult(
    val items: List<SlotItem>,
    val faviconBitmap: Bitmap?,
    val statusMessage: String?,
    val titleOverride: String?,
  )

  private fun safeStr(s: Any?): String {
    return when (s) {
      null -> ""
      is String -> s
      else -> s.toString()
    }
  }

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
      val id = safeStr(obj.opt("id")).trim()
      if (id.isEmpty()) continue

      val collection = safeStr(obj.opt("collection")).trim()
      val title = safeStr(obj.opt("title")).takeIf { it.isNotBlank() }
        ?: collection.takeIf { it.isNotBlank() }
        ?: "Latest"

      val instanceUrl =
        obj.opt("instanceUrl")?.let { safeStr(it) }?.takeIf { it.isNotBlank() }
      val widgetId = safeStr(obj.opt("widgetId")).takeIf { it.isNotBlank() } ?: id
      val webhookUrl =
        obj.opt("webhookUrl")?.let { safeStr(it) }?.takeIf { it.isNotBlank() }

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

  private fun inferMaxRows(appWidgetManager: AppWidgetManager, widgetId: Int): Int {
    val options = appWidgetManager.getAppWidgetOptions(widgetId)
    val minHeight = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT) ?: 0
    val maxHeight = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT) ?: minHeight
    val height = maxOf(minHeight, maxHeight)
    // iOS: systemLarge shows 6 rows, otherwise show 2 rows.
    // On Android, minHeight is often much lower than iOS, so use a tiered threshold.
    return when {
      height >= 170 -> 6
      height >= 130 -> 4
      else -> 2
    }
  }

  private fun withAlpha(color: Int, alpha: Int): Int {
    return (alpha shl 24) or (color and 0x00FFFFFF)
  }

  private fun statusBackgroundColor(value: String): Int {
    val base = when (value.trim().lowercase(Locale.US)) {
      "published" -> Color.parseColor("#2E7D32")
      "archived" -> Color.parseColor("#616161")
      "draft" -> Color.parseColor("#F57C00")
      else -> Color.parseColor("#9E9E9E")
    }
    return withAlpha(base, 0x33)
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
      val views = RemoteViews(context.packageName, R.layout.widget_latest_items)
      views.setImageViewResource(R.id.widget_favicon, R.drawable.widget_thumb_placeholder)
      val instanceBase = selectedConfig?.let { resolveInstanceBaseUrl(it.instanceUrl, it.webhookUrl) }
      val setupText = "Open app to add a widget setup"

      if (!instanceBase.isNullOrBlank()) {
        views.setViewVisibility(R.id.widget_subtitle, View.GONE)
      } else {
        views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
        views.setTextViewText(R.id.widget_subtitle, setupText)
      }
      views.setTextViewText(
        R.id.widget_title,
        selectedConfig?.title ?: context.getString(R.string.widget_latest_items_title)
      )
      appWidgetManager.updateAppWidget(widgetId, views)
    }

    executor.execute {
      val cfgByWidgetId: Map<Int, SelectedConfig> = configByWidgetId.mapNotNull { (widgetId, cfg) ->
        if (cfg == null) null else widgetId to cfg
      }.toMap()

      if (cfgByWidgetId.isEmpty()) return@execute

      // Group by config so we fetch at most once per setup.
      val groupsByConfigId: Map<String, List<Map.Entry<Int, SelectedConfig>>> =
        cfgByWidgetId.entries.groupBy { it.value.id }

      for ((_, entries) in groupsByConfigId) {
        val cfg = entries.first().value
        val instanceBase = resolveInstanceBaseUrl(cfg.instanceUrl, cfg.webhookUrl)

        val maxRowsByWidget: Map<Int, Int> =
          entries.associate { (widgetId, _) -> widgetId to inferMaxRows(appWidgetManager, widgetId) }

        val result = fetchFlowForConfig(prefs, cfg, instanceBase)
        val items = result.items
        val faviconBitmap = result.faviconBitmap
        val statusMessage = result.statusMessage
        val titleOverride = result.titleOverride

        val maxThumbItems = (maxRowsByWidget.values.maxOrNull() ?: 2)
        val thumbBitmapsByFileId: Map<String, Bitmap> =
          preloadThumbBitmaps(
            items.take(maxThumbItems),
            instanceBase,
            maxThumbnailsToLoadPerUpdate,
          )

        val widgetIds = entries.map { it.key }
        for (widgetId in widgetIds) {
          val maxRows = maxRowsByWidget[widgetId] ?: 2
          val views = RemoteViews(context.packageName, R.layout.widget_latest_items)

          views.setImageViewResource(R.id.widget_favicon, R.drawable.widget_thumb_placeholder)
          faviconBitmap?.let { views.setImageViewBitmap(R.id.widget_favicon, it) }

          views.setTextViewText(R.id.widget_title, titleOverride ?: cfg.title)

          if (items.isEmpty()) {
            views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
            views.setTextViewText(R.id.widget_subtitle, statusMessage ?: "Open the app to refresh")
            renderEmptyRows(views)
          } else {
            // We don't need to show the instance URL here.
            // Hide the subtitle when we successfully resolved the instance; otherwise show setup text.
            if (!instanceBase.isNullOrBlank()) {
              views.setViewVisibility(R.id.widget_subtitle, View.GONE)
            } else {
              views.setViewVisibility(R.id.widget_subtitle, View.VISIBLE)
              views.setTextViewText(R.id.widget_subtitle, "Open app to add a widget setup")
            }
            renderRows(context, views, maxRows, items, cfg, instanceBase, thumbBitmapsByFileId)
          }

          appWidgetManager.updateAppWidget(widgetId, views)
        }
      }
    }
  }

  private fun renderEmptyRows(views: RemoteViews) {
    views.setViewVisibility(R.id.widget_row_0_container, View.GONE)
    views.setViewVisibility(R.id.widget_row_1_container, View.GONE)
    views.setViewVisibility(R.id.widget_row_2_container, View.GONE)
    views.setViewVisibility(R.id.widget_row_3_container, View.GONE)
    views.setViewVisibility(R.id.widget_row_4_container, View.GONE)
    views.setViewVisibility(R.id.widget_row_5_container, View.GONE)

    views.setViewVisibility(R.id.widget_row_0_divider, View.GONE)
    views.setViewVisibility(R.id.widget_row_1_divider, View.GONE)
    views.setViewVisibility(R.id.widget_row_2_divider, View.GONE)
    views.setViewVisibility(R.id.widget_row_3_divider, View.GONE)
    views.setViewVisibility(R.id.widget_row_4_divider, View.GONE)
  }

  private fun renderSideSlot(
    views: RemoteViews,
    sideContainerId: Int,
    sideImageId: Int,
    sideTextId: Int,
    slot: SlotValue?,
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
        views.setViewVisibility(sideImageId, View.GONE)
        views.setViewVisibility(sideTextId, View.VISIBLE)

        views.setTextViewText(sideTextId, value)
        views.setInt(sideTextId, "setBackgroundColor", statusBackgroundColor(value))
        views.setInt(sideTextId, "setTextColor", statusForegroundColor(value))
      }
      else -> {
        views.setViewVisibility(sideImageId, View.GONE)
        views.setViewVisibility(sideTextId, View.VISIBLE)

        views.setTextViewText(sideTextId, displayText(slot.type, slot.value))
        views.setInt(sideTextId, "setBackgroundColor", Color.TRANSPARENT)
        views.setInt(sideTextId, "setTextColor", Color.parseColor("#666666"))
      }
    }
  }

  private fun displayText(type: String?, value: String?): String {
    val raw = value?.trim().orEmpty()
    if (raw.isEmpty()) return "-"

    val t = type?.trim()?.lowercase(Locale.US).orEmpty()
    return when (t) {
      "date" -> formatDateIfPossible(raw)
      "image", "thumbnail" -> "."
      else -> raw
    }
  }

  private fun renderRows(
    context: Context,
    views: RemoteViews,
    widgetMaxRows: Int,
    items: List<SlotItem>,
    cfg: SelectedConfig,
    instanceBase: String?,
    thumbBitmapsByFileId: Map<String, Bitmap>,
  ) {
    val visibleCount = items.size.coerceAtMost(widgetMaxRows)

    val rowContainers = intArrayOf(
      R.id.widget_row_0_container,
      R.id.widget_row_1_container,
      R.id.widget_row_2_container,
      R.id.widget_row_3_container,
      R.id.widget_row_4_container,
      R.id.widget_row_5_container,
    )
    val rowDividers = intArrayOf(
      R.id.widget_row_0_divider,
      R.id.widget_row_1_divider,
      R.id.widget_row_2_divider,
      R.id.widget_row_3_divider,
      R.id.widget_row_4_divider,
    )
    val leftContainerIds = intArrayOf(
      R.id.widget_row_0_left_container,
      R.id.widget_row_1_left_container,
      R.id.widget_row_2_left_container,
      R.id.widget_row_3_left_container,
      R.id.widget_row_4_left_container,
      R.id.widget_row_5_left_container,
    )
    val rightContainerIds = intArrayOf(
      R.id.widget_row_0_right_container,
      R.id.widget_row_1_right_container,
      R.id.widget_row_2_right_container,
      R.id.widget_row_3_right_container,
      R.id.widget_row_4_right_container,
      R.id.widget_row_5_right_container,
    )
    val leftImageIds = intArrayOf(
      R.id.widget_row_0_left_image,
      R.id.widget_row_1_left_image,
      R.id.widget_row_2_left_image,
      R.id.widget_row_3_left_image,
      R.id.widget_row_4_left_image,
      R.id.widget_row_5_left_image,
    )
    val leftTextIds = intArrayOf(
      R.id.widget_row_0_left_text,
      R.id.widget_row_1_left_text,
      R.id.widget_row_2_left_text,
      R.id.widget_row_3_left_text,
      R.id.widget_row_4_left_text,
      R.id.widget_row_5_left_text,
    )
    val rightImageIds = intArrayOf(
      R.id.widget_row_0_right_image,
      R.id.widget_row_1_right_image,
      R.id.widget_row_2_right_image,
      R.id.widget_row_3_right_image,
      R.id.widget_row_4_right_image,
      R.id.widget_row_5_right_image,
    )
    val rightTextIds = intArrayOf(
      R.id.widget_row_0_right_text,
      R.id.widget_row_1_right_text,
      R.id.widget_row_2_right_text,
      R.id.widget_row_3_right_text,
      R.id.widget_row_4_right_text,
      R.id.widget_row_5_right_text,
    )
    val titleTextIds = intArrayOf(
      R.id.widget_row_0_title,
      R.id.widget_row_1_title,
      R.id.widget_row_2_title,
      R.id.widget_row_3_title,
      R.id.widget_row_4_title,
      R.id.widget_row_5_title,
    )
    val subtitleTextIds = intArrayOf(
      R.id.widget_row_0_subtitle,
      R.id.widget_row_1_subtitle,
      R.id.widget_row_2_subtitle,
      R.id.widget_row_3_subtitle,
      R.id.widget_row_4_subtitle,
      R.id.widget_row_5_subtitle,
    )

    for (i in 0 until rowContainers.size) {
      views.setViewVisibility(rowContainers[i], if (i < visibleCount) View.VISIBLE else View.GONE)
      if (i < rowDividers.size) {
        views.setViewVisibility(rowDividers[i], if (i < visibleCount - 1) View.VISIBLE else View.GONE)
      }
    }

    for (i in 0 until visibleCount) {
      val item = items[i]
      val leftSlot = item.slots["left"]
      val titleSlot = item.slots["title"]
      val subtitleSlot = item.slots["subtitle"]
      val rightSlot = item.slots["right"]

      views.setTextViewText(titleTextIds[i], displayText(titleSlot?.type, titleSlot?.value))
      // Row subtitle: show the flow-provided `subtitle` slot.
      views.setTextViewText(subtitleTextIds[i], displayText(subtitleSlot?.type, subtitleSlot?.value))

      renderSideSlot(views, leftContainerIds[i], leftImageIds[i], leftTextIds[i], leftSlot, thumbBitmapsByFileId)
      renderSideSlot(views, rightContainerIds[i], rightImageIds[i], rightTextIds[i], rightSlot, thumbBitmapsByFileId)

      val deepLink = item.deepLink
        ?: if (cfg.collection.isNotBlank() && item.id.isNotBlank()) "directus://content/${cfg.collection}/${item.id}" else null
      if (!deepLink.isNullOrBlank()) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
        val pendingIntent = PendingIntent.getActivity(
          context,
          (deepLink.hashCode() and 0x7fffffff),
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(rowContainers[i], pendingIntent)
      }
    }
  }

  private fun resolveInstanceBaseUrl(instanceUrl: String?, webhookUrl: String?): String? {
    fun normalize(s: String?): String? {
      if (s == null) return null
      var v = s.trim()
      if (v.isEmpty()) return null
      if (!v.startsWith("http://") && !v.startsWith("https://")) v = "https://$v"
      return v.replace(Regex("/+$"), "")
    }

    return normalize(instanceUrl)
      ?: run {
        val w = webhookUrl?.trim().orEmpty()
        if (w.isEmpty()) return null
        val url = try { URL(w) } catch (_: Exception) { return null }
        val scheme = url.protocol ?: "https"
        val host = url.host ?: return null
        val port = url.port
        if (port > 0) "$scheme://$host:$port" else "$scheme://$host"
      }
  }

  private fun fetchBitmap(urlString: String): Bitmap? {
    return try {
      val url = URL(urlString)
      val conn = url.openConnection() as HttpURLConnection
      conn.requestMethod = "GET"
      conn.connectTimeout = 4000
      conn.readTimeout = 4000
      conn.instanceFollowRedirects = true
      val opts = BitmapFactory.Options().apply {
        inPreferredConfig = Bitmap.Config.RGB_565
        inDither = false
        inSampleSize = bitmapInSampleSize
      }
      BufferedInputStream(conn.inputStream).use { stream ->
        BitmapFactory.decodeStream(stream, null, opts)
      }
    } catch (_: Exception) {
      null
    }
  }

  private fun preloadThumbBitmaps(
    items: List<SlotItem>,
    instanceBase: String?,
    maxToLoad: Int,
  ): Map<String, Bitmap> {
    if (instanceBase.isNullOrBlank()) return emptyMap()
    val fileIdsNeeded = HashSet<String>()
    for (item in items) {
      for (entry in item.slots.entries) {
        if (entry.value.type.lowercase(Locale.US) == "thumbnail") {
          val id = entry.value.value.trim()
          if (id.isNotEmpty()) fileIdsNeeded.add(id)
        }
      }
    }

    val bitmaps = HashMap<String, Bitmap>()
    val limited = fileIdsNeeded.toList().take(maxToLoad)
    for (fileId in limited) {
      val urlString = "${instanceBase}/assets/${fileId}?width=64&height=64&fit=cover"
      val bmp = fetchBitmap(urlString)
      if (bmp != null) bitmaps[fileId] = bmp
    }
    return bitmaps
  }

  private fun fetchFaviconBitmap(instanceBase: String?, faviconFileId: String?): Bitmap? {
    if (instanceBase.isNullOrBlank()) return null
    val base = instanceBase

    // Try the Directus-managed favicon first (should usually be an image),
    // but fall back to /favicon.ico since BitmapFactory can't decode everything.
    return if (faviconFileId.isNullOrBlank()) {
      fetchBitmap("$base/favicon.ico")
    } else {
      val urlString = "$base/assets/$faviconFileId?width=64&height=64&fit=cover"
      fetchBitmap(urlString) ?: fetchBitmap("$base/favicon.ico")
    }
  }

  private fun decodeSlotItemsFromFlowResponse(resp: JSONObject, cfg: SelectedConfig): Pair<List<SlotItem>, String?> {
    val dataArr = resp.optJSONArray("data") ?: return Pair(emptyList(), null)
    var latestObj: JSONObject? = null
    for (i in 0 until dataArr.length()) {
      val entry = dataArr.optJSONObject(i) ?: continue
      if (entry.optString("type", "") == "latest-items") {
        latestObj = entry
        break
      }
    }
    val itemsArr = latestObj?.optJSONArray("items") ?: JSONArray()
    val items = mutableListOf<SlotItem>()

    for (i in 0 until itemsArr.length()) {
      val itemObj = itemsArr.optJSONObject(i) ?: continue
      val id = safeStr(itemObj.opt("id")).trim()
      if (id.isEmpty()) continue

      val valuesArr = itemObj.optJSONArray("values") ?: JSONArray()
      val slotMap = HashMap<String, SlotValue>()
      for (vi in 0 until valuesArr.length()) {
        val vObj = valuesArr.optJSONObject(vi) ?: continue
        val slotKey = safeStr(vObj.opt("slot")).trim()
        if (slotKey.isEmpty()) continue
        val type = safeStr(vObj.opt("type")).trim().lowercase(Locale.US).ifEmpty { "string" }
        val value = safeStr(vObj.opt("value"))
        slotMap[slotKey] = SlotValue(type, value)
      }

      val deepLink = if (cfg.collection.isNotBlank()) "directus://content/${cfg.collection}/$id" else null
      items.add(SlotItem(id = id, deepLink = deepLink, slots = slotMap))
    }

    // Widget appears to show items in opposite order on Android vs your expectation.
    // Match iOS/flow ordering by reversing here.
    items.reverse()

    val faviconFileId = resp.optString("favicon").takeIf { it.isNotBlank() }
    return Pair(items, faviconFileId)
  }

  private fun decodeCachedPayload(raw: String, cfg: SelectedConfig, instanceBase: String?): FetchResult {
    return try {
      val obj = JSONObject(raw)
      if (obj.has("data")) {
        val (items, faviconFileId) = decodeSlotItemsFromFlowResponse(obj, cfg)
        val faviconBitmap =
          if (shouldLoadFaviconBitmap) fetchFaviconBitmap(instanceBase, faviconFileId) else null
        FetchResult(items, faviconBitmap, null, null)
      } else if (obj.has("rows") && obj.has("columns")) {
        val legacyTitle = obj.optString("title").takeIf { it.isNotBlank() }
        val columns = obj.optJSONArray("columns") ?: JSONArray()
        val rows = obj.optJSONArray("rows") ?: JSONArray()
        val slotKeys = arrayOf("left", "title", "subtitle", "right")

        val items = mutableListOf<SlotItem>()
        for (ri in 0 until rows.length()) {
          val row = rows.optJSONObject(ri) ?: continue
          val id = safeStr(row.opt("id")).trim()
          if (id.isEmpty()) continue

          val cells = row.optJSONObject("cells")
          val deepLink = row.optString("deepLink", "").takeIf { it.isNotBlank() }
          val slotMap = HashMap<String, SlotValue>()

          for (si in 0 until slotKeys.size) {
            if (si >= columns.length()) break
            val colObj = columns.optJSONObject(si) ?: continue
            val colKey = safeStr(colObj.opt("key")).trim()
            if (colKey.isEmpty()) continue
            val cellVal = cells?.opt(colKey)?.toString() ?: ""
            slotMap[slotKeys[si]] = SlotValue("string", cellVal)
          }

          items.add(
            SlotItem(
              id = id,
              deepLink = deepLink ?: "directus://content/${cfg.collection}/${id}",
              slots = slotMap
            )
          )
        }

        FetchResult(items, null, null, legacyTitle)
      } else {
        FetchResult(emptyList(), null, null, null)
      }
    } catch (_: Exception) {
      FetchResult(emptyList(), null, null, null)
    }
  }

  private data class WebhookFetchResult(
    val raw: String?,
    val httpCode: Int?,
  )

  private fun mapWebhookHttpError(httpCode: Int): String {
    return when (httpCode) {
      401 -> "Webhook unauthorized (401)."
      403 -> "Webhook forbidden (403)."
      404 -> "Webhook not found (404)."
      else -> "Webhook error (HTTP $httpCode)."
    }
  }

  private fun extractErrorMessageFromRaw(raw: String): String? {
    return try {
      val obj = JSONObject(raw)
      // Directus often returns: { "errors": [ { "message": "..."} ] }
      if (obj.has("errors")) {
        val errors = obj.optJSONArray("errors") ?: return null
        val messages = (0 until errors.length())
          .mapNotNull { i ->
            val e = errors.optJSONObject(i) ?: return@mapNotNull null
            e.optString("message").takeIf { it.isNotBlank() }
          }
        messages.takeIf { it.isNotEmpty() }?.joinToString("; ")
      } else {
        obj.optString("message").takeIf { it.isNotBlank() }
      }
    } catch (_: Exception) {
      null
    }
  }

  private fun tryFetchWebhookJson(webhookUrl: String, widgetId: String): WebhookFetchResult {
    return try {
      val base = Uri.parse(webhookUrl)
      val url = base.buildUpon().appendQueryParameter("widget_id", widgetId).build().toString()

      val conn = URL(url).openConnection() as HttpURLConnection
      conn.requestMethod = "GET"
      conn.connectTimeout = 8000
      conn.readTimeout = 8000
      conn.instanceFollowRedirects = true

      val code = conn.responseCode
      val stream = if (code in 200..299) conn.inputStream else conn.errorStream
      if (stream == null) return WebhookFetchResult(raw = null, httpCode = code)

      val br = BufferedReader(InputStreamReader(stream))
      val text = br.use { it.readText() }
      val raw = text.takeIf { it.isNotBlank() }
      WebhookFetchResult(raw = raw, httpCode = code)
    } catch (_: Exception) {
      WebhookFetchResult(raw = null, httpCode = null)
    }
  }

  private fun fetchFlowForConfig(
    prefs: SharedPreferences,
    cfg: SelectedConfig,
    instanceBase: String?,
  ): FetchResult {
    // First try fetch via webhook (matches iOS).
    val webhookUrl = cfg.webhookUrl
    if (webhookUrl.isNullOrBlank()) {
      val cached = prefs.getString(payloadPrefix + cfg.id, null)
      if (!cached.isNullOrBlank()) {
        val decoded = decodeCachedPayload(cached, cfg, instanceBase)
        if (decoded.items.isNotEmpty()) return decoded
      }
      return FetchResult(
        items = emptyList(),
        faviconBitmap = null,
        statusMessage = "Missing webhook URL. Open the app and re-save this setup.",
        titleOverride = null,
      )
    }

    val webhookResult = tryFetchWebhookJson(webhookUrl, cfg.widgetId)
    val raw = webhookResult.raw
    val httpCode = webhookResult.httpCode

    if (raw.isNullOrBlank()) {
      val cached = prefs.getString(payloadPrefix + cfg.id, null)
      if (!cached.isNullOrBlank()) {
        val decoded = decodeCachedPayload(cached, cfg, instanceBase)
        if (decoded.items.isNotEmpty()) return decoded
      }

      val statusMessage = when {
        httpCode != null -> mapWebhookHttpError(httpCode)
        else -> "Couldn’t refresh (network error)."
      }
      return FetchResult(emptyList(), null, statusMessage, null)
    }

    // If the webhook returned a non-2xx status, prefer showing HTTP error even if the body isn't JSON.
    if (httpCode != null && (httpCode !in 200..299)) {
      val extracted = extractErrorMessageFromRaw(raw)
      val statusMessage = extracted ?: mapWebhookHttpError(httpCode)
      return FetchResult(emptyList(), null, statusMessage, null)
    }

    val resp = try {
      JSONObject(raw)
    } catch (_: Exception) {
      return FetchResult(emptyList(), null, "Webhook returned unexpected JSON.", null)
    }

    val (items, faviconFileId) = decodeSlotItemsFromFlowResponse(resp, cfg)
    if (items.isEmpty()) {
      val cached = prefs.getString(payloadPrefix + cfg.id, null)
      if (!cached.isNullOrBlank()) {
        val decoded = decodeCachedPayload(cached, cfg, instanceBase)
        if (decoded.items.isNotEmpty()) return decoded
      }
      return FetchResult(items, null, "Open the app to refresh", null)
    }

    val faviconBitmap =
      if (shouldLoadFaviconBitmap) fetchFaviconBitmap(instanceBase, faviconFileId) else null
    return FetchResult(items, faviconBitmap, null, null)
  }

  private fun formatDateIfPossible(raw: String): String {
    val t = raw.trim()
    if (t.isEmpty() || t == "-") return "-"

    val digits = t.filter { it.isDigit() }
    if (digits.isNotEmpty() && (digits.length == 10 || digits.length == 13)) {
      return formatDateFromEpoch(digits)
    }

    val patterns = listOf(
      "yyyy-MM-dd",
      "yyyy-MM-dd HH:mm",
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm",
      "yyyy-MM-dd'T'HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm:ss.SSS"
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
