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
    let favicon = selectedConfig.flatMap { faviconURLString(instanceUrl: $0.instanceUrl) }
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
  let slotKeys: [String]

  var body: some View {
    let left = item.value(for: "left")
    let title = item.value(for: "title")
    let subtitle = item.value(for: "subtitle")
    let right = item.value(for: "right")

    return Group {
      if slotKeys == ["title", "subtitle"] {
        VStack(alignment: .leading, spacing: 2) {
          Text(title)
            .font(.caption.weight(.semibold))
            .lineLimit(1)

          Text(subtitle)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
      } else {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
          if slotKeys.contains("left") {
            Text(left)
              .font(.caption2)
              .foregroundStyle(.secondary)
              .lineLimit(1)
              .frame(minWidth: 34, alignment: .leading)
          }

          VStack(alignment: .leading, spacing: 2) {
            Text(title)
              .font(.caption.weight(.semibold))
              .lineLimit(1)

            if slotKeys.contains("subtitle") {
              Text(subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)

          if slotKeys.contains("right") {
            Text(right)
              .font(.caption2)
              .foregroundStyle(.secondary)
              .lineLimit(1)
              .frame(alignment: .trailing)
          }
        }
      }
    }
    .widgetURL(item.urlString.flatMap { URL(string: $0) })
  }
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
  return "\(s)/favicon.ico"
}

struct LatestItemsWidgetView: View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    let maxRows: Int = (family == .systemSmall) ? 3 : (family == .systemMedium) ? 5 : 8
    let visibleSlots: [String] = {
      switch family {
      case .systemSmall:
        return ["title", "subtitle"]
      case .systemMedium:
        return ["left", "title", "right"]
      default:
        return WidgetConstants.slotOrder
      }
    }()

    VStack(alignment: .leading, spacing: 10) {
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
          .frame(width: 16, height: 16)
          .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
        }

        Text(entry.configTitle)
          .font(.headline)
          .lineLimit(1)

        Spacer(minLength: 0)
      }

      if !entry.items.isEmpty {
        VStack(alignment: .leading, spacing: 0) {
          ForEach(entry.items.prefix(maxRows), id: \.id) { it in
            VStack(alignment: .leading, spacing: 6) {
              SlotRowView(item: it, slotKeys: visibleSlots)
              Divider().opacity(0.5)
            }
            .padding(.vertical, 6)
          }
        }
      } else {
        Text(entry.statusMessage ?? "Open the app to refresh")
          .font(.caption)
          .foregroundStyle(.secondary)
      }

      Spacer(minLength: 0)
    }
    .containerBackground(for: .widget) { Color.clear }
    .padding(12)
  }
}

// Widget entrypoint lives in `LatestItemsWidgetBundle.swift`.
