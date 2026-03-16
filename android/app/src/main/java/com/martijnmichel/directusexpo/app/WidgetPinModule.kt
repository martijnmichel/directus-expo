package com.martijnmichel.directusexpo.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetPinModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "WidgetPin"

  @ReactMethod
  fun requestPinLatestItemsWidget(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("UNSUPPORTED", "Widget pinning requires Android 8.0 or later")
      return
    }
    val context = reactApplicationContext.applicationContext
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val componentName = ComponentName(context, LatestItemsAppWidgetProvider::class.java)
    if (!appWidgetManager.isRequestPinAppWidgetSupported()) {
      promise.reject("NOT_SUPPORTED", "This launcher does not support pinning widgets from the app")
      return
    }
    try {
      appWidgetManager.requestPinAppWidget(componentName, null, null)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REQUEST_PIN_FAILED", e.message, e)
    }
  }
}
