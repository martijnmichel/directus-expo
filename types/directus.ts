export interface CoreSchemaDocument extends Record<string, unknown> {
  id: string | number;
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
