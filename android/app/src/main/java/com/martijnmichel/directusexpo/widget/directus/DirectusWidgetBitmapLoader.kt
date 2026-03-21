package com.martijnmichel.directusexpo.widget.directus

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.BufferedInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

object DirectusWidgetBitmapLoader {
  fun fetchBitmap(urlString: String, inSampleSize: Int): Bitmap? {
    return try {
      val url = URL(urlString)
      val conn = url.openConnection() as HttpURLConnection
      conn.requestMethod = "GET"
      conn.connectTimeout = 4000
      conn.readTimeout = 4000
      conn.instanceFollowRedirects = true
      val opts =
        BitmapFactory.Options().apply {
          inPreferredConfig = Bitmap.Config.RGB_565
          inDither = false
          this.inSampleSize = inSampleSize
        }
      BufferedInputStream(conn.inputStream).use { stream ->
        BitmapFactory.decodeStream(stream, null, opts)
      }
    } catch (_: Exception) {
      null
    }
  }

  fun fetchFaviconBitmap(
    instanceBase: String?,
    faviconFileId: String?,
    inSampleSize: Int,
  ): Bitmap? {
    if (instanceBase.isNullOrBlank()) return null
    val base = instanceBase

    fun tryUrls(urls: List<String>): Bitmap? {
      for (u in urls) {
        val bmp = fetchBitmap(u, inSampleSize)
        if (bmp != null) return bmp
      }
      return null
    }

    return if (faviconFileId.isNullOrBlank()) {
      tryUrls(
        listOf(
          "$base/favicon.ico",
          "$base/favicon.png",
        ),
      )
    } else {
      val q = DirectusWidgetConstants.ASSET_RASTER_QUERY
      tryUrls(
        listOf(
          DirectusWidgetUrls.assetUrl(base, faviconFileId, q),
          "$base/assets/$faviconFileId?width=32&height=32&fit=cover&format=png",
          "$base/assets/$faviconFileId?format=png",
          "$base/favicon.ico",
        ),
      )
    }
  }

  fun preloadThumbnailBitmaps(
    items: List<DirectusWidgetSlotItem>,
    instanceBase: String?,
    maxToLoad: Int,
    inSampleSize: Int,
  ): Map<String, Bitmap> {
    if (instanceBase.isNullOrBlank()) return emptyMap()
    val fileIdsNeeded = LinkedHashSet<String>()
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
      val urlString =
        DirectusWidgetUrls.assetUrl(instanceBase, fileId, DirectusWidgetConstants.ASSET_RASTER_QUERY)
      val bmp = fetchBitmap(urlString, inSampleSize)
      if (bmp != null) bitmaps[fileId] = bmp
    }
    return bitmaps
  }
}
