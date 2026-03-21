package com.martijnmichel.directusexpo.widget.directus

object DirectusWidgetConstants {
  /** Flow `data[]` block type for latest-items schema. */
  const val FLOW_BLOCK_TYPE_LATEST_ITEMS = "latest-items"

  /** Directus asset transform: prefer raster output for BitmapFactory decode. */
  const val ASSET_RASTER_QUERY = "width=64&height=64&fit=cover&format=png"
}
