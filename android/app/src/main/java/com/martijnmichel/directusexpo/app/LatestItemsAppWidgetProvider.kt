package com.martijnmichel.directusexpo.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONArray
import com.martijnmichel.directusexpo.app.R

class LatestItemsAppWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    val prefs: SharedPreferences = context.getSharedPreferences(
      "directus_widgets_latest_items",
      Context.MODE_PRIVATE
    )
    val json = prefs.getString("directus.widgets.latestItems.v1.configList", null)
    val subtitle = if (!json.isNullOrBlank()) {
      try {
        val arr = JSONArray(json)
        if (arr.length() > 0) {
          val first = arr.getJSONObject(0)
          first.optString("title", first.optString("collection", ""))
        } else "Open app to add a widget setup"
      } catch (_: Exception) {
        "Open app to add a widget setup"
      }
    } else "Open app to add a widget setup"

    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.widget_latest_items)
      views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_latest_items_title))
      views.setTextViewText(R.id.widget_subtitle, subtitle)
      appWidgetManager.updateAppWidget(id, views)
    }
  }
}
