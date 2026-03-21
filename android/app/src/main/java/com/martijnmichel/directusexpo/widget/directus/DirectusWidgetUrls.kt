package com.martijnmichel.directusexpo.widget.directus

import java.net.URL

object DirectusWidgetUrls {
  fun resolveInstanceBaseUrl(instanceUrl: String?, webhookUrl: String?): String? {
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
        val url = try {
          URL(w)
        } catch (_: Exception) {
          return null
        }
        val scheme = url.protocol ?: "https"
        val host = url.host ?: return null
        val port = url.port
        if (port > 0) "$scheme://$host:$port" else "$scheme://$host"
      }
  }

  fun assetUrl(instanceBase: String, fileId: String, query: String): String =
    "${instanceBase.trimEnd('/')}/assets/$fileId?$query"
}
