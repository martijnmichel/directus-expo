import SwiftUI

// Pair: Android `DirectusWidgetSlotRemoteViews.renderSlot(..., transformSlotTypes: true)` for left/right.
// Title/subtitle use `renderSlot(..., transformSlotTypes: false)` (= displayText only).

/// Whether a slot should reserve space in the row (non-empty trimmed value).
enum DirectusWidgetSideSlot {
  static func hasContent(_ slot: SlotItem.SlotValue?) -> Bool {
    guard let slot else { return false }
    return !slot.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }
}

/// Side column: thumbnail, status capsule, or secondary text (`DirectusWidgetSlotDisplay`).
struct DirectusWidgetSideSlotView: View {
  let slot: SlotItem.SlotValue?
  let maxWidth: CGFloat
  let alignment: Alignment

  var body: some View {
    let type = (slot?.type ?? "string").lowercased()
    let raw = slot?.value ?? ""

    if type == "thumbnail" {
      let uiImage: UIImage? = slot?.imageData.flatMap { UIImage(data: $0) }
      if let uiImage {
        Image(uiImage: uiImage)
          .resizable()
          .scaledToFill()
          .frame(width: 24, height: 24)
          .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
      } else {
        RoundedRectangle(cornerRadius: 4, style: .continuous)
          .fill(WidgetNativeTheme.Colors.thumbnailPlaceholderFill)
          .frame(width: 24, height: 24)
      }
    } else if type == "status", !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      Text(raw)
        .font(WidgetNativeTheme.Typography.sideSlot)
        .lineLimit(1)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .foregroundStyle(DirectusWidgetSlotDisplay.statusForeground(for: raw))
        .background(Capsule(style: .continuous).fill(DirectusWidgetSlotDisplay.statusBackground(for: raw)))
        .fixedSize()
        .frame(maxWidth: maxWidth, alignment: alignment)
    } else {
      Text(DirectusWidgetSlotDisplay.text(for: slot))
        .font(WidgetNativeTheme.Typography.sideSlot)
        .foregroundStyle(WidgetNativeTheme.Colors.secondaryForeground)
        .lineLimit(1)
        .fixedSize()
        .frame(maxWidth: maxWidth, alignment: alignment)
    }
  }
}
