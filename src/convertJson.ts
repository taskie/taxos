/** TypeScript + axios のクライアントコードを生成するために swagger.json を分離・加工する */

import * as swaggerTypes from "./swaggerTypes";

interface ConverterContext {
  apiRoot: string;
  apiName: string;
  packageRoot: string;
}

export const defaultContext: ConverterContext = {
  apiRoot: "api",
  apiName: "api",
  packageRoot: "@",
};

export function convert(
  o: swaggerTypes.Swagger,
  ctx: Partial<ConverterContext> = defaultContext,
): swaggerTypes.ConvertedSwagger {
  const mergedContext = { ...defaultContext, ...ctx };
  const baseURL = buildBaseURL(o, mergedContext);
  const result: swaggerTypes.ConvertedSwagger = { ...o, baseURL, paths: {}, definitions: {} };
  for (const [pathKey, pathValue] of Object.entries(o.paths)) {
    result.paths[pathKey] = convertPath(pathValue, pathKey, o.basePath, mergedContext);
  }
  for (const [defKey, defValue] of Object.entries(o.definitions)) {
    result.definitions[defKey] = convertDefinition(defValue, defKey, mergedContext);
  }
  return result;
}

function buildBaseURL(o: swaggerTypes.Swagger, ctx: ConverterContext): string {
  const { host, schemes } = o;
  let basePath = o.basePath != null ? o.basePath : "/";
  if (basePath[0] != "/") {
    basePath = "/" + basePath;
  }
  let baseURL = basePath;
  if (host != null) {
    let scheme = "http";
    if (schemes != null && schemes.includes("https")) {
      scheme = "https";
    }
    baseURL = `${scheme}://${host}${basePath}`;
  }
  return baseURL;
}

function convertPath(
  pathValue: swaggerTypes.Path,
  pathKey: string,
  basePath: string | undefined,
  ctx: ConverterContext,
): swaggerTypes.ConvertedPath {
  const pathResult: swaggerTypes.ConvertedPath = {
    key: pathKey,
    basePath,
    operations: {},
    tsRefs: {},
  };
  for (const [epKey, epValue] of Object.entries(pathValue)) {
    const epResult = convertOperation(epValue, epKey, pathKey, ctx);
    pathResult.operations[epKey] = epResult;
    pathResult.tsRefs = { ...pathResult.tsRefs, ...epResult.tsRefs };
  }
  return pathResult;
}

function capitalize(s: string): string {
  if (s.length === 0) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}

function convertOperation(
  epValue: swaggerTypes.Operation,
  epKey: string,
  pathKey: string,
  ctx: ConverterContext,
): swaggerTypes.ConvertedOperation {
  const capitalizedOperationId = capitalize(epValue.operationId);
  const capitalizedMethod = capitalize(epKey);
  const methodSafe = epKey === "delete" ? "delete_" : epKey;
  const responses: swaggerTypes.Dictionary<swaggerTypes.ConvertedResponse> = {};
  let tsRefs: swaggerTypes.Dictionary<string> = {
    apiContext: `${ctx.packageRoot}/${ctx.apiRoot}/${ctx.apiName}/utils/apiContext`,
  };
  for (const [respKey, respValue] of Object.entries(epValue.responses)) {
    responses[respKey] = convertResponse(respValue, respKey, ctx);
    tsRefs = { ...tsRefs, ...findRefsFromProperty(responses[respKey].schema, ctx) };
  }
  const parameters: swaggerTypes.ConvertedParameter[] = [];
  const exists = { path: false, query: false, body: false, formData: false };
  const parameterExists = exists;
  let data: { required: boolean; tsType: string } | undefined = undefined;
  for (const parameter of epValue.parameters) {
    (exists as any)[parameter.in] = true;
    if (parameter.in === "body") {
      data = {
        ...parameter,
        tsType: convertPropertyToTsType(parameter.schema, ctx),
        required: parameter.required,
      };
      tsRefs = { ...tsRefs, ...findRefsFromProperty(parameter.schema, ctx) };
    } else {
      const paramResult = {
        ...parameter,
        tsType: convertPropertyToTsType(parameter, ctx),
      };
      tsRefs = { ...tsRefs, ...findRefsFromProperty(parameter, ctx) };
      parameters.push(paramResult);
    }
  }
  const structuredParameters: swaggerTypes.Dictionary<swaggerTypes.ConvertedParameter[]> = {};
  for (const parameter of parameters) {
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
    tsRefs = { ...tsRefs, objectToFormData: `${ctx.packageRoot}/${ctx.apiRoot}/utils/objectToFormData` };
  } else if (exists.body) {
    dataCode = `params.data`;
  }
  if (exists.query) {
    configCode = `{ params: params.query }`;
  }
  const canSendRequestBody = epKey === "post" || epKey === "put" || epKey === "patch";
  return {
    ...epValue,
    pathCode,
    pathKey,
    dataCode,
    configCode,
    method: epKey,
    methodSafe,
    capitalizedOperationId,
    capitalizedMethod,
    responses,
    parameters,
    structuredParameters,
    parameterExists,
    tsRefs,
    data,
    canSendRequestBody,
  };
}

function convertResponse(
  respValue: swaggerTypes.Response,
  respKey: string,
  ctx: ConverterContext,
): swaggerTypes.ConvertedResponse {
  const tsType = convertPropertyToTsType(respValue.schema, ctx);
  return { ...respValue, tsType, default: respKey === "default" };
}

function convertDefinition(
  definition: swaggerTypes.Definition,
  defKey: string,
  ctx: ConverterContext,
): swaggerTypes.ConvertedDefinition {
  const key = defKey;
  const properties: swaggerTypes.Dictionary<swaggerTypes.ConvertedProperty> = {};
  let tsRefs: swaggerTypes.Dictionary<string> = {};
  if (definition.properties != null) {
    for (const [propKey, propValue] of Object.entries(definition.properties)) {
      properties[propKey] = convertProperty(propValue, ctx);
      tsRefs = {
        ...tsRefs,
        ...findRefsFromProperty(propValue, ctx),
      };
    }
  }
  delete tsRefs[defKey];
  return { ...definition, key, properties, tsRefs };
}

function findRefsFromProperty(property: swaggerTypes.Property, ctx: ConverterContext): swaggerTypes.Dictionary<string> {
  const refs = {};
  if (property == null) {
    return refs;
  }
  if ("type" in property) {
    switch (property.type) {
      case "array":
        return findRefsFromProperty(property.items, ctx);
      case "object":
        return findRefsFromProperty(property.additionalProperties, ctx);
      default:
        return refs;
    }
  } else if ("$ref" in property) {
    const key = property.$ref.replace("#/definitions/", "");
    return { [key]: `${ctx.packageRoot}/${ctx.apiRoot}/${ctx.apiName}/definitions/${key}` };
  }
  return refs;
}

function convertProperty(property: swaggerTypes.Property, ctx: ConverterContext): swaggerTypes.ConvertedProperty {
  const tsType = convertPropertyToTsType(property, ctx);
  return { ...property, tsType };
}

function convertPropertyToTsType(property: swaggerTypes.Property, ctx: ConverterContext): string {
  if (property == null) {
    return "any";
  }
  if ("type" in property) {
    switch (property.type) {
      case "integer":
        return "number";
      case "array":
        return `(${convertPropertyToTsType(property.items, ctx)})[]`;
      case "object":
        return `{[k: string]: (${convertPropertyToTsType(property.additionalProperties, ctx)})}`;
      case "boolean":
      case "number":
      case "string":
        if ("enum" in property) {
          return property.enum.map(s => `"${s}"`).join(" | ");
        }
        return property.type;
      default:
        return "any";
    }
  } else if ("$ref" in property) {
    return property.$ref.replace("#/definitions/", "");
  }
  return "any";
}
