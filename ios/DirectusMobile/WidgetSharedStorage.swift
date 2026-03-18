import Foundation

private let appGroup = "group.com.martijnmichel.directusexpo.widgets"
private let configListKey = "directus.widgets.latestItems.v1.configList"
private let payloadPrefix = "directus.widgets.latestItems.v1.payload."

@objc(WidgetSharedStorage)
class WidgetSharedStorage: NSObject, RCTBridgeModule {

  static func moduleName() -> String! { "WidgetSharedStorage" }

  static func requiresMainQueueSetup() -> Bool { false }

  @objc
  func setConfigList(_ json: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      reject("APP_GROUP", "App Group not available", nil)
      return
    }
    defaults.set(json, forKey: configListKey)
    defaults.synchronize()
    resolve(nil)
  }

  @objc
  func setPayload(_ id: String, json: NSString?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      reject("APP_GROUP", "App Group not available", nil)
      return
    }
    let key = "\(payloadPrefix)\(id)"
    if let json = json as String? {
      defaults.set(json, forKey: key)
    } else {
      defaults.removeObject(forKey: key)
    }
    defaults.synchronize()
    resolve(nil)
  }

  @objc
  func getConfigListFromAppGroup(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      reject("APP_GROUP", "App Group not available", nil)
      return
    }

    let raw = defaults.string(forKey: configListKey) ?? ""
    let length = raw.count
    var count = 0
    var ids: [String] = []

    if let data = raw.data(using: .utf8), !raw.isEmpty {
      do {
        if let arr = try JSONSerialization.jsonObject(with: data, options: []) as? [[String: Any]] {
          count = arr.count
          ids = arr.compactMap { ($0["id"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        }
      } catch {
        // Ignore parsing errors; return length with empty ids/count.
      }
    }

    resolve([
      "length": length,
      "count": count,
      "ids": ids,
    ])
  }
}
