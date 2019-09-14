import { Dictionary, OpenAPI, Parameter } from "./oasTypes";

export type TaxosTsRefs = Dictionary<string>;

export type TaxosExt = {
  openAPI: {
    "x-taxos": {
      url?: string;
    };
  };
  schema: {
    "x-taxos": {
      key: string;
      tsRefs: TaxosTsRefs;
    }
  };
  pathItem: {
    "x-taxos": {
      tsRefs: TaxosTsRefs;
    }
  };
  operation: {
    "x-taxos": {
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
      structuredParameters: Dictionary<Parameter<TaxosExt>[]>;
      parameterExists: Dictionary<boolean>;
      tsRefs: TaxosTsRefs;
    }
  };
  response: {
    "x-taxos": {
      tsType?: string;
      isDefault?: boolean;
    };
  };
};
