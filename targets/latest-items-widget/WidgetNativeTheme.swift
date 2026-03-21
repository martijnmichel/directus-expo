import SwiftUI

/// Visual tokens for this widget extension target (fonts, colors, spacing).
/// Add new widgets under `targets/latest-items-widget/` and reuse this theme.
enum WidgetNativeTheme {

  enum Typography {
    /// Widget chrome: title next to favicon.
    static let widgetHeaderTitle: Font = .headline

    /// Item row primary line (title slot).
    static let rowTitle: Font = .callout.weight(.semibold)

    /// Item row secondary line (subtitle slot).
    static let rowSubtitle: Font = .footnote

    /// Empty / status message under the list.
    static let statusMessage: Font = .caption

    /// Side slots (thumbnail placeholder, status pill, short text).
    static let sideSlot: Font = .caption2
  }

  enum Colors {
    /// Muted body / secondary lines.
    static let secondaryForeground: Color = .secondary

    /// Favicon placeholder when no image.
    static let chromeMutedFill: Color = .secondary.opacity(0.15)

    /// Thumbnail slot loading / empty state.
    static let thumbnailPlaceholderFill: Color = .secondary.opacity(0.2)
  }

  enum Layout {
    /// Vertical spacing between title and subtitle within a row.
    static let rowLineSpacing: CGFloat = 2
  }
}
