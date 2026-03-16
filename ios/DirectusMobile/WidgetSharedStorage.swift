import Foundation

@objc(WidgetSharedStorage)
class WidgetSharedStorage: NSObject {

  private let appGroup = "group.com.martijnmichel.directusexpo.widgets"
  private let configListKey = "directus.widgets.latestItems.v1.configList"
  private let payloadPrefix = "directus.widgets.latestItems.v1.payload."

  private var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroup)
  }

  @objc(setConfigList:)
  func setConfigList(_ json: NSString) {
    defaults?.set(json as String, forKey: configListKey)
    defaults?.synchronize()
  }

  @objc(setPayload:json:)
  func setPayload(_ id: NSString, json: NSString?) {
    let key = payloadPrefix + (id as String)
    if let json = json {
      defaults?.set(json as String, forKey: key)
    } else {
      defaults?.removeObject(forKey: key)
    }
    defaults?.synchronize()
  }
}

