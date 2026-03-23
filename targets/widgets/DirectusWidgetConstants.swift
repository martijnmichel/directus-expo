import Foundation

/// Shared Directus flow / asset constants for widget extensions (mirrors Android `DirectusWidgetConstants`).
enum DirectusWidgetConstants {
  static let flowBlockTypeLatestItems = "latest-items"

  /// Directus asset transform: raster output so `UIImage` can decode (SVG often ignores params).
  static let directusAssetRasterQuery = "width=64&height=64&fit=cover&format=png"
}
