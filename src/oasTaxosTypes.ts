import { Dictionary } from "./oasTypes";

export type TaxosTsRefs = Dictionary<string>;

export type TaxosSpecification = {
  components: TaxosComponents;
  info: TaxosInfo;
  openapi: string;
  paths: Dictionary<TaxosPath>;
  servers: TaxosServer[];
  _taxos?: {
    url?: string;
  };
};

export type TaxosComponents = {
  schemas: Dictionary<TaxosSchema>;
  _taxos?: {};
};

export type TaxosSchema = {
  description?: string;
  properties: Dictionary<TaxosProperty>;
  type: "object";
  required?: string[];
  _taxos?: {
    key: string;
    tsRefs: TaxosTsRefs;
  };
};

export type TaxosPropertyBase = {
  description?: string;
};

export type TaxosPropertyVariant =
  | {
      type: "boolean";
      format?: string;
      _taxos?: {};
    }
  | {
      type: "number";
      format?: string;
      _taxos?: {};
    }
  | {
      type: "integer";
      format?: string;
      maximum?: number;
      minimum?: number;
      _taxos?: {};
    }
  | {
      type: "string";
      format?: string;
      enum?: string[];
      maxLength?: number;
      minLength?: number;
      _taxos?: {};
    }
  | {
      type: "array";
      items: TaxosProperty;
      uniqueItems?: boolean;
      _taxos?: {};
    }
  | {
      type: "object";
      additionalProperties?: TaxosProperty;
      _taxos?: {};
    }
  | {
      $ref: string;
      _taxos?: {};
    };

export type TaxosProperty = TaxosPropertyBase & TaxosPropertyVariant;

export type TaxosInfo = {
  title?: string;
  version?: string;
  _taxos?: {};
};

export type TaxosPath = {
  get?: TaxosOperation;
  post?: TaxosOperation;
  _taxos?: {
    tsRefs: TaxosTsRefs;
  };
};

export type TaxosOperation = {
  description?: string;
  operationId: string;
  requestBody?: {
    content: TaxosContent;
  };
  parameters?: TaxosParameter[];
  responses: Dictionary<TaxosResponse>;
  summary?: string;
  _taxos?: {
    pathCode: string;
    pathKey: string;
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
    structuredParameters: Dictionary<TaxosParameter[]>;
    parameterExists: Dictionary<boolean>;
    tsRefs: TaxosTsRefs;
  };
};

export type TaxosContent = {
  [k: string]: {
    schema?: TaxosProperty;
    _taxos?: {};
  };
};

export type TaxosParameter = {
  description?: string;
  in: string;
  name: string;
  required: boolean;
  schema: TaxosProperty;
  _taxos?: {};
};

export type TaxosResponse = {
  content: TaxosContent;
  description?: string;
  _taxos?: {
    tsType?: string;
  };
};

export type TaxosServer = {
  url?: string;
  _taxos?: {};
};
