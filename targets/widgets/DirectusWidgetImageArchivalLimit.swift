import Foundation
import UIKit

/// WidgetKit rejects widget snapshots when any `Image` decodes to a bitmap over a system limit
/// (Console: `Widget archival failed due to image being too large`, max total area ~877_852 px).
enum DirectusWidgetImageArchivalLimit {
  /// Slightly under the observed limit to allow rounding / internal bookkeeping.
  static let maxDecodedPixelArea: CGFloat = 877_000

  /// Returns input if already under the limit; otherwise re-encodes as PNG at a smaller size.
  static func pngDataFittingArchivalLimit(_ data: Data) -> Data? {
    guard let image = UIImage(data: data), let cg = image.cgImage else { return nil }
    let w = CGFloat(cg.width)
    let h = CGFloat(cg.height)
    let area = w * h
    if area <= maxDecodedPixelArea { return data }

    let scale = sqrt(maxDecodedPixelArea / area)
    let newW = max(1, Int(floor(w * scale)))
    let newH = max(1, Int(floor(h * scale)))

    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1
    let renderer = UIGraphicsImageRenderer(size: CGSize(width: newW, height: newH), format: format)
    let scaled = renderer.image { _ in
      image.draw(in: CGRect(x: 0, y: 0, width: newW, height: newH))
    }
    return scaled.pngData()
  }
}
