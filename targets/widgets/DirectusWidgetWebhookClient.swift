import Foundation

enum DirectusWidgetWebhookClient {
  static func fetchSlotItemsFromWebhook(config: WidgetConfigEntry) async -> [SlotItem]? {
    guard let baseUrlString = config.webhookUrl,
          let baseUrl = URL(string: baseUrlString) else {
      return nil
    }
    let idToSend = config.widgetId ?? config.id

    var components = URLComponents(url: baseUrl, resolvingAgainstBaseURL: false)
    var queryItems = components?.queryItems ?? []
    queryItems.append(URLQueryItem(name: "widget_id", value: idToSend))
    components?.queryItems = queryItems
    guard let url = components?.url else { return nil }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"

    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let http = response as? HTTPURLResponse,
            (200..<300).contains(http.statusCode) else {
        return nil
      }
      let resp = try JSONDecoder().decode(FlowResponse.self, from: data)
      return DirectusWidgetFlowDecoder.decodeSlotItemsFromFlowResponse(
        resp,
        collection: config.collection,
        sessionId: config.sessionId
      )
    } catch {
      return nil
    }
  }

  static func fetchSlotItemsFromWebhookDetailed(config: WidgetConfigEntry) async -> (
    items: [SlotItem]?,
    errorMessage: String?,
    flowResponse: FlowResponse?
  ) {
    guard let urlString = config.webhookUrl, !urlString.isEmpty else {
      return (nil, "Missing webhook URL. Open the app and re-save this setup.", nil)
    }
    guard let baseUrl = URL(string: urlString) else {
      return (nil, "Invalid webhook URL. Open the app and re-save this setup.", nil)
    }

    let idToSend = config.widgetId ?? config.id

    var components = URLComponents(url: baseUrl, resolvingAgainstBaseURL: false)
    var queryItems = components?.queryItems ?? []
    queryItems.append(URLQueryItem(name: "widget_id", value: idToSend))
    components?.queryItems = queryItems
    guard let url = components?.url else {
      return (nil, "Invalid webhook URL. Open the app and re-save this setup.", nil)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    request.timeoutInterval = 10

    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let http = response as? HTTPURLResponse else {
        return (nil, "No response from server.", nil)
      }
      guard (200..<300).contains(http.statusCode) else {
        return (nil, "Webhook error (HTTP \(http.statusCode)).", nil)
      }
      let resp = try JSONDecoder().decode(FlowResponse.self, from: data)
      let items = DirectusWidgetFlowDecoder.decodeSlotItemsFromFlowResponse(
        resp,
        collection: config.collection,
        sessionId: config.sessionId
      )
      return (items, nil, resp)
    } catch is DecodingError {
      return (nil, "Webhook returned unexpected JSON.", nil)
    } catch {
      return (nil, "Couldn’t refresh (network error).", nil)
    }
  }
}
