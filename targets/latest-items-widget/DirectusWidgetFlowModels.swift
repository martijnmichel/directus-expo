import Foundation

// MARK: - Flow response (APP_WIDGET_FLOW_VERSION)

struct FlowItemValue: Decodable, Hashable {
  let slot: String
  let type: String?
  let value: String

  enum CodingKeys: String, CodingKey {
    case slot, type, value
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    slot = (try? c.decode(String.self, forKey: .slot)) ?? ""
    type = try? c.decodeIfPresent(String.self, forKey: .type)
    value = (try? c.decode(String.self, forKey: .value))
      ?? (try? c.decode(Int.self, forKey: .value)).map { String($0) }
      ?? (try? c.decode(Double.self, forKey: .value)).map { String($0) }
      ?? ""
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
