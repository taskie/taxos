import * as oas from "./oasTypes";
import { TaxosExt, TaxosTsRefs } from "./oasTaxosTypes";

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
  spec: oas.OpenAPI,
): oas.OpenAPI<TaxosExt> => {
  const mergedCtx = { ...defaultContext, ...ctx };
  const convertPathWithCtx = convertPath(mergedCtx);
  const result: oas.OpenAPI<TaxosExt> = { ...spec, paths: {} };
  for (let [pathKey, pathValue] of Object.entries(spec.paths)) {
    result.paths[pathKey] = convertPathWithCtx(pathValue, pathKey);
  }
  result.components = convertComponents(mergedCtx)(spec.components);
  if (spec.servers != null && spec.servers.length !== 0) {
    result["x-taxos"] = { url: spec.servers[0].url };
  }
  return result;
};

const convertPath = (ctx: ConverterContext) => (path: oas.PathItem, pathKey: string): oas.PathItem<TaxosExt> => {
  const result: oas.PathItem<TaxosExt> = { ...path };
  let tsRefs: TaxosTsRefs = {};
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
    if (newOperation["x-taxos"] != null) {
      Object.assign(tsRefs, newOperation["x-taxos"].tsRefs);
    }
  }
  result["x-taxos"] = { tsRefs };
  return result;
};

function capitalize(s: string): string {
  if (s.length === 0) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}

const allowedMimeTypes = ["application/json", "multipart/form-data", "application/x-www-form-urlencoded"];

const convertOperation = (ctx: ConverterContext) => (pathKey: string) => (
  operation: oas.Operation,
  operationKey: string,
): oas.Operation<TaxosExt> => {
  const convertResponseWithCtx = convertResponse(ctx);
  const findRefsFromPropertyWithCtx = findRefsFromProperty(ctx);
  const convertPropertyToTsTypeWithCtx = convertPropertyToTsType(ctx);
  const capitalizedOperationId = capitalize(operation.operationId);
  const capitalizedMethod = capitalize(operationKey);
  const methodSafe = operationKey === "delete" ? "delete_" : operationKey;
  const responses: oas.Dictionary<oas.Response<TaxosExt>> = {};
  const tsRefs: TaxosTsRefs = {
    apiContext: `${ctx.packageRoot}/${ctx.apiRoot}/${ctx.apiName}/utils/apiContext`,
  };
  {
    for (let [respKey, respValue] of Object.entries(operation.responses)) {
      responses[respKey] = convertResponseWithCtx(respValue, respKey);
      if (responses[respKey].content == null) {
        continue;
      }
      for (let mimeType of allowedMimeTypes) {
        const content = responses[respKey].content[mimeType];
        if (content != null && content.schema != null) {
          Object.assign(tsRefs, findRefsFromPropertyWithCtx(content.schema));
          break;
        }
      }
    }
  }

  const parameters: oas.Parameter<TaxosExt>[] = [];
  const exists = { path: false, query: false, body: false, formData: false };

  let data: oas.Parameter & { required: boolean; tsType: string } | undefined = undefined;
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
  if (operation.requestBody != null && operation.requestBody.content != null) {
    for (let mimeType of allowedMimeTypes) {
      const content = operation.requestBody.content[mimeType];
      if (content != null && content.schema != null) {
        if ("type" in content.schema && content.schema.type === "object") {
          //content.schema.
          //Object.assign(tsRefs, findRefsFromPropertyWithCtx(content.schema));
        }
        break;
      }
    }
  }
  const structuredParameters: oas.Dictionary<oas.Parameter<TaxosExt>[]> = {};
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

  const result: oas.Operation<TaxosExt> = { ...operation, responses, parameters };
  result["x-taxos"] = {
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

const convertResponse = (ctx: ConverterContext) => (resp: oas.Response, respKey: string): oas.Response<TaxosExt> => {
  let tsType: string | undefined = undefined;
  if (resp.content != null) {
    for (let [mimeType, content] of Object.entries(resp.content)) {
      if (mimeType === "application/json" && content.schema != null) {
        tsType = convertPropertyToTsType(ctx)(content.schema);
      }
    }
  }
  const isDefault = respKey === "default";
  return { ...resp, "x-taxos": { tsType, isDefault } };
};

const convertComponents = (ctx: ConverterContext) => (comp: oas.Components): oas.Components<TaxosExt> => {
  const convertSchemaWithCtx = convertSchema(ctx);
  const result: oas.Components<TaxosExt> = { ...comp, schemas: {} };
  for (let [schemaKey, schemaValue] of Object.entries(comp.schemas)) {
    result.schemas[schemaKey] = convertSchemaWithCtx(schemaValue, schemaKey);
  }
  return result;
};

const convertSchema = (ctx: ConverterContext) => (schema: oas.Schema, schemaKey: string): oas.Schema<TaxosExt> => {
  const properties: oas.Dictionary<oas.Property<TaxosExt>> = {};
  const convertPropertyWithCtx = convertProperty(ctx);
  const findRefsFromPropertyWithCtx = findRefsFromProperty(ctx);
  const tsRefs: TaxosTsRefs = {};
  let items: oas.Property<TaxosExt> | undefined = undefined;
  if (schema.items != null) {
    items = convertProperty(ctx)(schema.items);
    Object.assign(tsRefs, findRefsFromPropertyWithCtx(schema.items));
  } else if (schema.properties != null) {
    for (let [propKey, propValue] of Object.entries(schema.properties)) {
      properties[propKey] = convertPropertyWithCtx(propValue);
      Object.assign(tsRefs, findRefsFromPropertyWithCtx(propValue));
    }
  }
  delete tsRefs[schemaKey];
  return {
    ...schema,
    properties,
    items,
    "x-taxos": {
      key: schemaKey,
      tsRefs,
    },
  };
};

const removeComponentsSchemasPath = (s: string) => s.replace(/^#\/components\/schemas\//, "");

const findRefsFromProperty = (ctx: ConverterContext) => {
  const go = (property: oas.Property): oas.Dictionary<string> => {
    const tsRefs: TaxosTsRefs = {};
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

const convertProperty = (ctx: ConverterContext) => (property: oas.Property): oas.Property<TaxosExt> => {
  const tsType = convertPropertyToTsType(ctx)(property);
  return { ...property, "x-taxos": { tsType } };
};

const convertPropertyToTsType = (ctx: ConverterContext) => {
  const go = (property: oas.Property): string => {
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
