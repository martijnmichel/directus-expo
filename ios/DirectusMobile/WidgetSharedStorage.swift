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
}
