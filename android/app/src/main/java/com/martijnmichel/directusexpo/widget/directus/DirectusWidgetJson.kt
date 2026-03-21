package com.martijnmichel.directusexpo.widget.directus

import org.json.JSONArray
import org.json.JSONObject

internal object DirectusWidgetJson {
  fun string(value: Any?): String {
    return when (value) {
      null -> ""
      is String -> value
      else -> value.toString()
    }
  }

  fun optStringNonBlank(obj: JSONObject, key: String): String? =
    obj.optString(key, "").trim().takeIf { it.isNotEmpty() }
}
