import Foundation

/// Storage keys for this widget only (app group must match JS / native app).
enum LatestItemsWidgetKeys {
  static let appGroup = "group.com.martijnmichel.directusexpo.widgets"
  static let configListKey = "directus.widgets.latestItems.v1.configList"
  static let configListFileName = "configList.json"
  static let payloadPrefix = "directus.widgets.latestItems.v1.payload."
}

struct LatestItemsConfigListReadResult {
  let list: [WidgetConfigEntry]
  let canOpenGroupDefaults: Bool
  let canOpenGroupContainer: Bool
}

func readLatestItemsConfigList() -> [WidgetConfigEntry] {
  return readLatestItemsConfigListResult().list
}

func readLatestItemsConfigListResult() -> LatestItemsConfigListReadResult {
  var raw: String?
  let defaults = UserDefaults(suiteName: LatestItemsWidgetKeys.appGroup)
  if let defaults {
    raw = defaults.string(forKey: LatestItemsWidgetKeys.configListKey)
  }
  let containerURL = FileManager.default.containerURL(
    forSecurityApplicationGroupIdentifier: LatestItemsWidgetKeys.appGroup
  )
  if raw == nil || raw?.isEmpty == true,
     let containerURL {
    let fileURL = containerURL.appendingPathComponent(LatestItemsWidgetKeys.configListFileName)
    raw = try? String(contentsOf: fileURL, encoding: .utf8)
  }
  var list: [WidgetConfigEntry] = []
  if let raw = raw, !raw.isEmpty, let data = raw.data(using: .utf8) {
    do {
      let decoded = try JSONDecoder().decode([WidgetConfigEntry].self, from: data)
      list = decoded.filter { !$0.id.isEmpty }
    } catch {
      // If decoding fails, treat as empty list.
    }
  }
  return LatestItemsConfigListReadResult(
    list: list,
    canOpenGroupDefaults: defaults != nil,
    canOpenGroupContainer: containerURL != nil
  )
}
