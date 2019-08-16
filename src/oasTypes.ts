export type Dictionary<T> = { [k: string]: T };

export type OASpecification = {
  components: OAComponents;
  info: OAInfo;
  openapi: string;
  paths: Dictionary<OAPath>;
  servers: OAServer[];
};

export type OAComponents = {
  schemas: Dictionary<OASchema>;
};

export type OASchema = {
  description?: string;
  properties: Dictionary<OAProperty>;
  type: "object";
  required?: string[];
};

export type OAPropertyBase = {
  description?: string;
}

export type OAPropertyVariant =
  | {
      type: "boolean";
      format?: string;
    }
  | {
      type: "number";
      format?: string;
    }
  | {
      type: "integer";
      format?: string;
      maximum?: number;
      minimum?: number;
    }
  | {
      type: "string";
      format?: string;
      enum?: string[];
      maxLength?: number;
      minLength?: number;
    }
  | {
      type: "array";
      items: OAProperty;
      uniqueItems?: boolean;
    }
  | {
      type: "object";
      additionalProperties?: OAProperty;
    }
  | {
      $ref: string;
    };

export type OAProperty = OAPropertyBase & OAPropertyVariant;

export type OAInfo = {
  title?: string;
  version?: string;
};

export type OAPath = {
  get?: OAOperation;
  post?: OAOperation;
}

export type OAOperation = {
  description?: string;
  operationId: string;
  requestBody?: {
    content: OAContent
  };
  parameters?: OAParameter[];
  responses: Dictionary<OAResponse>;
  summary?: string;
};

export type OAContent = {
  [k: string]: {
    schema?: OAProperty,
  };
};

export type OAParameter = {
  description?: string;
  in: string;
  name: string;
  required: boolean;
  schema: OAProperty;
};

export type OAResponse = {
  content: OAContent;
  description?: string;
};

export type OAServer = {
  url?: string;
}