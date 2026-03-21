import Foundation
import SwiftUI

/// Plain-text rules for flow slot `type` + `value` (matches Android `DirectusWidgetSlotDisplay`).
enum DirectusWidgetSlotDisplay {
  static func text(for slot: SlotItem.SlotValue?) -> String {
    guard let slot else { return "–" }
    let raw = slot.value.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !raw.isEmpty else { return "–" }

    switch slot.type.lowercased() {
    case "date":
      return formatDateIfPossible(raw)
    case "image", "thumbnail":
      return "·"
    default:
      return raw
    }
  }

  static func formatDateIfPossible(_ raw: String) -> String {
    let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return raw }
    guard trimmed != "–" else { return raw }

    guard let date = parseDateIfPossible(trimmed) else { return raw }

    let now = Date()
    let calendar = Calendar.current
    let dayDiff = calendar.dateComponents([.day], from: date, to: now).day ?? 0

    let hasTimeComponent = trimmed.contains(":")
    if hasTimeComponent && abs(dayDiff) == 0 {
      let df = DateFormatter()
      df.locale = .current
      df.timeStyle = .short
      df.dateStyle = .none
      return df.string(from: date)
    }

    let rdtf = RelativeDateTimeFormatter()
    rdtf.locale = .current
    rdtf.unitsStyle = .full
    return rdtf.localizedString(for: date, relativeTo: now)
  }

  static func parseDateIfPossible(_ s: String) -> Date? {
    let t = s.trimmingCharacters(in: .whitespacesAndNewlines)

    if let intVal = Int64(t), t.count == 10 || t.count == 13 {
      let seconds = t.count == 13 ? Double(intVal) / 1000.0 : Double(intVal)
      return Date(timeIntervalSince1970: seconds)
    }

    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withTimeZone]
    if let d = iso.date(from: t) { return d }

    iso.formatOptions = [.withInternetDateTime, .withTimeZone]
    if let d = iso.date(from: t) { return d }

    let df = DateFormatter()
    df.locale = Locale(identifier: "en_US_POSIX")
    df.timeZone = TimeZone.current

    let formats = [
      "yyyy-MM-dd",
      "yyyy-MM-dd HH:mm",
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm",
      "yyyy-MM-dd'T'HH:mm:ss",
      "yyyy-MM-dd'T'HH:mm:ss.SSS",
    ]

    for f in formats {
      df.dateFormat = f
      if let d = df.date(from: t) { return d }
    }

    return nil
  }

  // MARK: - Status capsule (iOS widget styling)

  static func statusBackground(for value: String) -> Color {
    switch value.lowercased() {
    case "published":
      return Color.green.opacity(0.18)
    case "archived":
      return Color.gray.opacity(0.22)
    case "draft":
      return Color.orange.opacity(0.18)
    default:
      return Color.secondary.opacity(0.16)
    }
  }

  static func statusForeground(for value: String) -> Color {
    switch value.lowercased() {
    case "published":
      return Color.green
    case "archived":
      return Color.secondary
    case "draft":
      return Color.orange
    default:
      return Color.primary
    }
  }
}
