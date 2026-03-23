import Foundation

enum DirectusWidgetUrls {
  /// `https://host[:port]` from a flow trigger URL (matches Android `DirectusWidgetUrls.resolveInstanceBaseUrl` webhook branch).
  static func instanceBaseURLString(from webhookUrl: String?) -> String? {
    guard let webhookUrl, !webhookUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
          let url = URL(string: webhookUrl),
          let scheme = url.scheme,
          let host = url.host
    else {
      return nil
    }

    if let port = url.port {
      return "\(scheme)://\(host):\(port)"
    }
    return "\(scheme)://\(host)"
  }

  static func normalizedInstanceURLString(_ instanceUrl: String?) -> String? {
    guard var s = instanceUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else {
      return nil
    }
    if !s.lowercased().hasPrefix("http://") && !s.lowercased().hasPrefix("https://") {
      s = "https://\(s)"
    }
    s = s.replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
    return s
  }

  static func assetURLString(instanceBase: String, fileId: String, query: String) -> String {
    let base = instanceBase.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    return "\(base)/assets/\(fileId)?\(query)"
  }
}
