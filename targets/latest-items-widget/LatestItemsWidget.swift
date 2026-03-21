import AppIntents
import SwiftUI
import UIKit
import WidgetKit

// MARK: - AppIntent (per-widget config picker)

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
    let list = readLatestItemsConfigList()
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
  let faviconImageData: Data?
  let instanceUrl: String?
  let items: [SlotItem]
  let statusMessage: String?
}

@available(iOS 17.0, *)
struct Provider: AppIntentTimelineProvider {
  typealias Intent = LatestItemsWidgetConfigurationIntent

  func placeholder(in context: Context) -> Entry {
    Entry(date: .now, configTitle: "Latest", faviconImageData: nil, instanceUrl: nil, items: [], statusMessage: nil)
  }

  func snapshot(for configuration: Intent, in context: Context) async -> Entry {
    let list = readLatestItemsConfigList()
    let selectedId = configuration.setup?.id ?? list.first?.id
    let selectedConfig = list.first(where: { $0.id == selectedId }) ?? list.first

    var items: [SlotItem] = []
    var status: String? = nil
    var flowResp: FlowResponse? = nil

    if selectedConfig == nil {
      status = "No widget setup found. Open Settings → Widget and add a setup."
    } else if let config = selectedConfig, (config.webhookUrl == nil || config.webhookUrl?.isEmpty == true) {
      status = "This setup is missing a webhook URL. Open the app and re-save the setup."
    } else if let config = selectedConfig {
      let result = await DirectusWidgetWebhookClient.fetchSlotItemsFromWebhookDetailed(config: config)
      items = result.items ?? []
      if items.isEmpty, let msg = result.errorMessage { status = msg }
      flowResp = result.flowResponse
    }

    if items.isEmpty, let config = selectedConfig {
      if let cached = DirectusWidgetFlowDecoder.readCachedPayload(
        suiteName: LatestItemsWidgetKeys.appGroup,
        payloadKeyPrefix: LatestItemsWidgetKeys.payloadPrefix,
        configId: config.id,
        collection: config.collection
      ) {
        items = cached
      }
    }

    items = await DirectusWidgetImagePrefetch.prefetchThumbnailImages(in: items, instanceUrl: selectedConfig?.instanceUrl)

    let title = configuration.setup?.title ?? selectedConfig?.title ?? "Latest"
    let faviconImageData = await DirectusWidgetImagePrefetch.prefetchFaviconImage(
      faviconFileId: flowResp?.favicon,
      instanceUrl: selectedConfig?.instanceUrl,
      webhookUrl: selectedConfig?.webhookUrl
    )
    return Entry(
      date: .now,
      configTitle: title,
      faviconImageData: faviconImageData,
      instanceUrl: selectedConfig?.instanceUrl,
      items: items,
      statusMessage: status
    )
  }

  func timeline(for configuration: Intent, in context: Context) async -> Timeline<Entry> {
    let entry = await snapshot(for: configuration, in: context)
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: .now) ?? .now.addingTimeInterval(1800)
    return Timeline(entries: [entry], policy: .after(next))
  }
}

// MARK: - View

struct SlotRowView: View {
  let item: SlotItem
  let family: WidgetFamily

  var body: some View {
    let leftSlot = item.slotValue(for: "left")
    let titleSlot = item.slotValue(for: "title")
    let subtitleSlot = item.slotValue(for: "subtitle")
    let rightSlot = item.slotValue(for: "right")

    let title = DirectusWidgetSlotDisplay.text(for: titleSlot)
    let subtitle = DirectusWidgetSlotDisplay.text(for: subtitleSlot)
    let hasLeft = DirectusWidgetSideSlot.hasContent(leftSlot)
    let hasRight = DirectusWidgetSideSlot.hasContent(rightSlot)
    let hasSubtitle = DirectusWidgetSideSlot.hasContent(subtitleSlot)

    return VStack(alignment: .leading, spacing: WidgetNativeTheme.Layout.rowLineSpacing) {
      HStack(alignment: .center, spacing: WidgetNativeTheme.Layout.columnGap) {
        if hasLeft {
          DirectusWidgetSideSlotView(slot: leftSlot, alignment: .leading)
            .modifier(
              WidgetSideSlotColumnModifier(
                behaviour: WidgetSlotWidthBehaviour.parse(options: leftSlot?.options),
                widthPercent: WidgetSlotWidthBehaviour.widthPercent(options: leftSlot?.options),
                alignment: .leading,
              ),
            )
        }

        // Title fills remaining row width; same leading edge as subtitle when no left column.
        Text(title)
          .font(WidgetNativeTheme.Typography.rowTitle)
          .lineLimit(1)
          .truncationMode(.tail)
          .multilineTextAlignment(.leading)
          .frame(maxWidth: .infinity, alignment: .leading)
          .layoutPriority(1)

        if hasRight {
          DirectusWidgetSideSlotView(slot: rightSlot, alignment: .trailing)
            .modifier(
              WidgetSideSlotColumnModifier(
                behaviour: WidgetSlotWidthBehaviour.parse(options: rightSlot?.options),
                widthPercent: WidgetSlotWidthBehaviour.widthPercent(options: rightSlot?.options),
                alignment: .trailing,
              ),
            )
        }
      }

      if hasSubtitle {
        Text(subtitle)
          .font(WidgetNativeTheme.Typography.rowSubtitle)
          .foregroundStyle(WidgetNativeTheme.Colors.secondaryForeground)
          .lineLimit(1)
          .frame(maxWidth: .infinity, alignment: .leading)
          .layoutPriority(1) // Full width under the title row; no slot layout options.
      }
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

struct LatestItemsWidgetView: View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    let hPad: CGFloat = 0
    let topPad: CGFloat = 0
    let bottomPad: CGFloat = 0

    return GeometryReader { _ in
      let usesSubtitle = entry.items.contains { $0.slotValue(for: "subtitle") != nil }
      let maxRows: Int = {
        switch family {
        case .systemLarge:
          return usesSubtitle ? 6 : 9
        default:
          return usesSubtitle ? 2 : 3
        }
      }()

      VStack(alignment: .leading, spacing: 0) {
        HStack(alignment: .center, spacing: 8) {
          if let data = entry.faviconImageData, let uiImage = UIImage(data: data) {
            Image(uiImage: uiImage)
              .resizable()
              .scaledToFit()
              .frame(width: 16, height: 16)
              .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
          }

          Text(entry.configTitle)
            .font(WidgetNativeTheme.Typography.widgetHeaderTitle)
            .lineLimit(1)

          Spacer(minLength: 0)
        }
        .padding(.vertical, 4)

        if !entry.items.isEmpty {
          Divider().opacity(0.5)
          VStack(alignment: .leading, spacing: 0) {
            let visible = Array(entry.items.prefix(maxRows))
            ForEach(Array(visible.enumerated()), id: \.element.id) { idx, it in
              SlotRowView(item: it, family: family)
                .padding(.vertical, family == .systemLarge ? 6 : 3)
              if idx < visible.count - 1 { Divider() }
            }
          }
          .padding(.top, 10)
        } else {
          Text(entry.statusMessage ?? "Open the app to refresh")
            .font(WidgetNativeTheme.Typography.statusMessage)
            .foregroundStyle(WidgetNativeTheme.Colors.secondaryForeground)
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
