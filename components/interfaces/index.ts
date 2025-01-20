import { ReadFieldOutput } from "@directus/sdk";
import { CoreSchema } from "@directus/sdk";
import { ReactNode } from "react";
import { TextInputProps } from "react-native";

// Interface map defining available Directus interfaces and their configurations
export const interfaceMap = {
  input: {
    name: "Input",
    description: "Simple text input field",
    types: ["string", "number"],
    options: {
      placeholder: "string",
      trim: "boolean",
    },
  },

  dropdown: {
    name: "Dropdown",
    description: "Select from predefined options",
    types: ["string"],
    options: {
      choices: "array",
      allowOther: "boolean",
    },
  },

  wysiwyg: {
    name: "WYSIWYG",
    description: "Rich text editor",
    types: ["text"],
    options: {
      toolbar: "array",
      imageUpload: "boolean",
    },
  },

  image: {
    name: "Image",
    description: "Image file upload",
    types: ["string"],
    options: {
      crop: "boolean",
      folder: "string",
    },
  },

  datetime: {
    name: "DateTime",
    description: "Date and time picker",
    types: ["timestamp", "dateTime"],
    options: {
      format: "string",
      includeSeconds: "boolean",
    },
  },

  // M2O/O2M relationship interfaces
  manyToOne: {
    name: "Many to One",
    description: "Relation to single item",
    types: ["integer"],
    options: {
      collection: "string",
      template: "string",
    },
  },

  oneToMany: {
    name: "One to Many",
    description: "Relation to multiple items",
    types: ["json"],
    options: {
      collection: "string",
      template: "string",
    },
  },

  // Text-based interfaces
  textarea: {
    name: "Textarea",
    description: "Multi-line text input",
    types: ["text", "string"],
    options: {
      rows: "integer",
      placeholder: "string",
      trim: "boolean",
    },
  },

  markdown: {
    name: "Markdown",
    description: "Markdown text editor",
    types: ["text"],
    options: {
      previewMode: "boolean",
      customSyntax: "boolean",
    },
  },

  // Selection interfaces
  radio: {
    name: "Radio Buttons",
    description: "Single selection via radio buttons",
    types: ["string", "integer"],
    options: {
      choices: "array",
      layout: "string", // horizontal/vertical
    },
  },

  checkboxes: {
    name: "Checkboxes",
    description: "Multiple selection via checkboxes",
    types: ["json"],
    options: {
      choices: "array",
      layout: "string",
      allowOther: "boolean",
    },
  },

  tags: {
    name: "Tags",
    description: "Multiple text entries",
    types: ["json"],
    options: {
      allowCustom: "boolean",
      presetTags: "array",
    },
  },

  // Number-based interfaces
  slider: {
    name: "Slider",
    description: "Number selection via slider",
    types: ["integer", "float"],
    options: {
      min: "integer",
      max: "integer",
      step: "integer",
    },
  },

  rating: {
    name: "Rating",
    description: "Rating input (e.g., stars)",
    types: ["integer"],
    options: {
      maximum: "integer",
      icon: "string",
    },
  },

  // Special inputs
  color: {
    name: "Color",
    description: "Color picker",
    types: ["string"],
    options: {
      presetColors: "array",
      allowAlpha: "boolean",
    },
  },

  map: {
    name: "Map",
    description: "Geographic location picker",
    types: ["json"],
    options: {
      defaultZoom: "integer",
      defaultCenter: "json",
    },
  },

  // File-based interfaces
  file: {
    name: "File",
    description: "File upload interface",
    types: ["string"],
    options: {
      folder: "string",
      acceptedTypes: "array",
    },
  },

  files: {
    name: "Files",
    description: "Multiple files upload",
    types: ["json"],
    options: {
      folder: "string",
      acceptedTypes: "array",
    },
  },

  // Relational interfaces
  manyToMany: {
    name: "Many to Many",
    description: "Relation to multiple items through junction",
    types: ["json"],
    options: {
      collection: "string",
      template: "string",
      junctionField: "string",
    },
  },

  // Display interfaces
  presentation: {
    name: "Presentation",
    description: "Display-only content",
    types: ["alias"],
    options: {
      content: "string",
      format: "string",
    },
  },

  // Code interfaces
  code: {
    name: "Code",
    description: "Code editor with syntax highlighting",
    types: ["text", "string"],
    options: {
      language: "string",
      lineNumbers: "boolean",
      theme: "string",
    },
  },

  json: {
    name: "JSON",
    description: "JSON data editor",
    types: ["json"],
    options: {
      template: "json",
      validationSchema: "json",
    },
  },

  // Date/Time interfaces
  date: {
    name: "Date",
    description: "Date picker",
    types: ["timestamp", "dateTime", "date"],
    options: {
      format: "string",
      range: "boolean",
    },
  },

  time: {
    name: "Time",
    description: "Time picker",
    types: ["time"],
    options: {
      format: "string",
      includeSeconds: "boolean",
    },
  },
};

// Type map defining core Directus field types
export const typeMap = {
  string: {
    name: "String",
    description: "Text string value",
    dbType: "VARCHAR",
    interfaces: ["input", "dropdown", "image"],
  },

  text: {
    name: "Text",
    description: "Long text content",
    dbType: "TEXT",
    interfaces: ["input", "wysiwyg"],
  },

  integer: {
    name: "Integer",
    description: "Whole number value",
    dbType: "INT",
    interfaces: ["input", "manyToOne"],
  },

  float: {
    name: "Float",
    description: "Decimal number value",
    dbType: "FLOAT",
    interfaces: ["input"],
  },

  timestamp: {
    name: "Timestamp",
    description: "Date and time value",
    dbType: "TIMESTAMP",
    interfaces: ["datetime"],
  },

  dateTime: {
    name: "DateTime",
    description: "Date and time value",
    dbType: "DATETIME",
    interfaces: ["datetime"],
  },

  json: {
    name: "JSON",
    description: "JSON data structure",
    dbType: "JSON",
    interfaces: ["oneToMany"],
  },
};

export type InterfaceProps<T extends any, V extends any> = {
  label?: string;
  error?: string;
  prepend?: ReactNode;
  append?: ReactNode;
  helper?: string;
  iconColor?: string;
  iconSize?: number;
  disabled?: boolean;
  value?: V;
  onChange?: (value: V) => void;
  item?: ReadFieldOutput<CoreSchema>;
} & T;
