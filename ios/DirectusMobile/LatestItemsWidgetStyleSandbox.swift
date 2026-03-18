import SwiftUI

// Standalone SwiftUI sandbox for styling the Latest Items widget UI.
// Intentionally does NOT import WidgetKit/AppIntents to avoid preview build loops.

private let slotOrder: [String] = ["left", "title", "subtitle", "right"]

enum LatestItemsPreviewFamily {
  case small
  case medium
  case large
}

struct LatestItemsPreviewItem: Hashable, Identifiable {
  let id: String
  let slots: [String: String]

  func value(for slot: String) -> String {
    let v = slots[slot] ?? ""
    return v.isEmpty ? "–" : v
  }
}

struct LatestItemsPreviewModel: Hashable {
  let title: String
  let items: [LatestItemsPreviewItem]
  let statusMessage: String?
}

struct LatestItemsWidgetCardSandboxView: View {
  let model: LatestItemsPreviewModel
  let family: LatestItemsPreviewFamily

  var body: some View {
    let maxRows: Int = (family == .small) ? 3 : (family == .medium) ? 5 : 8
    let visibleSlots: [String] = {
      switch family {
      case .small:
        return ["title", "subtitle"]
      case .medium:
        return ["left", "title", "right"]
      case .large:
        return slotOrder
      }
    }()

    VStack(alignment: .leading, spacing: 8) {
      Text(model.title)
        .font(.headline)
        .lineLimit(1)

      if !model.items.isEmpty {
        VStack(alignment: .leading, spacing: 4) {
          ForEach(model.items.prefix(maxRows), id: \.id) { it in
            LatestItemsRowSandboxView(item: it, slotKeys: visibleSlots)
          }
        }
      } else {
        Text(model.statusMessage ?? "Open the app to refresh")
          .font(.caption)
          .foregroundStyle(.secondary)
      }

      Spacer(minLength: 0)
    }
    .padding(12)
    .background(
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .fill(Color(.systemBackground))
        .shadow(color: Color.black.opacity(0.08), radius: 16, x: 0, y: 8)
    )
    .padding(16)
    .background(Color(.secondarySystemBackground))
  }
}

private struct LatestItemsRowSandboxView: View {
  let item: LatestItemsPreviewItem
  let slotKeys: [String]

  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 8) {
      ForEach(slotKeys, id: \.self) { key in
        Text(item.value(for: key))
          .font(key == "title" ? .caption : .caption2)
          .lineLimit(1)
          .frame(maxWidth: .infinity, alignment: .leading)
      }
    }
  }
}

#if DEBUG
struct LatestItemsWidgetCardSandboxView_Previews: PreviewProvider {
  static let items: [LatestItemsPreviewItem] = [
    .init(id: "1", slots: ["left": "A-01", "title": "Quarterly report", "subtitle": "Updated 2h ago", "right": "Draft"]),
    .init(id: "2", slots: ["left": "A-02", "title": "Roadmap", "subtitle": "v1.4 scope", "right": "Approved"]),
    .init(id: "3", slots: ["left": "A-03", "title": "Incident postmortem", "subtitle": "SEV-2", "right": "Done"]),
    .init(id: "4", slots: ["left": "A-04", "title": "Release notes", "subtitle": "iOS build", "right": "In review"]),
  ]

  static var previews: some View {
    Group {
      LatestItemsWidgetCardSandboxView(
        model: .init(title: "Latest", items: items, statusMessage: nil),
        family: .small
      )
      .previewDisplayName("Small")
      .frame(width: 220, height: 220)

      LatestItemsWidgetCardSandboxView(
        model: .init(title: "Latest", items: items, statusMessage: nil),
        family: .medium
      )
      .previewDisplayName("Medium")
      .frame(width: 420, height: 220)

      LatestItemsWidgetCardSandboxView(
        model: .init(title: "Latest", items: items, statusMessage: nil),
        family: .large
      )
      .previewDisplayName("Large")
      .frame(width: 420, height: 520)

      LatestItemsWidgetCardSandboxView(
        model: .init(title: "Latest", items: [], statusMessage: "Open the app to refresh"),
        family: .medium
      )
      .previewDisplayName("Empty")
      .frame(width: 420, height: 220)
    }
  }
}
#endif

