export interface CoreSchemaDocument {
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
