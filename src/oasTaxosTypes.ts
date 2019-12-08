import { Dictionary, Parameter, MediaType } from "./oasTypes";

export type TaxosTsRefs = Dictionary<string>;

export type TaxosExt = {
  openAPI: {
    "x-taxos"?: {
      url?: string;
    };
  };
  schema: {
    "x-taxos"?: {
      key?: string;
      tsType: string;
      tsRefs?: TaxosTsRefs;
      tsProperties?: Dictionary<{ name: string; tsType: string }>;
    };
  };
  pathItem: {
    "x-taxos"?: {
      tsRefs: TaxosTsRefs;
    };
  };
  operation: {
    "x-taxos"?: {
      pathCode: string;
      pathKey: string;
      dataCode: string;
      configCode?: string;
      method: string;
      methodSafe: string;
      capitalizedOperationId: string;
      capitalizedMethod: string;
      canSendRequestBody: boolean;
      requestData?: MediaType<TaxosExt>;
      structuredParameters: Dictionary<Parameter<TaxosExt>[]>;
      parameterExists: Dictionary<boolean>;
      tsRefs: TaxosTsRefs;
    };
  };
  parameter: {
    "x-taxos"?: {
      tsType: string;
      tsRefs: TaxosTsRefs;
    };
  };
  requestBody: {
    "x-taxos"?: {
      tsRefs: TaxosTsRefs;
    };
  };
  mediaType: {
    "x-taxos"?: {
      tsType: string;
      tsRefs: TaxosTsRefs;
    };
  };
  response: {
    "x-taxos"?: {
      tsRefs: TaxosTsRefs;
      isDefault?: boolean;
    };
  };
};
