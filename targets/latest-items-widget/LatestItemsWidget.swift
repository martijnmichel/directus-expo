import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Shared storage keys (must match JS)

private enum WidgetConstants {
  static let appGroup = "group.com.martijnmichel.directusexpo.widgets"
  static let configListKey = "directus.widgets.latestItems.v1.configList"
  static let configListFileName = "configList.json"
  static let payloadPrefix = "directus.widgets.latestItems.v1.payload."

  static let latestItemsType = "latest-items"
  static let slotOrder: [String] = ["left", "title", "subtitle", "right"]
}

// MARK: - Models
//
// The widget does not store the "Directus API URL" separately. Each config entry
// includes webhookUrl (the flow trigger URL, e.g. https://your-directus.com/flows/trigger/xxx).
// The app writes the config list (with webhookUrl per setup) to App Group; the widget
// uses config.webhookUrl to POST { "widget_id": ... } and receive the payload.

struct WidgetConfigEntry: Decodable, Hashable {
  let id: String
  let title: String
  let instanceUrl: String?
  let collection: String?
  let widgetId: String?
  let webhookUrl: String?

  enum CodingKeys: String, CodingKey {
    case id, title, instanceUrl, collection, widgetId, webhookUrl
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    id = (try? c.decode(String.self, forKey: .id)) ?? (try? c.decode(Int.self, forKey: .id)).map { String($0) } ?? ""
    title = (try? c.decode(String.self, forKey: .title)) ?? (try? c.decode(Int.self, forKey: .title)).map { String($0) } ?? ""
    instanceUrl = try? c.decodeIfPresent(String.self, forKey: .instanceUrl)
    collection = try? c.decodeIfPresent(String.self, forKey: .collection)
    widgetId = try? c.decodeIfPresent(String.self, forKey: .widgetId)
    webhookUrl = try? c.decodeIfPresent(String.self, forKey: .webhookUrl)
  }
}

// MARK: - Flow response models
//
// Directus Flow response (APP_WIDGET_FLOW_VERSION):
// { ok, status, version, supports, data: [{ type: "latest-items", items: [{ id, values: [{slot,type,value}] }] }] }


struct FlowItemValue: Decodable, Hashable {
  let slot: String
  let type: String?
  let value: String

  enum CodingKeys: String, CodingKey {
    case slot, type, value
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    slot = (try? c.decode(String.self, forKey: .slot)) ?? ""
    type = try? c.decodeIfPresent(String.self, forKey: .type)
    value = (try? c.decode(String.self, forKey: .value))
      ?? (try? c.decode(Int.self, forKey: .value)).map { String($0) }
      ?? (try? c.decode(Double.self, forKey: .value)).map { String($0) }
      ?? ""
  }
}

struct FlowItem: Decodable, Hashable {
  let id: String
  let values: [FlowItemValue]

  enum CodingKeys: String, CodingKey {
    case id, values
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    id = (try? c.decode(String.self, forKey: .id)) ?? (try? c.decode(Int.self, forKey: .id)).map { String($0) } ?? ""
    values = (try? c.decode([FlowItemValue].self, forKey: .values)) ?? []
  }
}

struct FlowDataEntry: Decodable {
  let type: String
  let items: [FlowItem]

  enum CodingKeys: String, CodingKey {
    case type, items
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    type = (try? c.decode(String.self, forKey: .type)) ?? ""
    items = (try? c.decode([FlowItem].self, forKey: .items)) ?? []
  }
}

struct FlowResponse: Decodable {
  let ok: Bool?
  let status: String?
  let version: Int?
  let supports: [String]?
  let data: [FlowDataEntry]?
}

// MARK: - Legacy payload (fallback only)

struct LegacyPayloadColumn: Decodable, Hashable {
  let key: String
  let label: String
}

struct LegacyPayloadRow: Decodable, Hashable {
  let id: String
  let deepLink: String?
  let cells: [String: String]
}

struct LegacyLatestItemsPayload: Decodable {
  let version: Int
  let title: String
  let collection: String
  let fetchedAt: String
  let columns: [LegacyPayloadColumn]
  let rows: [LegacyPayloadRow]
}

// MARK: - View model

struct SlotItem: Hashable, Identifiable {
  let id: String
  let urlString: String?
  let slots: [String: String]

  func value(for slot: String) -> String {
    let v = slots[slot] ?? ""
    return v.isEmpty ? "–" : v
  }
}

// MARK: - Data access

private func getDefaults() -> UserDefaults? {
  return UserDefaults(suiteName: WidgetConstants.appGroup)
}

private func readConfigList() -> [WidgetConfigEntry] {
  var raw: String?
  if let defaults = getDefaults() {
    raw = defaults.string(forKey: WidgetConstants.configListKey)
  }
  if raw == nil || raw?.isEmpty == true,
     let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: WidgetConstants.appGroup) {
    let fileURL = containerURL.appendingPathComponent(WidgetConstants.configListFileName)
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
  return list
}

private func decodeSlotItemsFromFlowResponse(_ response: FlowResponse, config: WidgetConfigEntry?) -> [SlotItem] {
  let items = response.data?.first(where: { $0.type == WidgetConstants.latestItemsType })?.items ?? []
  let collection = config?.collection
  let urlBase: String? = collection.map { "directus://content/\($0)/" }

  return items
    .filter { !$0.id.isEmpty }
    .map { it in
      var map: [String: String] = [:]
      for v in it.values {
        if !v.slot.isEmpty { map[v.slot] = v.value }
      }
      let url = (urlBase != nil) ? (urlBase! + it.id) : nil
      return SlotItem(id: it.id, urlString: url, slots: map)
    }
}

private func decodeSlotItemsFromLegacyPayload(_ payload: LegacyLatestItemsPayload) -> (title: String, items: [SlotItem]) {
  // Best-effort mapping: take up to first 4 columns and map them into known slots.
  let keys = payload.columns.map(\.key)
  let slotKeys = Array(WidgetConstants.slotOrder.prefix(min(WidgetConstants.slotOrder.count, keys.count)))

  let items: [SlotItem] = payload.rows
    .filter { !$0.id.isEmpty }
    .map { row in
      var map: [String: String] = [:]
      for (idx, slot) in slotKeys.enumerated() {
        let colKey = keys[idx]
        map[slot] = row.cells[colKey] ?? ""
      }
      return SlotItem(id: row.id, urlString: row.deepLink, slots: map)
    }

  return (payload.title, items)
}

private func readPayload(configId: String, config: WidgetConfigEntry?) -> (title: String?, items: [SlotItem])? {
  guard let defaults = getDefaults(),
        let raw = defaults.string(forKey: WidgetConstants.payloadPrefix + configId),
        let data = raw.data(using: .utf8)
  else { return nil }

  do {
    // Prefer the current flow response shape.
    let resp = try JSONDecoder().decode(FlowResponse.self, from: data)
    let items = decodeSlotItemsFromFlowResponse(resp, config: config)
    return (nil, items)
  } catch {
    // Fallback: older cached widget payload shape.
    do {
      let legacy = try JSONDecoder().decode(LegacyLatestItemsPayload.self, from: data)
      let mapped = decodeSlotItemsFromLegacyPayload(legacy)
      return (mapped.title, mapped.items)
    } catch {
      return nil
    }
  }
}

// MARK: - Webhook fetch

private func fetchSlotItemsFromWebhook(config: WidgetConfigEntry) async -> [SlotItem]? {
  guard let baseUrlString = config.webhookUrl,
        let baseUrl = URL(string: baseUrlString) else {
    return nil
  }
  let idToSend = config.widgetId ?? config.id

  var components = URLComponents(url: baseUrl, resolvingAgainstBaseURL: false)
  var queryItems = components?.queryItems ?? []
  queryItems.append(URLQueryItem(name: "widget_id", value: idToSend))
  components?.queryItems = queryItems
  guard let url = components?.url else { return nil }

  var request = URLRequest(url: url)
  request.httpMethod = "GET"

  do {
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse,
          (200..<300).contains(http.statusCode) else {
      return nil
    }
    let resp = try JSONDecoder().decode(FlowResponse.self, from: data)
    return decodeSlotItemsFromFlowResponse(resp, config: config)
  } catch {
    return nil
  }
}

private func fetchSlotItemsFromWebhookDetailed(config: WidgetConfigEntry) async -> (items: [SlotItem]?, errorMessage: String?) {
  guard let urlString = config.webhookUrl, !urlString.isEmpty else {
    return (nil, "Missing webhook URL. Open the app and re-save this setup.")
  }
  guard let baseUrl = URL(string: urlString) else {
    return (nil, "Invalid webhook URL. Open the app and re-save this setup.")
  }

  let idToSend = config.widgetId ?? config.id

  var components = URLComponents(url: baseUrl, resolvingAgainstBaseURL: false)
  var queryItems = components?.queryItems ?? []
  queryItems.append(URLQueryItem(name: "widget_id", value: idToSend))
  components?.queryItems = queryItems
  guard let url = components?.url else {
    return (nil, "Invalid webhook URL. Open the app and re-save this setup.")
  }

  var request = URLRequest(url: url)
  request.httpMethod = "GET"
  request.timeoutInterval = 10

  do {
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse else {
      return (nil, "No response from server.")
    }
    guard (200..<300).contains(http.statusCode) else {
      return (nil, "Webhook error (HTTP \(http.statusCode)).")
    }
    let resp = try JSONDecoder().decode(FlowResponse.self, from: data)
    let items = decodeSlotItemsFromFlowResponse(resp, config: config)
    return (items, nil)
  } catch is DecodingError {
    return (nil, "Webhook returned unexpected JSON.")
  } catch {
    return (nil, "Couldn’t refresh (network error).")
  }
}

// MARK: - AppIntent (per-widget config picker)
// Public types so the system can resolve the intent when the user taps "Setup".

@available(iOS 17.0, *)
struct LatestItemsConfigEntity: AppEntity, Identifiable {
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Widget setup"
  static var defaultQuery = LatestItemsConfigQuery()

  let id: String
  let title: String

  init(id: String, title: String) {
    self.id = id
    self.title = title
  }

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: LocalizedStringResource(stringLiteral: title))
  }
}

@available(iOS 17.0, *)
struct LatestItemsConfigQuery: EntityQuery {
  init() {}

  func entities(for identifiers: [LatestItemsConfigEntity.ID]) async throws -> [LatestItemsConfigEntity] {
    let all = try await suggestedEntities()
    return all.filter { identifiers.contains($0.id) }
  }

  func suggestedEntities() async throws -> [LatestItemsConfigEntity] {
    let list = readConfigList()
    return list.map { LatestItemsConfigEntity(id: $0.id, title: $0.title) }
  }
}

@available(iOS 17.0, *)
struct LatestItemsWidgetConfigurationIntent: AppIntent, WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Latest Items"
  static var description = IntentDescription("Pick which widget setup to show.")

  @available(iOS 17.0, *)
  @Parameter(title: "Setup")
  var setup: LatestItemsConfigEntity?

  init() {}
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let configTitle: String
  let faviconUrl: String?
  let items: [SlotItem]
  let statusMessage: String?
}

@available(iOS 17.0, *)
struct Provider: AppIntentTimelineProvider {
  typealias Intent = LatestItemsWidgetConfigurationIntent

  func placeholder(in context: Context) -> Entry {
    Entry(date: .now, configTitle: "Latest", faviconUrl: nil, items: [], statusMessage: nil)
  }

  func snapshot(for configuration: Intent, in context: Context) async -> Entry {
    let list = readConfigList()
    let selectedId = configuration.setup?.id ?? list.first?.id
    let selectedConfig = list.first(where: { $0.id == selectedId }) ?? list.first

    var items: [SlotItem] = []
    var titleOverride: String? = nil
    var status: String? = nil

    if selectedConfig == nil {
      status = "No widget setup found. Open Settings → Widget and add a setup."
    } else if let config = selectedConfig, (config.webhookUrl == nil || config.webhookUrl?.isEmpty == true) {
      status = "This setup is missing a webhook URL. Open the app and re-save the setup."
    } else if let config = selectedConfig {
      let result = await fetchSlotItemsFromWebhookDetailed(config: config)
      items = result.items ?? []
      if items.isEmpty, let msg = result.errorMessage { status = msg }
    }

    if items.isEmpty, let config = selectedConfig {
      if let cached = readPayload(configId: config.id, config: config) {
        titleOverride = cached.title
        items = cached.items
      }
    }

    let title = titleOverride ?? configuration.setup?.title ?? selectedConfig?.title ?? "Latest"
    var favicon: String? = nil
    let baseFromConfig = selectedConfig.flatMap { cfg in
      faviconURLString(instanceUrl: cfg.instanceUrl) ?? instanceBaseURLString(from: cfg.webhookUrl)
    }
    if let base = baseFromConfig {
      favicon = await fetchFaviconURL(from: base) ?? fallbackFaviconICO(instanceBaseUrl: base)
    }
    return Entry(date: .now, configTitle: title, faviconUrl: favicon, items: items, statusMessage: status)
  }

  func timeline(for configuration: Intent, in context: Context) async -> Timeline<Entry> {
    let entry = await snapshot(for: configuration, in: context)
    // Refresh in ~30 minutes (system may throttle)
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now.addingTimeInterval(1800)
    return Timeline(entries: [entry], policy: .after(next))
  }
}

// MARK: - View

struct SlotRowView: View {
  let item: SlotItem
  let family: WidgetFamily

  var body: some View {
    let leftRaw = item.value(for: "left")
    let titleRaw = item.value(for: "title")
    let subtitleRaw = item.value(for: "subtitle")
    let rightRaw = item.value(for: "right")

    // If a slot contains a date string, format it nicely (time for today, relative day otherwise).
    let left = formatDateIfPossible(leftRaw)
    let title = formatDateIfPossible(titleRaw)
    let subtitle = formatDateIfPossible(subtitleRaw)
    let right = formatDateIfPossible(rightRaw)
    let leftWidth: CGFloat = {
      switch family {
      case .systemSmall: return 38
      case .systemMedium: return 48
      default: return 56
      }
    }()
    let rightWidth: CGFloat = {
      switch family {
      case .systemSmall: return 52
      case .systemMedium: return 58
      default: return 64
      }
    }()
    let hasLeft = leftRaw != "–"
    let hasRight = rightRaw != "–"

    // Mail-like 2-line layout:
    // Line 1: left - title - right
    // Line 2: subtitle aligned under title (no left/right texts)
    let lineSpacing: CGFloat = family == .systemSmall ? 1.5 : 2
    return VStack(alignment: .leading, spacing: lineSpacing) {
      // Line 1
      HStack(alignment: .center, spacing: 6) {
        if hasLeft {
          Text(left)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .lineLimit(1)
            .frame(width: leftWidth, alignment: .leading)
        }

        Text(title)
          .font(.headline.weight(.semibold))
          .lineLimit(1)
          .frame(maxWidth: .infinity, alignment: .leading)
          .layoutPriority(1)

        if hasRight {
          Text(right)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .lineLimit(1)
            .frame(width: rightWidth, alignment: .trailing)
        }
      }

      // Line 2
      Text(subtitle)
        .font(.subheadline)
        .foregroundStyle(.secondary)
        .lineLimit(1)
        .frame(maxWidth: .infinity, alignment: .leading)
        .layoutPriority(1)
    }
    .modifier(LatestItemsWidgetURLIfNotPreviewModifier(url: item.urlString.flatMap { URL(string: $0) }))
  }
}

private struct LatestItemsWidgetURLIfNotPreviewModifier: ViewModifier {
  let url: URL?

  func body(content: Content) -> some View {
    let isPreview = ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] != nil
    if isPreview || url == nil {
      content
    } else {
      content.widgetURL(url!)
    }
  }
}

private func formatDateIfPossible(_ raw: String) -> String {
  let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
  guard !trimmed.isEmpty else { return raw }
  guard trimmed != "–" else { return raw }

  guard let date = parseDateIfPossible(trimmed) else { return raw }

  let now = Date()
  let calendar = Calendar.current
  let dayDiff = calendar.dateComponents([.day], from: date, to: now).day ?? 0

  // If the slot clearly contains a time and it's effectively "today", show time only.
  let hasTimeComponent = trimmed.contains(":")
  if hasTimeComponent && abs(dayDiff) == 0 {
    let df = DateFormatter()
    df.locale = .current
    df.timeStyle = .short
    df.dateStyle = .none
    return df.string(from: date)
  }

  // Otherwise show relative day text like "Yesterday" / "3 days ago".
  let rdtf = RelativeDateTimeFormatter()
  rdtf.locale = .current
  rdtf.unitsStyle = .full
  return rdtf.localizedString(for: date, relativeTo: now)
}

private func parseDateIfPossible(_ s: String) -> Date? {
  let t = s.trimmingCharacters(in: .whitespacesAndNewlines)

  // Epoch seconds / milliseconds.
  if let intVal = Int64(t), t.count == 10 || t.count == 13 {
    let seconds = t.count == 13 ? Double(intVal) / 1000.0 : Double(intVal)
    return Date(timeIntervalSince1970: seconds)
  }

  // Prefer ISO8601 parsing (Directus typically outputs ISO date-times).
  let iso = ISO8601DateFormatter()
  iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withTimeZone]
  if let d = iso.date(from: t) { return d }

  iso.formatOptions = [.withInternetDateTime, .withTimeZone]
  if let d = iso.date(from: t) { return d }

  // Common fallback patterns (no timezone).
  let df = DateFormatter()
  df.locale = Locale(identifier: "en_US_POSIX")
  df.timeZone = TimeZone.current

  let formats = [
    "yyyy-MM-dd",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm",
    "yyyy-MM-dd'T'HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ss.SSS"
  ]

  for f in formats {
    df.dateFormat = f
    if let d = df.date(from: t) { return d }
  }

  return nil
}

private func faviconURLString(instanceUrl: String?) -> String? {
  guard var s = instanceUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty else {
    return nil
  }
  // Basic normalization: ensure scheme exists and remove trailing slashes.
  if !s.lowercased().hasPrefix("http://") && !s.lowercased().hasPrefix("https://") {
    s = "https://\(s)"
  }
  s = s.replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
  return s
}

private func fallbackFaviconICO(instanceBaseUrl: String) -> String {
  "\(instanceBaseUrl)/favicon.ico"
}

private func instanceBaseURLString(from webhookUrl: String?) -> String? {
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

private func resolveIconHref(_ href: String, baseURL: URL) -> String? {
  let h = href.trimmingCharacters(in: .whitespacesAndNewlines)
  if h.isEmpty { return nil }
  if h.hasPrefix("http://") || h.hasPrefix("https://") { return h }
  if h.hasPrefix("//") { return "\(baseURL.scheme ?? "https"):\(h)" }
  return URL(string: h, relativeTo: baseURL)?.absoluteURL.absoluteString
}

private func extractIconHref(from html: String) -> String? {
  // Look for <link rel="icon" href="..."> (also accepts "shortcut icon", "apple-touch-icon", etc.)
  let pattern =
    #"<link\b[^>]*\brel\s*=\s*["']([^"']*icon[^"']*)["'][^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>"#
  guard let re = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
  let ns = html as NSString
  let range = NSRange(location: 0, length: ns.length)
  guard let match = re.firstMatch(in: html, options: [], range: range) else { return nil }
  guard match.numberOfRanges >= 3 else { return nil }
  return ns.substring(with: match.range(at: 2))
}

private func fetchFaviconURL(from instanceBaseUrl: String) async -> String? {
  guard let baseURL = URL(string: instanceBaseUrl) else { return nil }
  var request = URLRequest(url: baseURL)
  request.httpMethod = "GET"
  request.timeoutInterval = 6
  request.setValue("text/html,application/xhtml+xml", forHTTPHeaderField: "Accept")

  do {
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { return nil }
    guard let html = String(data: data, encoding: .utf8), !html.isEmpty else { return nil }
    guard let href = extractIconHref(from: html) else { return nil }
    return resolveIconHref(href, baseURL: baseURL)
  } catch {
    return nil
  }
}

struct LatestItemsWidgetView: View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    // Let WidgetKit apply its native content margins; we only tune internal spacing.
    let hPad: CGFloat = 0
    let topPad: CGFloat = 0
    let bottomPad: CGFloat = 0
    // Always show left/title/subtitle/right for alignment (Mail-style).
    let _ = WidgetConstants.slotOrder

    return GeometryReader { geo in
      let headerListSpacing: CGFloat = family == .systemSmall ? 6 : 10
      let maxRows: Int = {
        switch family {
        case .systemSmall, .systemMedium:
          return 2
        case .systemLarge:
          return 4
        default:
          return 2
        }
      }()

      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .center, spacing: 8) {
          if let s = entry.faviconUrl, let url = URL(string: s) {
            AsyncImage(url: url, transaction: Transaction(animation: .none)) { phase in
              switch phase {
              case .success(let image):
                image
                  .resizable()
                  .scaledToFit()
              default:
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                  .fill(Color.secondary.opacity(0.25))
              }
            }
            .frame(
              width: family == .systemSmall ? 14 : 16,
              height: family == .systemSmall ? 14 : 16
            )
            .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
          } else {
            RoundedRectangle(cornerRadius: 4, style: .continuous)
              .fill(Color.secondary.opacity(0.15))
              .frame(
                width: family == .systemSmall ? 14 : 16,
                height: family == .systemSmall ? 14 : 16
              )
          }

          Text(entry.configTitle)
            .font(family == .systemSmall ? .subheadline.weight(.semibold) : .headline)
            .lineLimit(1)

          Spacer(minLength: 0)
        }
        .padding(
          .vertical,
          family == .systemSmall ? 3 : 4
        )
        // Let the header size naturally to better match native SwiftUI layout.

        if !entry.items.isEmpty {
          Divider().opacity(0.5)
          VStack(alignment: .leading, spacing: 0) {
            let visible = Array(entry.items.prefix(maxRows))
            ForEach(Array(visible.enumerated()), id: \.element.id) { idx, it in
              SlotRowView(item: it, family: family)
                .padding(
                  .vertical,
                  family == .systemSmall ? 2 : 3
                )
              if idx < visible.count - 1 { Divider() }
            }
          }
          .padding(.top, headerListSpacing)
        } else {
          Text(entry.statusMessage ?? "Open the app to refresh")
            .font(.caption)
            .foregroundStyle(.secondary)
        }
      }
      .modifier(LatestItemsContainerBackgroundIfNotPreviewModifier())
      .padding(.horizontal, hPad)
      .padding(.top, topPad)
      .padding(.bottom, bottomPad)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
  }
}

private struct LatestItemsContainerBackgroundIfNotPreviewModifier: ViewModifier {
  func body(content: Content) -> some View {
    let isPreview = ProcessInfo.processInfo.environment["XCODE_RUNNING_FOR_PREVIEWS"] != nil
    if isPreview {
      content
    } else {
      content.containerBackground(for: .widget) { Color.clear }
    }
  }
}

// Widget entrypoint lives in `LatestItemsWidgetBundle.swift`.
