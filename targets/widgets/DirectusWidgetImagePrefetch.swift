import Foundation
import UIKit

enum DirectusWidgetImagePrefetch {
  static func prefetchThumbnailImages(in items: [SlotItem], instanceUrl: String?) async -> [SlotItem] {
    let normalized = DirectusWidgetUrls.normalizedInstanceURLString(instanceUrl)
    guard let base = normalized, !base.isEmpty else {
      return items
    }

    var tasks: [(itemId: String, slotKey: String, url: URL)] = []
    for item in items {
      for (slotKey, slot) in item.slots where slot.type == "thumbnail" && !slot.value.isEmpty {
        let urlString = DirectusWidgetUrls.assetURLString(
          instanceBase: base,
          fileId: slot.value,
          query: DirectusWidgetConstants.directusAssetRasterQuery
        )
        if let url = URL(string: urlString) {
          tasks.append((item.id, slotKey, url))
        }
      }
    }
    guard !tasks.isEmpty else { return items }

    var fetched: [String: [String: Data]] = [:]
    await withTaskGroup(of: (String, String, Data?).self) { group in
      for task in tasks {
        group.addTask {
          let data = try? await URLSession.shared.data(from: task.url).0
          return (task.itemId, task.slotKey, data)
        }
      }
      for await (itemId, slotKey, data) in group {
        if let data, !data.isEmpty,
           let fitted = DirectusWidgetImageArchivalLimit.pngDataFittingArchivalLimit(data)
        {
          fetched[itemId, default: [:]][slotKey] = fitted
        }
      }
    }

    return items.map { item in
      guard let slotData = fetched[item.id] else { return item }
      var updatedSlots = item.slots
      for (slotKey, data) in slotData {
        if var slot = updatedSlots[slotKey] {
          slot.imageData = data
          updatedSlots[slotKey] = slot
        }
      }
      return SlotItem(id: item.id, urlString: item.urlString, slots: updatedSlots)
    }
  }

  static func prefetchFaviconImage(faviconFileId: String?, instanceUrl: String?, webhookUrl: String?) async -> Data? {
    let base =
      DirectusWidgetUrls.normalizedInstanceURLString(instanceUrl)?
        .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
      ?? DirectusWidgetUrls.instanceBaseURLString(from: webhookUrl)?
        .trimmingCharacters(in: CharacterSet(charactersIn: "/"))

    guard let base, !base.isEmpty else { return nil }

    func rasterData(from url: URL) async -> Data? {
      guard let data = try? await URLSession.shared.data(from: url).0,
            !data.isEmpty,
            let fitted = DirectusWidgetImageArchivalLimit.pngDataFittingArchivalLimit(data)
      else { return nil }
      return fitted
    }

    if let fileId = faviconFileId, !fileId.isEmpty {
      let urlString = DirectusWidgetUrls.assetURLString(
        instanceBase: base,
        fileId: fileId,
        query: DirectusWidgetConstants.directusAssetRasterQuery
      )
      if let url = URL(string: urlString), let data = await rasterData(from: url) {
        return data
      }
    }

    let icoUrl = "\(base)/favicon.ico"
    if let url = URL(string: icoUrl), let data = await rasterData(from: url) {
      return data
    }
    return nil
  }
}
