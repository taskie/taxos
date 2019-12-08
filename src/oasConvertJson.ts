import * as oas from "./oasTypes";
import { TaxosExt, TaxosTsRefs } from "./oasTaxosTypes";
import { exists } from "fs";

// Context

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
  src: oas.OpenAPI,
): oas.OpenAPI<TaxosExt> => {
  return convertOpenAPI({ ...defaultContext, ...ctx })(src);
};

export const convertOpenAPI = (ctx: ConverterContext) => {
  const toPaths = convertPaths(ctx);
  const toComponents = convertComponents(ctx);
  return (src: oas.OpenAPI): oas.OpenAPI<TaxosExt> => {
    const url = (() => {
      if (src.servers != null && src.servers[0] != null) {
        return src.servers[0].url;
      }
      return undefined;
    })();
    const components = (() => {
      if (src.components != null) {
        return { components: toComponents(src.components) };
      }
      return {};
    })();
    return { ...src, paths: toPaths(src.paths), ...components, "x-taxos": { url } };
  };
};

export const convertPaths = (ctx: ConverterContext) => {
  const toPathItem = convertPathItem(ctx);
  return (src: oas.Paths): oas.Paths<TaxosExt> => {
    const dest: oas.Paths<TaxosExt> = { ...src };
    for (const [k, v] of Object.entries(src)) {
      dest[k] = toPathItem(v, k);
    }
    return dest;
  };
};

export const convertPathItem = (ctx: ConverterContext) => {
  const toOperation = convertOperation(ctx);
  const toTsRefs = extractTsRefs(ctx);
  return (src: oas.PathItem, path: string): oas.PathItem<TaxosExt> => {
    const tsRefs = {};
    const dest: oas.PathItem<TaxosExt> = { ...src, "x-taxos": { tsRefs } };
    const methods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;
    for (const method of methods) {
      const operation = src[method];
      if (operation != null) {
        dest[method] = toOperation(operation, { method, path });
        Object.assign(tsRefs, toTsRefs(dest[method]));
      }
    }
    return dest;
  };
};

export const convertOperation = (ctx: ConverterContext) => {
  const toParameter = refify(convertParameter(ctx));
  const toRequestBody = refify(convertRequestBody(ctx));
  const toTsRefs = extractTsRefs(ctx);
  return (src: oas.Operation, { method, path }: { method: string; path: string }): oas.Operation<TaxosExt> => {
    // prepare children
    const tsRefs = {};
    const dest: oas.Operation<TaxosExt> = { ...src };
    if (src.parameters != null) {
      dest.parameters = src.parameters.map(x => toParameter(x));
      dest.parameters.forEach(v => Object.assign(tsRefs, toTsRefs(v)));
    }
    if (src.requestBody != null) {
      dest.requestBody = toRequestBody(src.requestBody);
      Object.assign(tsRefs, toTsRefs(dest.requestBody));
    }
    dest.responses = convertResponses(ctx)(src.responses);
    Object.values(dest.responses).forEach(v => Object.assign(tsRefs, toTsRefs(v)));
    // parameters
    let pathCode = `"${path}"`;
    const dataCode = dest.requestBody != null ? "params.data" : "undefined";
    let configCode = undefined;
    if (dest.parameters != null) {
      if (dest.parameters.some(v => "in" in v && v.in === "path")) {
        const inner = path.replace(/\{([a-zA-Z0-9\-_]+)\}/g, "$${params.path.$1}");
        pathCode = "`" + inner + "`";
      }
      if (dest.parameters.some(v => "in" in v && v.in === "query")) {
        configCode = `{ params: params.query }`;
      }
    }
    const structuredParameters: { [k: string]: oas.Parameter[] } = {};
    if (dest.parameters != null) {
      for (const parameter of dest.parameters) {
        if ("$ref" in parameter) {
          throw new Error("unsupported");
        }
        if (!(parameter.in in structuredParameters)) {
          structuredParameters[parameter.in] = [];
        }
        structuredParameters[parameter.in].push(parameter);
      }
    }
    // method
    const canSendRequestBody = method === "post" || method === "put" || method === "patch";
    // data
    let requestData = undefined;
    if (dest.requestBody != null) {
      if ("$ref" in dest.requestBody) {
        throw new Error("unsupported");
      }
      if (dest.requestBody.content != null) {
        const content = dest.requestBody.content;
        if ("application/json" in content) {
          requestData = content["application/json"];
        }
      }
    }
    dest["x-taxos"] = {
      // import
      tsRefs,
      // path
      pathKey: path,
      // method
      method,
      capitalizedMethod: capitalize(method),
      methodSafe: method === "delete" ? "_delete" : method,
      canSendRequestBody,
      // parameters
      pathCode,
      dataCode,
      configCode,
      structuredParameters,
      // data
      requestData,
    } as any;
    return dest;
  };
};

export const convertParameter = (ctx: ConverterContext) => {
  const toSchema = refify(convertSchema(ctx));
  const toTsType = convertSchemaOrReferenceToTsType(ctx);
  return (src: oas.Parameter): oas.Parameter<TaxosExt> => {
    const xTaxos = { tsRefs: {}, tsType: "any" };
    const dest: oas.Parameter<TaxosExt> = { ...src, "x-taxos": xTaxos };
    if (src.schema != null) {
      dest.schema = toSchema(src.schema);
      Object.assign(xTaxos, toTsType(dest.schema));
    }
    return dest;
  };
};

export const convertRequestBody = (ctx: ConverterContext) => {
  const toMediaType = dictify(convertMediaType(ctx));
  const toTsRefs = extractTsRefs(ctx);
  return (src: oas.RequestBody): oas.RequestBody<TaxosExt> => {
    const tsRefs = {};
    const dest: oas.RequestBody<TaxosExt> = { ...src, "x-taxos": { tsRefs } };
    if (src.content != null) {
      dest.content = toMediaType(src.content);
      Object.assign(tsRefs, toTsRefs(dest.content));
    }
    return dest;
  };
};

export const convertResponses = (ctx: ConverterContext) => {
  const toResponse = refify(convertResponse(ctx));
  return (src: oas.Responses): oas.Responses<TaxosExt> => {
    const dest: oas.Responses<TaxosExt> = src.default != null ? { default: toResponse(src.default) } : {};
    for (const [k, v] of Object.entries(src)) {
      if (k !== "default") {
        dest[k] = toResponse(v);
      }
    }
    return dest;
  };
};

export const convertResponse = (ctx: ConverterContext) => {
  const toMediaType = convertMediaType(ctx);
  const toContent = dictify(toMediaType);
  const toTsRefs = extractTsRefs(ctx);
  return (src: oas.Response): oas.Response<TaxosExt> => {
    const tsRefs = {};
    const dest: oas.Response<TaxosExt> = { ...src, "x-taxos": { tsRefs } };
    if (src.content != null) {
      dest.content = toContent(src.content);
      for (const v of Object.values(dest.content)) {
        Object.assign(tsRefs, toTsRefs(v));
      }
    }
    return dest;
  };
};

export const convertComponents = (ctx: ConverterContext) => {
  const toSchema = refify(convertSchema(ctx));
  const toResponses = convertResponses(ctx);
  const toParameter = refify(convertParameter(ctx));
  const toParameters = dictify(toParameter);
  const toRequestBody = refify(convertRequestBody(ctx));
  const toRequestBodies = dictify(toRequestBody);
  return (src: oas.Components): oas.Components<TaxosExt> => {
    const dest = { ...src };
    if (src.schemas != null) {
      dest.schemas = {};
      for (const [k, v] of Object.entries(src.schemas)) {
        dest.schemas[k] = toSchema(v, { key: k });
      }
    }
    if (src.responses != null) {
      dest.responses = toResponses(src.responses);
    }
    if (src.parameters != null) {
      dest.parameters = toParameters(src.parameters);
    }
    if (src.requestBodies != null) {
      dest.requestBodies = toRequestBodies(src.requestBodies);
    }
    return dest;
  };
};

export const convertMediaType = (ctx: ConverterContext) => {
  const toSchema = refify(convertSchema(ctx));
  const toTsType = convertSchemaOrReferenceToTsType(ctx);
  return (src: oas.MediaType): oas.MediaType<TaxosExt> => {
    const xTaxos = { tsRefs: {}, tsType: "any" };
    const dest: oas.MediaType<TaxosExt> = { ...src, "x-taxos": xTaxos };
    if (src.schema != null) {
      dest.schema = toSchema(src.schema);
      const tsType = toTsType(dest.schema);
      Object.assign(xTaxos, tsType);
    }
    return dest;
  };
};

export const convertSchema = (ctx: ConverterContext) => {
  const fromSchemaToTsType = convertSchemaOrReferenceToTsType(ctx);
  const toTsType = convertSchemaOrReferenceToTsType(ctx);
  const toTsRefs = extractTsRefs(ctx);
  return (src: oas.Schema, attrs?: { key?: string }): oas.Schema<TaxosExt> => {
    const go = convertSchema(ctx);
    const toSchema = refify(go);
    const dest: oas.Schema<TaxosExt> = { ...src };
    const tsType = fromSchemaToTsType(src);
    const tsRefs: { [k: string]: string } = {};
    let tsProperties: { [k: string]: { name: string; tsType: string } } | undefined = undefined;
    if ("type" in src) {
      switch (src.type) {
        case "array":
          if (dest.type !== "array") {
            throw Error("invalid state");
          }
          dest.items = toSchema(src.items);
          Object.assign(tsRefs, toTsRefs(dest.items));
          break;
        case "object":
          if (dest.type !== "object") {
            throw Error("invalid state");
          }
          if (src.properties != null) {
            dest.properties = dictify(toSchema)(src.properties);
            tsProperties = {};
            for (const [k, property] of Object.entries(dest.properties)) {
              Object.assign(tsRefs, toTsRefs(property));
              tsProperties[k] = {
                name: k,
                tsType: toTsType(property).tsType,
              };
            }
          }
          if (src.additionalProperties != null) {
            dest.additionalProperties = toSchema(src.additionalProperties);
            Object.assign(tsRefs, toTsRefs(dest.additionalProperties));
          }
          break;
        default:
          break;
      }
    }
    dest["x-taxos"] = { ...tsType, tsProperties };
    if (attrs != null && attrs.key != null) {
      dest["x-taxos"].key = attrs.key;
    }
    return dest;
  };
};

export const convertSchemaOrReferenceToTsType = (ctx: ConverterContext) => {
  const toTsRefs = convertReferenceToTsRefs(ctx);
  const go = (schema: oas.Schema | oas.Reference): { tsType: string; tsRefs?: TaxosTsRefs } => {
    if (schema == null) {
      return { tsType: "any" };
    }
    if ("type" in schema) {
      switch (schema.type) {
        case "integer":
          return { tsType: "number" };
        case "array":
          const convertedItems = go(schema.items);
          return { tsType: `(${convertedItems.tsType})[]`, tsRefs: convertedItems.tsRefs };
        case "object":
          const tsRefs: { [k: string]: string } = {};
          if (schema.properties != null) {
            for (const v of Object.values(schema.properties)) {
              Object.assign(tsRefs, go(v).tsRefs);
            }
          }
          if (schema.additionalProperties != null) {
            const convertedProperties = go(schema.additionalProperties);
            Object.assign(tsRefs, convertedProperties.tsRefs);
            return { tsType: `{[k: string]: (${convertedProperties.tsType})}`, tsRefs };
          } else {
            return { tsType: `{[k: string]: any}`, tsRefs };
          }
        case "boolean":
        case "number":
        case "string":
          if ("enum" in schema && schema.enum != null) {
            return { tsType: schema.enum.map(s => `"${s}"`).join(" | ") };
          }
          return { tsType: schema.type };
        default:
          return { tsType: "any" };
      }
    } else if (isReference(schema)) {
      const tsType = removeComponentsSchemasPath(schema.$ref);
      return {
        tsType,
        tsRefs: toTsRefs(schema),
      };
    }
    return { tsType: "any" };
  };
  return go;
};

const refify = <T, U, R>(f: (x: T, y?: U) => R) => (src: T | oas.Reference, attrs?: U): R | oas.Reference => {
  return isReference(src) ? src : f(src, attrs);
};

const dictify = <T, U, R>(f: (x: T) => R) => (src: { [k: string]: T }) => {
  const dest: { [k: string]: R } = {};
  for (const [k, v] of Object.entries(src)) {
    dest[k] = f(v);
  }
  return dest;
};

const isReference = (maybeRefs: any): maybeRefs is oas.Reference =>
  maybeRefs != null && typeof maybeRefs === "object" && "$ref" in maybeRefs;

const removeComponentsSchemasPath = (s: string) => s.replace(/^#\/components\/schemas\//, "");

const convertReferenceToTsRef = (ctx: ConverterContext) => (ref: oas.Reference): string =>
  `${ctx.packageRoot}/${ctx.apiRoot}/${ctx.apiName}/definitions/${removeComponentsSchemasPath(ref.$ref)}`;

const convertReferenceToTsRefs = (ctx: ConverterContext) => (ref: oas.Reference): { [k: string]: string } => ({
  [removeComponentsSchemasPath(ref.$ref)]: convertReferenceToTsRef(ctx)(ref),
});

const extractTsRefs = (ctx: ConverterContext) => {
  const toTsRefs = convertReferenceToTsRefs(ctx);
  return (obj: oas.Reference | { "x-taxos"?: { tsRefs?: { [k: string]: string } } } | undefined) => {
    if (obj == null) {
      return {};
    } else if (isReference(obj)) {
      return toTsRefs(obj);
    } else if (obj["x-taxos"] != null && obj["x-taxos"].tsRefs != null) {
      return obj["x-taxos"].tsRefs;
    }
    return {};
  };
};

function capitalize(s: string): string {
  if (s.length === 0) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}
