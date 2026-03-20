package com.martijnmichel.directusexpo.app

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.TextView
import org.json.JSONArray

/**
 * Android widget "configure" screen.
 *
 * Android only shows one widget type in the picker, but the user can add multiple instances.
 * This Activity lets each instance (appWidgetId) pick a different Directus widget setup.
 */
class LatestItemsWidgetConfigureActivity : Activity() {
  private val prefsName = "directus_widgets_latest_items"
  private val configListKey = "directus.widgets.latestItems.v1.configList"
  private val widgetSettingsDeepLink = "exp+directus-expo://settings/widget/new"

  private fun widgetConfigKey(widgetId: Int): String =
    "directus.widgets.latestItems.v1.widgetConfig.$widgetId"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val extras = intent.extras ?: run {
      setResult(RESULT_CANCELED)
      finish()
      return
    }
    val appWidgetId = extras.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
    if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
      setResult(RESULT_CANCELED)
      finish()
      return
    }

    val prefs: SharedPreferences = getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    val configs = parseConfigs(prefs)

    if (configs.isEmpty()) {
      val root = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER_HORIZONTAL
        setPadding(24, 24, 24, 24)
      }
      val title = TextView(this).apply {
        text = "Select a widget setup"
        textSize = 18f
        setTypeface(typeface, android.graphics.Typeface.BOLD)
        gravity = Gravity.CENTER_HORIZONTAL
      }
      val subtitle = TextView(this).apply {
        text = "Create widget setups in the app first (Settings → Widgets → Latest Items)."
        textSize = 13f
        setPadding(0, 12, 0, 0)
      }
      val button = Button(this).apply {
        text = "Open widget settings"
        setOnClickListener {
          val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(widgetSettingsDeepLink))
          startActivity(intent)
        }
      }
      root.addView(title)
      root.addView(subtitle)
      root.addView(button)
      setContentView(root)
      setResult(RESULT_CANCELED)
      return
    }

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(16, 16, 16, 16)
    }

    val title = TextView(this).apply {
      text = "Select a widget setup"
      textSize = 18f
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    val subtitle = TextView(this).apply {
      text = "You can create more setups in the app under Settings → Widgets."
      textSize = 13f
      setPadding(0, 8, 0, 12)
    }

    val button = Button(this).apply {
      text = "Open widget settings"
      setOnClickListener {
        val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(widgetSettingsDeepLink))
        startActivity(intent)
      }
    }

    val listView = ListView(this).apply {
      // Match Android's typical list look.
      dividerHeight = 1
    }

    val adapter = object : ArrayAdapter<Config>(this, android.R.layout.simple_list_item_2, configs) {
      override fun getView(position: Int, convertView: android.view.View?, parent: android.view.ViewGroup): android.view.View {
        // Don't call super.getView(): ArrayAdapter assumes the row layout is a TextView,
        // but `android.R.layout.simple_list_item_2` is a TwoLineListItem (not a TextView).
        val row = convertView ?: LayoutInflater.from(context).inflate(
          android.R.layout.simple_list_item_2,
          parent,
          false
        )
        val cfg = getItem(position)
        val t1 = row.findViewById<TextView>(android.R.id.text1)
        val t2 = row.findViewById<TextView>(android.R.id.text2)

        t1.text = cfg?.title ?: cfg?.collection ?: "Latest"
        t2.text = cfg?.instanceBase ?: ""
        return row
      }
    }
    listView.adapter = adapter

    root.addView(title)
    root.addView(subtitle)
    root.addView(button)
    root.addView(listView, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      0,
      1f
    ))
    setContentView(root)

    listView.setOnItemClickListener { _, _, position, _ ->
      val selected = configs.getOrNull(position)
      if (selected != null) {
        prefs.edit()
          .putString(widgetConfigKey(appWidgetId), selected.id)
          .apply()
      }

      // Let the widget be added/configured for this instance.
      val resultValue = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
      setResult(RESULT_OK, resultValue)

      // Trigger an immediate widget update so the new config is visible.
      val updateIntent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
      }
      sendBroadcast(updateIntent)

      finish()
    }
  }

  private data class Config(
    val id: String,
    val title: String?,
    val collection: String?,
    val instanceBase: String?,
  )

  private fun safeStr(s: Any?): String =
    when (s) {
      null -> ""
      is String -> s
      else -> s.toString()
    }

  private fun parseConfigs(prefs: SharedPreferences): List<Config> {
    val json = prefs.getString(configListKey, null) ?: return emptyList()
    if (json.isBlank()) return emptyList()

    val arr = try {
      JSONArray(json)
    } catch (_: Exception) {
      return emptyList()
    }

    val out = ArrayList<Config>(arr.length())
    for (i in 0 until arr.length()) {
      val obj = arr.optJSONObject(i) ?: continue
      val id = safeStr(obj.opt("id")).trim()
      if (id.isEmpty()) continue
      val title = safeStr(obj.opt("title")).trim().takeIf { it.isNotBlank() }
      val collection = safeStr(obj.opt("collection")).trim().takeIf { it.isNotBlank() }
      val instanceUrl = safeStr(obj.opt("instanceUrl")).trim().takeIf { it.isNotBlank() }
      out.add(
        Config(
          id = id,
          // Fallback: if user didn't provide a custom title, show the collection name.
          title = title ?: collection,
          collection = collection,
          instanceBase = normalizeBaseUrl(instanceUrl),
        ),
      )
    }
    return out
  }

  private fun normalizeBaseUrl(url: String?): String? {
    if (url == null) return null
    var v = url.trim()
    if (v.isEmpty()) return null
    if (!v.startsWith("http://") && !v.startsWith("https://")) v = "https://$v"
    return v.replace(Regex("/+$"), "")
  }
}

