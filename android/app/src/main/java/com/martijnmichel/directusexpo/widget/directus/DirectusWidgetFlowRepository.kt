package com.martijnmichel.directusexpo.widget.directus

import android.content.SharedPreferences
import android.graphics.Bitmap
import org.json.JSONObject

/**
 * Fetches widget list data via flow webhook + optional JSON cache in [SharedPreferences].
 *
 * @param payloadCacheKeyPrefix full prefix before setup id (e.g. `directus.widgets.latestItems.v1.payload.`)
 */
class DirectusWidgetFlowRepository(
  private val prefs: SharedPreferences,
  private val payloadCacheKeyPrefix: String,
  private val loadFavicon: Boolean,
  private val bitmapInSampleSize: Int = 4,
) {
  private fun cacheKey(setupId: String) = payloadCacheKeyPrefix + setupId

  fun fetch(setup: DirectusWidgetFlowSetup, instanceBase: String?): DirectusWidgetFetchResult {
    val fetchFavicon: (String?, String?) -> Bitmap? = { base, fid ->
      DirectusWidgetBitmapLoader.fetchFaviconBitmap(base, fid, bitmapInSampleSize)
    }

    if (setup.webhookUrl.isNullOrBlank()) {
      val cached = prefs.getString(cacheKey(setup.id), null)
      if (!cached.isNullOrBlank()) {
        val decoded =
          DirectusWidgetFlowDecoder.decodeCachedPayload(
            cached,
            setup,
            instanceBase,
            loadFavicon,
            fetchFavicon,
          )
        if (decoded.items.isNotEmpty()) return decoded
      }
      return DirectusWidgetFetchResult(
        items = emptyList(),
        faviconBitmap = null,
        statusMessage = "Missing webhook URL. Open the app and re-save this setup.",
      )
    }

    val webhookResult =
      DirectusWidgetWebhookClient.fetchWebhookJson(setup.webhookUrl, setup.widgetId)
    val raw = webhookResult.raw
    val httpCode = webhookResult.httpCode

    if (raw.isNullOrBlank()) {
      val cached = prefs.getString(cacheKey(setup.id), null)
      if (!cached.isNullOrBlank()) {
        val decoded =
          DirectusWidgetFlowDecoder.decodeCachedPayload(
            cached,
            setup,
            instanceBase,
            loadFavicon,
            fetchFavicon,
          )
        if (decoded.items.isNotEmpty()) return decoded
      }

      val statusMessage =
        when {
          httpCode != null -> DirectusWidgetWebhookClient.mapWebhookHttpError(httpCode)
          else -> "Couldn’t refresh (network error)."
        }
      return DirectusWidgetFetchResult(emptyList(), null, statusMessage)
    }

    if (httpCode != null && (httpCode !in 200..299)) {
      val extracted = DirectusWidgetWebhookClient.extractErrorMessageFromRaw(raw)
      val statusMessage = extracted ?: DirectusWidgetWebhookClient.mapWebhookHttpError(httpCode)
      return DirectusWidgetFetchResult(emptyList(), null, statusMessage)
    }

    val resp =
      try {
        JSONObject(raw)
      } catch (_: Exception) {
        return DirectusWidgetFetchResult(emptyList(), null, "Webhook returned unexpected JSON.")
      }

    val (items, faviconFileId) = DirectusWidgetFlowDecoder.decodeSlotItemsFromFlowResponse(resp, setup)
    if (items.isEmpty()) {
      val cached = prefs.getString(cacheKey(setup.id), null)
      if (!cached.isNullOrBlank()) {
        val decoded =
          DirectusWidgetFlowDecoder.decodeCachedPayload(
            cached,
            setup,
            instanceBase,
            loadFavicon,
            fetchFavicon,
          )
        if (decoded.items.isNotEmpty()) return decoded
      }
      return DirectusWidgetFetchResult(items, null, "Open the app to refresh")
    }

    val faviconBitmap =
      if (loadFavicon) {
        DirectusWidgetBitmapLoader.fetchFaviconBitmap(instanceBase, faviconFileId, bitmapInSampleSize)
      } else {
        null
      }
    return DirectusWidgetFetchResult(items, faviconBitmap, null)
  }
}
