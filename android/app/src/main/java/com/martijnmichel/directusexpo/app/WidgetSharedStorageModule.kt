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
}

