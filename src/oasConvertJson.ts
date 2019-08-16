import * as oas from "./oasTypes";
import * as taxos from "./oasTaxosTypes";

export type ConverterContext = {
  apiRoot: string;
  apiName: string;
  packageRoot: string;
};

export const defaultContext: ConverterContext = {
  apiRoot: "api",
  apiName: "api",
  packageRoot: "@",
};

export const convert = (ctx: Partial<ConverterContext> = defaultContext) => (
  spec: oas.OASpecification,
): taxos.TaxosSpecification => {
  const mergedCtx = { ...defaultContext, ...ctx };
  const convertPathWithCtx = convertPath(mergedCtx);
  const result: taxos.TaxosSpecification = { ...spec, paths: {} };
  for (let [pathKey, pathValue] of Object.entries(spec.paths)) {
    result.paths[pathKey] = convertPathWithCtx(pathValue, pathKey);
  }
  result.components = convertComponents(mergedCtx)(spec.components);
  if (spec.servers.length !== 0) {
    result._taxos = { url: spec.servers[0].url };
  }
  return result;
};

const convertPath = (ctx: ConverterContext) => (path: oas.OAPath, pathKey: string): taxos.TaxosPath => {
  const result: taxos.TaxosPath = { ...path };
  let tsRefs: taxos.TaxosTsRefs = {};
  const convertOperationWithCtx = convertOperation(ctx)(pathKey);
  for (let [operationKey, operationValue] of Object.entries(path)) {
    if (operationKey !== "get" && operationKey !== "post") {
      continue;
    }
    if (operationValue == null) {
      continue;
    }
    const newOperation = convertOperationWithCtx(operationValue, operationKey);
    result[operationKey] = newOperation;
    if (newOperation._taxos != null) {
      Object.assign(tsRefs, newOperation._taxos.tsRefs);
    }
  }
  result._taxos = { tsRefs };
  return result;
};

function capitalize(s: string): string {
  if (s.length === 0) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}

const convertOperation = (ctx: ConverterContext) => (pathKey: string) => (
  operation: oas.OAOperation,
  operationKey: string,
): taxos.TaxosOperation => {
  const convertResponseWithCtx = convertResponse(ctx);
  const findRefsFromPropertyWithCtx = findRefsFromProperty(ctx);
  const convertPropertyToTsTypeWithCtx = convertPropertyToTsType(ctx);
  const capitalizedOperationId = capitalize(operation.operationId);
  const capitalizedMethod = capitalize(operationKey);
  const methodSafe = operationKey === "delete" ? "delete_" : operationKey;
  const responses: oas.Dictionary<taxos.TaxosResponse> = {};
  const tsRefs: taxos.TaxosTsRefs = {
    apiContext: `${ctx.packageRoot}/${ctx.apiRoot}/${ctx.apiName}/utils/apiContext`,
  };
  {
    for (let [respKey, respValue] of Object.entries(operation.responses)) {
      responses[respKey] = convertResponseWithCtx(respValue, respKey);
      for (let [mimeType, content] of Object.entries(responses[respKey].content)) {
        if (mimeType === "application/json" && content.schema != null) {
          Object.assign(tsRefs, findRefsFromPropertyWithCtx(content.schema));
        }
      }
    }
  }

  const parameters: taxos.TaxosParameter[] = [];
  const exists = { path: false, query: false, body: false, formData: false };

  let data: { required: boolean; tsType: string } | undefined = undefined;
  if (operation.parameters != null) {
    for (let parameter of operation.parameters) {
      (exists as any)[parameter.in] = true;
      if (parameter.in === "body") {
        data = {
          ...parameter,
          tsType: convertPropertyToTsTypeWithCtx(parameter.schema),
          required: parameter.required,
        };
        Object.assign(tsRefs, findRefsFromPropertyWithCtx(parameter.schema));
      } else {
        const paramResult = {
          ...parameter,
          tsType: convertPropertyToTsTypeWithCtx(parameter.schema),
        };
        Object.assign(tsRefs, findRefsFromPropertyWithCtx(parameter.schema));
        parameters.push(paramResult);
      }
    }
  }
  const structuredParameters: oas.Dictionary<taxos.TaxosParameter[]> = {};
  for (let parameter of parameters) {
    structuredParameters[parameter.in] = structuredParameters[parameter.in] || [];
    structuredParameters[parameter.in].push(parameter);
  }

  let pathCode = `"${pathKey}"`;
  if (exists.path) {
    const inner = pathKey.replace(/\{([a-zA-Z0-9\-_]+)\}/g, "$${params.path.$1}");
    pathCode = "`" + inner + "`";
  }
  let dataCode = `undefined`;
  let configCode = undefined;
  if (exists.formData) {
    dataCode = `objectToFormData(params.formData)`;
    Object.assign(tsRefs, { objectToFormData: `${ctx.packageRoot}/${ctx.apiRoot}/utils/objectToFormData` });
  } else if (exists.body) {
    dataCode = `params.data`;
  }
  if (exists.query) {
    configCode = `{ params: params.query }`;
  }
  let canSendRequestBody = operationKey === "post" || operationKey === "put" || operationKey === "patch";

  const result: taxos.TaxosOperation = { ...operation, responses, parameters };
  result._taxos = {
    pathCode,
    pathKey,
    dataCode,
    configCode,
    method: operationKey,
    methodSafe,
    capitalizedOperationId,
    capitalizedMethod,
    structuredParameters,
    parameterExists: exists,
    tsRefs,
    data,
    canSendRequestBody,
  };
  return result;
};

const convertResponse = (ctx: ConverterContext) => (resp: oas.OAResponse, respKey: string): taxos.TaxosResponse => {
  let tsType: string | undefined = undefined;
  for (let [mimeType, content] of Object.entries(resp.content)) {
    if (mimeType === "application/json" && content.schema != null) {
      tsType = convertPropertyToTsType(ctx)(content.schema);
    }
  }
  return { ...resp, _taxos: { tsType } };
};

const convertComponents = (ctx: ConverterContext) => (comp: oas.OAComponents): taxos.TaxosComponents => {
  const convertSchemaWithCtx = convertSchema(ctx);
  const result: taxos.TaxosComponents = { ...comp, schemas: {} };
  for (let [schemaKey, schemaValue] of Object.entries(comp.schemas)) {
    result.schemas[schemaKey] = convertSchemaWithCtx(schemaValue, schemaKey);
  }
  return result;
};

const convertSchema = (ctx: ConverterContext) => (schema: oas.OASchema, schemaKey: string): taxos.TaxosSchema => {
  const properties: oas.Dictionary<taxos.TaxosProperty> = {};
  const convertPropertyWithCtx = convertProperty(ctx);
  const findRefsFromPropertyWithCtx = findRefsFromProperty(ctx);
  const tsRefs: taxos.TaxosTsRefs = {};
  if (schema.properties != null) {
    for (let [propKey, propValue] of Object.entries(schema.properties)) {
      properties[propKey] = convertPropertyWithCtx(propValue);
      Object.assign(tsRefs, findRefsFromPropertyWithCtx(propValue));
    }
  }
  delete tsRefs[schemaKey];
  return {
    ...schema,
    properties,
    _taxos: {
      key: schemaKey,
      tsRefs,
    },
  };
};

const removeComponentsSchemasPath = (s: string) => s.replace(/^#\/components\/schemas\//, "");

const findRefsFromProperty = (ctx: ConverterContext) => {
  const go = (property: oas.OAProperty): oas.Dictionary<string> => {
    const tsRefs: taxos.TaxosTsRefs = {};
    if (property == null) {
      return tsRefs;
    }
    if ("type" in property) {
      switch (property.type) {
        case "array":
          return go(property.items);
        case "object":
          if (property.additionalProperties != null) {
            return go(property.additionalProperties);
          } else {
            return tsRefs;
          }
        default:
          return tsRefs;
      }
    } else if ("$ref" in property) {
      const key = removeComponentsSchemasPath(property.$ref);
      return { [key]: `${ctx.packageRoot}/${ctx.apiRoot}/${ctx.apiName}/definitions/${key}` };
    }
    return tsRefs;
  };
  return go;
};

const convertProperty = (ctx: ConverterContext) => (property: oas.OAProperty): taxos.TaxosProperty => {
  const tsType = convertPropertyToTsType(ctx)(property);
  return { ...property, _taxos: { tsType } };
};

const convertPropertyToTsType = (ctx: ConverterContext) => {
  const go = (property: oas.OAProperty): string => {
    if (property == null) {
      return "any";
    }
    if ("type" in property) {
      switch (property.type) {
        case "integer":
          return "number";
        case "array":
          return `(${go(property.items)})[]`;
        case "object":
          if (property.additionalProperties != null) {
            return `{[k: string]: (${go(property.additionalProperties)})}`;
          } else {
            return `{[k: string]: any}`;
          }
        case "boolean":
        case "number":
        case "string":
          if ("enum" in property && property.enum != null) {
            return property.enum.map(s => `"${s}"`).join(" | ");
          }
          return property.type;
        default:
          return "any";
      }
    } else if ("$ref" in property) {
      return removeComponentsSchemasPath(property.$ref);
    }
    return "any";
  };
  return go;
};
