import Foundation

enum DirectusWidgetFlowDecoder {
  static func decodeSlotItemsFromFlowResponse(_ response: FlowResponse, collection: String?, sessionId: String? = nil) -> [SlotItem] {
    let items = response.data?.first(where: { $0.type == DirectusWidgetConstants.flowBlockTypeLatestItems })?.items ?? []
    let urlBase: String? = collection.flatMap { c in
      c.isEmpty ? nil : "directus://content/\(c)/"
    }
    let sidTrim = sessionId?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let sid: String? = sidTrim.isEmpty ? nil : sidTrim

    return items
      .filter { !$0.id.isEmpty }
      .map { it in
        var map: [String: SlotItem.SlotValue] = [:]
        for v in it.values {
          if !v.slot.isEmpty {
            map[v.slot] = .init(
              type: (v.type ?? "string").lowercased(),
              value: v.value,
              options: v.options
            )
          }
        }
        var urlStr = urlBase.map { $0 + it.id }
        if let sid, var base = urlStr {
          let enc = sid.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? sid
          base += base.contains("?") ? "&sessionId=\(enc)" : "?sessionId=\(enc)"
          urlStr = base
        }
        return SlotItem(id: it.id, urlString: urlStr, slots: map)
      }
  }

  /// Reads cached flow JSON from the app group (`FlowResponse` shape).
  static func readCachedPayload(
    suiteName: String,
    payloadKeyPrefix: String,
    configId: String,
    collection: String?,
    sessionId: String? = nil,
  ) -> [SlotItem]? {
    guard let defaults = UserDefaults(suiteName: suiteName),
          let raw = defaults.string(forKey: payloadKeyPrefix + configId),
          let data = raw.data(using: .utf8)
    else { return nil }

    do {
      let resp = try JSONDecoder().decode(FlowResponse.self, from: data)
      return decodeSlotItemsFromFlowResponse(resp, collection: collection, sessionId: sessionId)
    } catch {
      return nil
    }
  }
}
