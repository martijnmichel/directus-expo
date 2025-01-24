export interface CoreSchemaDocument extends Record<string, unknown> {
  [key: string]: any;
}

export type DirectusErrorResponse = {
  errors: {
    message: string;
    extensions: {
      code: string;
      field: string;
    };
  }[];
};
