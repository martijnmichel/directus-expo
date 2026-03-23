import SwiftUI

// Pairs with `constants/widget.ts` (`widthBehaviour` + `width`) and Android `DirectusWidgetSlotColumnLayout`.

enum WidgetSlotWidthBehaviour: String {
  case fit
  case fixed

  static func parse(options: [String: FlowJsonScalar]?) -> Self {
    guard let options else { return .fit }
    if case .string(let raw) = options["widthBehaviour"] {
      let s = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      if s == "stretch" { return .fixed }
      if let b = Self(rawValue: s) { return b }
    }
    // Legacy `stretch: true` or removed "stretch" behaviour → fixed % width
    if case .bool(let on) = options["stretch"], on { return .fixed }
    return .fit
  }

  static func widthPercent(options: [String: FlowJsonScalar]?) -> CGFloat {
    let raw: CGFloat
    switch options?["width"] {
    case .int(let i): raw = CGFloat(i)
    case .double(let d): raw = CGFloat(d)
    case .string(let s):
      raw = CGFloat(Double(s.trimmingCharacters(in: .whitespacesAndNewlines)) ?? 24)
    default: raw = 24
    }
    return min(100, max(0, raw))
  }
}

struct WidgetSideSlotColumnModifier: ViewModifier {
  let behaviour: WidgetSlotWidthBehaviour
  let widthPercent: CGFloat
  let alignment: Alignment

  func body(content: Content) -> some View {
    switch behaviour {
    case .fixed:
      content
        .containerRelativeFrame(.horizontal, alignment: alignment) { len, _ in
          len * (widthPercent / 100)
        }
    case .fit:
      content
        .fixedSize(horizontal: true, vertical: false)
        .frame(maxWidth: 160, alignment: alignment)
        .layoutPriority(0)
    }
  }
}
