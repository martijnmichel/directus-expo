import WidgetKit
import SwiftUI
import AppIntents

// Keep the @main entrypoint in a minimal file. This avoids SourceKit/Xcode indexer
// issues where large widget implementation files can be misdetected as containing
// top-level code.

@available(iOS 17.0, *)
struct LatestItemsWidgetIOS17: Widget {
  let kind: String = "LatestItemsWidget"

  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: kind,
      intent: LatestItemsWidgetConfigurationIntent.self,
      provider: Provider()
    ) { entry in
      LatestItemsWidgetView(entry: entry)
    }
    .configurationDisplayName("Latest Items")
    .description("Shows rows with values from the selected collection in 4 slots: left, title, subtitle, right.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}

@main
@available(iOS 17.0, *)
struct LatestItemsWidgetBundle: WidgetBundle {
  var body: some Widget {
    LatestItemsWidgetIOS17()
  }
}

