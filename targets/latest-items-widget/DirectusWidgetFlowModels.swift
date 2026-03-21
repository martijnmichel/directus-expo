import Foundation

// MARK: - Flow response (APP_WIDGET_FLOW_VERSION)

/// Scalar values inside per-slot `options` from the flow (booleans, numbers, strings).
enum FlowJsonScalar: Codable, Hashable {
  case bool(Bool)
  case int(Int)
  case double(Double)
  case string(String)

  init(from decoder: Decoder) throws {
    let c = try decoder.singleValueContainer()
    if let b = try? c.decode(Bool.self) {
      self = .bool(b)
      return
    }
    if let i = try? c.decode(Int.self) {
      self = .int(i)
      return
    }
    if let d = try? c.decode(Double.self) {
      self = .double(d)
      return
    }
    self = .string(try c.decode(String.self))
  }

  func encode(to encoder: Encoder) throws {
    var c = encoder.singleValueContainer()
    switch self {
    case .bool(let v): try c.encode(v)
    case .int(let v): try c.encode(v)
    case .double(let v): try c.encode(v)
    case .string(let v): try c.encode(v)
    }
  }
}

struct FlowItemValue: Decodable, Hashable {
  let slot: String
  let type: String?
  let value: String
  /// Per-slot UI options from Directus config (e.g. `widthBehaviour`, `width` for left/right).
  let options: [String: FlowJsonScalar]?

  enum CodingKeys: String, CodingKey {
    case slot, type, value, options
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    slot = (try? c.decode(String.self, forKey: .slot)) ?? ""
    type = try? c.decodeIfPresent(String.self, forKey: .type)
    value = (try? c.decode(String.self, forKey: .value))
      ?? (try? c.decode(Int.self, forKey: .value)).map { String($0) }
      ?? (try? c.decode(Double.self, forKey: .value)).map { String($0) }
      ?? ""
    options = try? c.decodeIfPresent([String: FlowJsonScalar].self, forKey: .options)
  }
}

struct FlowItem: Decodable, Hashable {
  let id: String
  let values: [FlowItemValue]

  enum CodingKeys: String, CodingKey {
    case id, values
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    id = (try? c.decode(String.self, forKey: .id)) ?? (try? c.decode(Int.self, forKey: .id)).map { String($0) } ?? ""
    values = (try? c.decode([FlowItemValue].self, forKey: .values)) ?? []
  }
}

struct FlowDataEntry: Decodable {
  let type: String
  let items: [FlowItem]

  enum CodingKeys: String, CodingKey {
    case type, items
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    type = (try? c.decode(String.self, forKey: .type)) ?? ""
    items = (try? c.decode([FlowItem].self, forKey: .items)) ?? []
  }
}

struct FlowResponse: Decodable {
  let ok: Bool?
  let status: String?
  let version: Int?
  let supports: [String]?
  let data: [FlowDataEntry]?
  let favicon: String?
}

// MARK: - Row view model (slots)

struct SlotItem: Hashable, Identifiable {
  struct SlotValue: Hashable {
    let type: String
    let value: String
    var imageData: Data?
    let options: [String: FlowJsonScalar]?
  }

  let id: String
  let urlString: String?
  let slots: [String: SlotValue]

  func value(for slot: String) -> String {
    let v = slots[slot]?.value ?? ""
    return v.isEmpty ? "–" : v
  }

  func slotValue(for slot: String) -> SlotValue? {
    slots[slot]
  }
}
