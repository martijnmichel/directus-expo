export type LatestItemsWidgetConfig = {
  /**
   * Unique id for this widget setup (used for cache key and native widget config).
   */
  id: string;
  /**
   * Directus instance base URL (e.g. "https://api.example.com"). Must match a stored API.
   */
  instanceUrl: string;
  /**
   * Optional display name for this instance (e.g. "Production").
   */
  instanceName?: string;
  /**
   * Directus collection name (e.g. "articles").
   */
  collection: string;
  /**
   * Widget backend id (row in app_widget_config) and flow info.
   * These are optional so existing configs (before install) keep working.
   */
  webhookUrl?: string;
  widgetId?: string;
  /**
   * Widget type. For this screen, always "collection" for now.
   */
  type?: "collection" | string;
  /**
   * Optional label shown in the widget header.
   */
  title?: string;
  /**
   * Query sort, Directus-style (e.g. "-date_created", "-date_updated").
   */
  sort?: string;
  /**
   * Max number of rows to show in the widget.
   */
  limit?: number;
  /**
   * Fields to request from Directus. Keep minimal for widget performance.
   */
  fields?: string[];
  /**
   * Field name used as the primary display string if present.
   */
  displayField?: string;

  /**
   * Per-widget-type config (e.g. latest-items field slots).
   */
  extra?: {
    slots?: Array<{
      key: string;
      label: string;
      field: string;
    }>;
  };
};

/** One column in the widget table (same as datatable header). */
export type LatestItemsWidgetColumn = {
  key: string;
  label: string;
};

/** One row: id for deep link, cells keyed by column key (display strings like DataTableColumn). */
export type LatestItemsWidgetRow = {
  id: string;
  deepLink?: string;
  cells: Record<string, string>;
};

export type LatestItemsWidgetPayload = {
  version: 2;
  title: string;
  collection: string;
  fetchedAt: string;
  columns: LatestItemsWidgetColumn[];
  rows: LatestItemsWidgetRow[];
};

