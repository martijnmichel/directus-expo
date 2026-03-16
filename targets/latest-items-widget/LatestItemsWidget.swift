import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Shared storage keys (must match JS)

private let appGroup = "group.com.martijnmichel.directusexpo.widgets"
private let configListKey = "directus.widgets.latestItems.v1.configList"
private let payloadPrefix = "directus.widgets.latestItems.v1.payload."

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
}

struct PayloadColumn: Decodable, Hashable {
  let key: String
  let label: String
}

struct PayloadRow: Decodable, Hashable {
  let id: String
  let deepLink: String?
  let cells: [String: String]
}

struct LatestItemsPayload: Decodable {
  let version: Int
  let title: String
  let collection: String
  let fetchedAt: String
  let columns: [PayloadColumn]
  let rows: [PayloadRow]
}

// MARK: - Data access

private func getDefaults() -> UserDefaults? {
  return UserDefaults(suiteName: appGroup)
}

private func readConfigList() -> [WidgetConfigEntry] {
  guard let defaults = getDefaults(),
        let raw = defaults.string(forKey: configListKey),
        let data = raw.data(using: .utf8)
  else { return [] }
  do {
    return try JSONDecoder().decode([WidgetConfigEntry].self, from: data)
  } catch {
    return []
  }
}

private func readPayload(configId: String) -> LatestItemsPayload? {
  guard let defaults = getDefaults(),
        let raw = defaults.string(forKey: payloadPrefix + configId),
        let data = raw.data(using: .utf8)
  else { return nil }
  do {
    return try JSONDecoder().decode(LatestItemsPayload.self, from: data)
  } catch {
    return nil
  }
}

// MARK: - Webhook fetch

private func fetchPayloadFromWebhook(config: WidgetConfigEntry) async -> LatestItemsPayload? {
  guard let urlString = config.webhookUrl,
        let url = URL(string: urlString) else {
    return nil
  }
  let idToSend = config.widgetId ?? config.id

  var request = URLRequest(url: url)
  request.httpMethod = "POST"
  request.setValue("application/json", forHTTPHeaderField: "Content-Type")

  let body: [String: String] = ["widget_id": idToSend]
  request.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])

  do {
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse,
          (200..<300).contains(http.statusCode) else {
      return nil
    }
    return try JSONDecoder().decode(LatestItemsPayload.self, from: data)
  } catch {
    return nil
  }
}

// MARK: - AppIntent (per-widget config picker)
// Public types so the system can resolve the intent when the user taps "Setup".

public struct LatestItemsConfigEntity: AppEntity, Identifiable {
  public static var typeDisplayRepresentation: TypeDisplayRepresentation = "Widget setup"
  public static var defaultQuery = LatestItemsConfigQuery()

  public let id: String
  public let title: String

  public init(id: String, title: String) {
    self.id = id
    self.title = title
  }

  public var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: LocalizedStringResource(stringLiteral: title))
  }
}

public struct LatestItemsConfigQuery: EntityQuery {
  public init() {}

  public func entities(for identifiers: [LatestItemsConfigEntity.ID]) async throws -> [LatestItemsConfigEntity] {
    let all = try await suggestedEntities()
    return all.filter { identifiers.contains($0.id) }
  }

  public func suggestedEntities() async throws -> [LatestItemsConfigEntity] {
    let list = readConfigList()
    return list.map { LatestItemsConfigEntity(id: $0.id, title: $0.title) }
  }
}

public struct LatestItemsWidgetConfigurationIntent: AppIntent, WidgetConfigurationIntent {
  public static var title: LocalizedStringResource = "Latest Items"
  public static var description = IntentDescription("Pick which widget setup to show.")

  @Parameter(title: "Setup")
  public var setup: LatestItemsConfigEntity?

  public init() {}
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let configTitle: String
  let payload: LatestItemsPayload?
}

struct Provider: AppIntentTimelineProvider {
  typealias Intent = LatestItemsWidgetConfigurationIntent

  func placeholder(in context: Context) -> Entry {
    Entry(date: .now, configTitle: "Latest", payload: nil)
  }

  func snapshot(for configuration: Intent, in context: Context) async -> Entry {
    let list = readConfigList()
    let selectedId = configuration.setup?.id ?? list.first?.id
    let selectedConfig = list.first(where: { $0.id == selectedId }) ?? list.first

    var payload: LatestItemsPayload? = nil

    if let config = selectedConfig,
       (config.webhookUrl != nil || config.widgetId != nil) {
      payload = await fetchPayloadFromWebhook(config: config)
    }

    if payload == nil, let id = selectedConfig?.id {
      payload = readPayload(configId: id)
    }

    let title = payload?.title ?? configuration.setup?.title ?? selectedConfig?.title ?? "Latest"
    return Entry(date: .now, configTitle: title, payload: payload)
  }

  func timeline(for configuration: Intent, in context: Context) async -> Timeline<Entry> {
    let entry = await snapshot(for: configuration, in: context)
    // Refresh in ~30 minutes (system may throttle)
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now.addingTimeInterval(1800)
    return Timeline(entries: [entry], policy: .after(next))
  }
}

// MARK: - View

struct LatestItemsWidgetView: View {
  var entry: Provider.Entry

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(entry.payload?.title ?? entry.configTitle)
        .font(.headline)
        .lineLimit(1)

      if let payload = entry.payload, !payload.columns.isEmpty {
        VStack(alignment: .leading, spacing: 4) {
          // Header row
          HStack(alignment: .top, spacing: 8) {
            ForEach(payload.columns.prefix(3), id: \.key) { col in
              Text(col.label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
          }

          // Data rows (limit for small/medium)
          ForEach(payload.rows.prefix(5), id: \.id) { row in
            HStack(alignment: .top, spacing: 8) {
              ForEach(payload.columns.prefix(3), id: \.key) { col in
                Text(row.cells[col.key] ?? "–")
                  .font(.caption)
                  .lineLimit(1)
                  .frame(maxWidth: .infinity, alignment: .leading)
              }
            }
            .widgetURL(URL(string: row.deepLink ?? ""))
          }
        }
      } else {
        Text("Open the app to refresh")
          .font(.caption)
          .foregroundStyle(.secondary)
      }

      Spacer(minLength: 0)
    }
    .containerBackground(for: .widget) { Color(.systemBackground) }
    .padding(12)
  }
}

// MARK: - Widget

struct LatestItemsWidget: Widget {
  let kind: String = "LatestItemsWidget"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: LatestItemsWidgetConfigurationIntent.self, provider: Provider()) { entry in
      LatestItemsWidgetView(entry: entry)
    }
    .configurationDisplayName("Latest Items")
    .description("Shows the same columns and values as the collection data table.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

@main
struct LatestItemsWidgetBundle: WidgetBundle {
  var body: some Widget {
    LatestItemsWidget()
  }
}

