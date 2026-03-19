import SwiftUI
import WidgetKit

enum WidgetLabFamily {
  case small, medium, large
}

struct WidgetLabItem: Identifiable {
  let id: String
  let left: String
  let title: String
  let subtitle: String
  let right: String
}

struct LatestItemsWidgetLabView: View {
  let family: WidgetLabFamily

  // Style constants - tweak these directly while styling.
  private let rowSpacing: CGFloat = 6
  private let headerGap: CGFloat = 10
  private let leftWidth: CGFloat = 36
  private let rightWidth: CGFloat = 58
  private let titleFont: Font = .headline
  private let subtitleFont: Font = .subheadline

  private let sample: [WidgetLabItem] = [
    .init(id: "1", left: "13:10", title: "Bloomberg Technology", subtitle: "The felonious F12 key", right: "13:10"),
    .init(id: "2", left: "Gisteren", title: "Apple Deutschland", subtitle: "APPLE: Apple Services bereichern das ganz…", right: "Gisteren"),
    .init(id: "3", left: "2 wkn", title: "Third row", subtitle: "Only visible on large", right: "2 wkn"),
    .init(id: "4", left: "4 d", title: "Fourth row something with a very long title which truncates", subtitle: "Large family should show this one too", right: "4 d"),
    .init(id: "5", left: "4 d", title: "Fourth row", subtitle: "Large family should show this one too", right: "4 d"),
    .init(id: "6", left: "4 d", title: "Fourth row", subtitle: "Large family should show this one too", right: "4 d"),
  ]

  private var maxRows: Int {
    switch family {
    case .small, .medium: return 2
    case .large: return 6
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(spacing: 8) {
        RoundedRectangle(cornerRadius: 4, style: .continuous)
          .fill(Color.secondary.opacity(0.15))
          .frame(width: family == .small ? 14 : 16, height: family == .small ? 14 : 16)
        Text("Alle")
          .font(family == .small ? .subheadline.weight(.semibold) : .headline)
          .lineLimit(1)
          
      }
      .padding(.vertical, family == .small ? 3 : 4)

     

      VStack(alignment: .leading, spacing: 0) {
        let visible = Array(sample.prefix(maxRows))
        ForEach(Array(visible.enumerated()), id: \.element.id) { idx, it in
          VStack(alignment: .leading, spacing: family == .small ? 1.5 : 2) {
            HStack(alignment: .center, spacing: rowSpacing) {
              Text(it.left)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .frame(width: leftWidth, alignment: .leading)
              Text(it.title)
                .font(titleFont)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
              Text(it.right)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .frame(width: rightWidth, alignment: .trailing)
            }
            Text(it.subtitle)
              .font(subtitleFont)
              .foregroundStyle(.secondary)
              .lineLimit(1)
              .frame(maxWidth: .infinity, alignment: .leading)
          }
          .padding(.vertical, family == .small ? 2 : 3)
          if idx < visible.count - 1 { Divider() }
        }
      }
      .padding(.top, headerGap)
    }
    .padding(12)
    .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(.background))
  }
}

#if DEBUG
#Preview("Small") {
  LatestItemsWidgetLabView(family: .small)
}

#Preview("Medium") {
  LatestItemsWidgetLabView(family: .medium)
}

#Preview("Large") {
  LatestItemsWidgetLabView(family: .large)
}
#endif

