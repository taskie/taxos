export interface Dictionary<T> {
  [key: string]: T;
}

/** swagger.json の型 */
export interface Swagger {
  swagger: string;
  info: Info;
  basePath: string;
  paths: Dictionary<Path>;
  definitions: Dictionary<Definition>;
}

export interface ConvertedSwagger {
  swagger: string;
  info: Info;
  basePath: string;
  paths: Dictionary<ConvertedPath>;
  definitions: Dictionary<ConvertedDefinition>;
}

interface Info {
  version: string;
  title: string;
}

export type Path = Dictionary<Operation>;

export interface ConvertedPath {
  operations: Dictionary<ConvertedOperation>;
  key: string;
  basePath?: string;
  tsRefs: Dictionary<string>;
}

export interface Operation {
  operationId: string;
  consumes: string[];
  produces: string[];
  responses: Dictionary<Response>;
  parameters: Parameter[];
}

export type ConvertedOperation = Operation & {
  pathCode: string;
  dataCode: string;
  configCode?: string;
  method: string;
  methodSafe: string;
  capitalizedOperationId: string;
  capitalizedMethod: string;
  canSendRequestBody: boolean;
  data?: {
    required: boolean;
    tsType: string;
  };
  responses: Dictionary<ConvertedResponse>;
  parameters: ConvertedParameter[];
  structuredParameters: Dictionary<ConvertedParameter[]>;
  parameterExists: Dictionary<boolean>;
  tsRefs: Dictionary<string>;
};

export interface Response {
  schema: Property;
}

export type ConvertedResponse = Response & {
  default: boolean;
  tsType: string;
};

type Parameter = Property & {
  in: string;
  name: string;
  required: boolean;
  schema: Property;
  type: string;
  format?: string;
  collectionFormat?: string;
};

export type ConvertedParameter = Parameter & {
  tsType: string;
};

export interface Definition {
  properties: Dictionary<Property>;
}

export type ConvertedDefinition = Definition & {
  key: string;
  tsRefs: Dictionary<string>;
  properties: Dictionary<ConvertedProperty>;
};

export type Property =
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
    }
  | {
      type: "string";
      format?: string;
      enum: string[];
    }
  | {
      type: "array";
      items: Property;
    }
  | {
      type: "object";
      additionalProperties: Property;
    }
  | {
      $ref: string;
    };

export type ConvertedProperty = Property & {
  tsType: string;
};
