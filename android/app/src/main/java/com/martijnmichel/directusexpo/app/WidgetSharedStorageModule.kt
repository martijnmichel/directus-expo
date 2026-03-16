package com.martijnmichel.directusexpo.app

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*

class WidgetSharedStorageModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val prefs: SharedPreferences by lazy {
    reactContext.getSharedPreferences("directus_widgets_latest_items", Context.MODE_PRIVATE)
  }

  override fun getName(): String = "WidgetSharedStorage"

  @ReactMethod
  fun setConfigList(json: String, promise: Promise) {
    try {
      prefs.edit()
        .putString("directus.widgets.latestItems.v1.configList", json)
        .apply()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SET_CONFIG_LIST_ERROR", e)
    }
  }

  @ReactMethod
  fun setPayload(id: String, json: String?, promise: Promise) {
    try {
      val key = "directus.widgets.latestItems.v1.payload.$id"
      val editor = prefs.edit()
      if (json == null) {
        editor.remove(key)
      } else {
        editor.putString(key, json)
      }
      editor.apply()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SET_PAYLOAD_ERROR", e)
    }
  }

  @ReactMethod
  fun getConfigListFromAppGroup(promise: Promise) {
    try {
      val raw = prefs.getString("directus.widgets.latestItems.v1.configList", null) ?: ""
      val length = raw.length
      var count = 0
      val ids = Arguments.createArray()
      if (raw.isNotEmpty()) {
        val jsonArr = org.json.JSONArray(raw)
        count = jsonArr.length()
        for (i in 0 until jsonArr.length()) {
          val obj = jsonArr.optJSONObject(i) ?: continue
          val id = obj.optString("id", "")
          if (id.isNotBlank()) ids.pushString(id)
        }
      }
      val result = Arguments.createMap().apply {
        putInt("length", length)
        putInt("count", count)
        putArray("ids", ids)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GET_CONFIG_LIST_ERROR", e)
    }
  }
}

