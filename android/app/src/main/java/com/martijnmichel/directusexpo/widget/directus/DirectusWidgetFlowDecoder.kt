package com.martijnmichel.directusexpo.widget.directus

import android.graphics.Bitmap
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

object DirectusWidgetFlowDecoder {
  /**
   * APP_WIDGET flow JSON: `{ data: [ { type, items: [ { id, values: [{slot,type,value}] } ] } ] }`
   */
  fun decodeSlotItemsFromFlowResponse(resp: JSONObject, setup: DirectusWidgetFlowSetup): Pair<List<DirectusWidgetSlotItem>, String?> {
    val dataArr = resp.optJSONArray("data") ?: return Pair(emptyList(), null)
    var latestObj: JSONObject? = null
    for (i in 0 until dataArr.length()) {
      val entry = dataArr.optJSONObject(i) ?: continue
      if (entry.optString("type", "") == DirectusWidgetConstants.FLOW_BLOCK_TYPE_LATEST_ITEMS) {
        latestObj = entry
        break
      }
    }
    val itemsArr = latestObj?.optJSONArray("items") ?: JSONArray()
    val items = mutableListOf<DirectusWidgetSlotItem>()

    for (i in 0 until itemsArr.length()) {
      val itemObj = itemsArr.optJSONObject(i) ?: continue
      val id = DirectusWidgetJson.string(itemObj.opt("id")).trim()
      if (id.isEmpty()) continue

      val valuesArr = itemObj.optJSONArray("values") ?: JSONArray()
      val slotMap = HashMap<String, DirectusWidgetSlotValue>()
      for (vi in 0 until valuesArr.length()) {
        val vObj = valuesArr.optJSONObject(vi) ?: continue
        val slotKey = DirectusWidgetJson.string(vObj.opt("slot")).trim()
        if (slotKey.isEmpty()) continue
        val type =
          DirectusWidgetJson.string(vObj.opt("type")).trim().lowercase(Locale.US).ifEmpty { "string" }
        val value = DirectusWidgetJson.string(vObj.opt("value"))
        slotMap[slotKey] = DirectusWidgetSlotValue(type, value)
      }

      val deepLink =
        if (setup.collection.isNotBlank()) "directus://content/${setup.collection}/$id" else null
      items.add(DirectusWidgetSlotItem(id = id, deepLink = deepLink, slots = slotMap))
    }

    items.reverse()

    val faviconFileId = resp.optString("favicon").takeIf { it.isNotBlank() }
    return Pair(items, faviconFileId)
  }

  fun decodeCachedPayload(
    raw: String,
    setup: DirectusWidgetFlowSetup,
    instanceBase: String?,
    loadFavicon: Boolean,
    fetchFavicon: (String?, String?) -> Bitmap?,
  ): DirectusWidgetFetchResult {
    return try {
      val obj = JSONObject(raw)
      if (obj.has("data")) {
        val (items, faviconFileId) = decodeSlotItemsFromFlowResponse(obj, setup)
        val faviconBitmap =
          if (loadFavicon) fetchFavicon(instanceBase, faviconFileId) else null
        DirectusWidgetFetchResult(items, faviconBitmap, null)
      } else {
        DirectusWidgetFetchResult(emptyList(), null, null)
      }
    } catch (_: Exception) {
      DirectusWidgetFetchResult(emptyList(), null, null)
    }
  }
}
