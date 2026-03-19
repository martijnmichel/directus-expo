import SwiftUI

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
  @State private var family: WidgetLabFamily = .medium
  @State private var rowSpacing: Double = 6
  @State private var headerGap: Double = 10
  @State private var leftWidth: Double = 48
  @State private var rightWidth: Double = 58
  @State private var useLargeTypography = true

  private let sample: [WidgetLabItem] = [
    .init(id: "1", left: "13:10", title: "Bloomberg Technology", subtitle: "The felonious F12 key", right: "13:10"),
    .init(id: "2", left: "Gisteren", title: "Apple Deutschland", subtitle: "APPLE: Apple Services bereichern das ganz…", right: "Gisteren"),
    .init(id: "3", left: "2 wkn", title: "Third row", subtitle: "Only visible on large", right: "2 wkn"),
    .init(id: "4", left: "4 d", title: "Fourth row", subtitle: "Large family should show this one too", right: "4 d"),
  ]

  private var cardSize: CGSize {
    switch family {
    case .small: return CGSize(width: 220, height: 220)
    case .medium: return CGSize(width: 420, height: 220)
    case .large: return CGSize(width: 420, height: 520)
    }
  }

  private var maxRows: Int {
    switch family {
    case .small, .medium: return 2
    case .large: return 4
    }
  }

  private var titleFont: Font {
    useLargeTypography ? .headline.weight(.semibold) : .subheadline.weight(.semibold)
  }

  private var subtitleFont: Font {
    useLargeTypography ? .subheadline : .caption
  }

  var body: some View {
    VStack(spacing: 12) {
      HStack(spacing: 8) {
        Button("Small") { family = .small }.buttonStyle(.borderedProminent)
          .tint(family == .small ? .blue : .gray.opacity(0.4))
        Button("Medium") { family = .medium }.buttonStyle(.borderedProminent)
          .tint(family == .medium ? .blue : .gray.opacity(0.4))
        Button("Large") { family = .large }.buttonStyle(.borderedProminent)
          .tint(family == .large ? .blue : .gray.opacity(0.4))
      }

      Toggle("Use larger typography", isOn: $useLargeTypography)

      VStack(alignment: .leading, spacing: 8) {
        Text("Row spacing: \(Int(rowSpacing))")
        Slider(value: $rowSpacing, in: 4...14, step: 1)
        Text("Header to rows gap: \(Int(headerGap))")
        Slider(value: $headerGap, in: 2...16, step: 1)
        Text("Left width: \(Int(leftWidth))")
        Slider(value: $leftWidth, in: 24...90, step: 1)
        Text("Right width: \(Int(rightWidth))")
        Slider(value: $rightWidth, in: 24...90, step: 1)
      }

      VStack(alignment: .leading, spacing: 0) {
        HStack(spacing: 8) {
          RoundedRectangle(cornerRadius: 4, style: .continuous)
            .fill(Color.secondary.opacity(0.15))
            .frame(width: family == .small ? 14 : 16, height: family == .small ? 14 : 16)
          Text("Alle")
            .font(family == .small ? .subheadline.weight(.semibold) : .headline)
            .lineLimit(1)
          Spacer(minLength: 0)
        }
        .padding(.vertical, family == .small ? 3 : 4)

        Divider().opacity(0.5)

        VStack(alignment: .leading, spacing: 0) {
          let visible = Array(sample.prefix(maxRows))
          ForEach(Array(visible.enumerated()), id: \.element.id) { idx, it in
            VStack(alignment: .leading, spacing: family == .small ? 1.5 : 2) {
              HStack(alignment: .center, spacing: rowSpacing) {
                Text(it.left)
                  .font(.caption2)
                  .foregroundStyle(.secondary)
                  .lineLimit(1)
                  .frame(width: leftWidth, alignment: .leading)
                Text(it.title)
                  .font(titleFont)
                  .lineLimit(1)
                  .frame(maxWidth: .infinity, alignment: .leading)
                Text(it.right)
                  .font(.caption2)
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
      .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color(.systemBackground)))
      .frame(width: cardSize.width, height: cardSize.height)
    }
    .padding()
  }
}

#if DEBUG
#Preview {
  LatestItemsWidgetLabView()
}
#endif

