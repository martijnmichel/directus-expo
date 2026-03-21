package com.martijnmichel.directusexpo.widget.directus

import android.net.Uri
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

data class DirectusWidgetWebhookRawResult(
  val raw: String?,
  val httpCode: Int?,
)

object DirectusWidgetWebhookClient {
  fun mapWebhookHttpError(httpCode: Int): String {
    return when (httpCode) {
      401 -> "Webhook unauthorized (401)."
      403 -> "Webhook forbidden (403)."
      404 -> "Webhook not found (404)."
      else -> "Webhook error (HTTP $httpCode)."
    }
  }

  fun extractErrorMessageFromRaw(raw: String): String? {
    return try {
      val obj = JSONObject(raw)
      if (obj.has("errors")) {
        val errors = obj.optJSONArray("errors") ?: return null
        val messages =
          (0 until errors.length())
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

  fun fetchWebhookJson(webhookUrl: String, widgetId: String): DirectusWidgetWebhookRawResult {
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
      if (stream == null) return DirectusWidgetWebhookRawResult(raw = null, httpCode = code)

      val text = BufferedReader(InputStreamReader(stream)).use { it.readText() }
      val raw = text.takeIf { it.isNotBlank() }
      DirectusWidgetWebhookRawResult(raw = raw, httpCode = code)
    } catch (_: Exception) {
      DirectusWidgetWebhookRawResult(raw = null, httpCode = null)
    }
  }
}
