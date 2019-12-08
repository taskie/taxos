// see: https://swagger.io/specification

export type Dictionary<T> = { [k: string]: T };

export type OpenAPI<X = {}> = {
  openapi: string;
  info: Info<X>;
  servers?: Server<X>[];
  paths: Paths<X>;
  components?: Components<X>;
  security?: SecurityRequirement<X>;
  tags?: Tag<X>;
  externalDocs?: ExternalDocumentation<X>;
} & (X extends { openAPI: infer T } ? T : {});

export type Info<X = {}> = {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact<X>;
  license?: License<X>;
  version: string;
} & (X extends { info: infer T } ? T : {});

export type Contact<X = {}> = {
  name?: string;
  url?: string;
  email?: string;
} & (X extends { contact: infer T } ? T : {});

export type License<X = {}> = {
  name: string;
  url?: string;
} & (X extends { license: infer T } ? T : {});

export type Server<X = {}> = {
  url: string;
  description?: string;
  variables: Dictionary<ServerVariable<X>>;
} & (X extends { server: infer T } ? T : {});

export type ServerVariable<X = {}> = {
  enum?: string[];
  default: string;
  description?: string;
} & (X extends { serverVariable: infer T } ? T : {});

export type Components<X = {}> = {
  schemas?: Dictionary<Schema<X> | Reference>;
  responses?: Dictionary<Response<X> | Reference>;
  parameters?: Dictionary<Parameter<X> | Reference>;
  examples?: Dictionary<Example<X> | Reference>;
  requestBodies?: Dictionary<RequestBody<X> | Reference>;
  header?: Dictionary<Header<X> | Reference>;
  securitySchemes?: Dictionary<SecurityScheme<X> | Reference>;
  links?: Dictionary<Link<X> | Reference>;
  callbacks?: Dictionary<Callback<X> | Reference>;
} & (X extends { components: infer T } ? T : {});

export type Paths<X = {}> = Dictionary<PathItem<X>> & (X extends { paths: infer T } ? T : {});

export type PathItem<X = {}> = {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation<X>;
  put?: Operation<X>;
  post?: Operation<X>;
  delete?: Operation<X>;
  options?: Operation<X>;
  head?: Operation<X>;
  patch?: Operation<X>;
  trace?: Operation<X>;
  servers?: Server<X>[];
  parameters: (Parameter<X> | Reference)[];
} & (X extends { pathItem: infer T } ? T : {});

export type Operation<X = {}> = {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation<X>;
  operationId?: string;
  parameters?: (Parameter<X> | Reference)[];
  requestBody?: RequestBody<X> | Reference;
  responses: Responses<X>;
  callbacks?: Dictionary<Callback<X> | Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement<X>[];
  servers?: Server<X>[];
} & (X extends { operation: infer T } ? T : {});

export type ExternalDocumentation<X = {}> = {
  description?: string;
  url: string;
} & (X extends { externalDocumentation: infer T } ? T : {});

export type Style = "matrix" | "label" | "form" | "simple" | "spaceDelimited" | "pipeDelimited" | "deepObject";

export type Parameter<X = {}> = {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;

  style?: Style;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema<X> | Reference;
  example?: unknown;
  examples?: Dictionary<Example<X> | Reference>;

  content?: Dictionary<MediaType<X>>;
} & (X extends { parameter: infer T } ? T : {});

export type RequestBody<X = {}> = {
  description?: string;
  content?: Dictionary<MediaType<X>>;
  required?: boolean;
} & (X extends { requestBody: infer T } ? T : {});

export type MediaType<X = {}> = {
  schema?: Schema<X> | Reference;
  example?: unknown;
  examples?: Dictionary<Example<X> | Reference>;
  encoding?: Dictionary<Encoding<X>>;
} & (X extends { mediaType: infer T } ? T : {});

export type Encoding<X = {}> = {
  contentType?: string;
  headers?: Dictionary<Header<X> | Reference>;
  style?: Style;
  explode?: boolean;
  allowReserved?: boolean;
} & (X extends { encoding: infer T } ? T : {});

export type Responses<X = {}> = {
  default?: Response<X> | Reference;
} & Dictionary<Response<X> | Reference> &
  (X extends { responses: infer T } ? T : {});

export type Response<X = {}> = {
  description: string;
  headers?: Dictionary<Header<X> | Reference>;
  content?: Dictionary<MediaType<X>>;
  links?: Dictionary<Link<X> | Reference>;
} & (X extends { response: infer T } ? T : {});

export type Callback<X = {}> = Dictionary<PathItem<X>> & (X extends { callback: infer T } ? T : {});

export type Example<X = {}> = {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
} & (X extends { example: infer T } ? T : {});

export type Link<X = {}> = {
  operationRef?: string;
  operationId?: string;
  parameters?: Dictionary<unknown>;
  requestBody?: unknown;
  description?: string;
  server?: Server<X>;
} & (X extends { Link: infer T } ? T : {});

export type Header<X = {}> = Omit<Parameter<X>, "name" | "in"> & (X extends { header: infer T } ? T : {});

export type Tag<X = {}> = {
  name?: string;
  description?: string;
  externalDocs?: ExternalDocumentation<X>;
} & (X extends { tag: infer T } ? T : {});

// not extendable
export type Reference = {
  $ref: string;
};

export type Schema<X = {}> = SchemaBase<X> & SchemaVariant<X>;

type SchemaBase<X> = {
  required?: string[];

  nullable?: boolean;
  discriminator?: Discriminator<X>;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XML<X>;
  externalDocs?: ExternalDocumentation<X>;
  example?: unknown;
  deprecated?: boolean;
} & (X extends { schema: infer T } ? T : {});

// TODO
type SchemaVariant<X> =
  | {
      type: "boolean";
      format?: string;
      default?: boolean;
    }
  | {
      type: "number";
      format?: string;
      default?: number;
    }
  | {
      type: "integer";
      format?: string;
      maximum?: number;
      minimum?: number;
      default?: number;
    }
  | {
      type: "string";
      format?: string;
      enum?: string[];
      maxLength?: number;
      minLength?: number;
      default?: string;
    }
  | {
      type: "array";
      items: Schema<X> | Reference;
      uniqueItems?: boolean;
    }
  | {
      type: "object";
      properties?: Dictionary<Schema<X> | Reference>;
      additionalProperties?: Schema<X> | Reference;
    };

export type Discriminator<X = {}> = {
  propertyName: string;
  mapping?: Dictionary<string>;
} & (X extends { discriminator: infer T } ? T : {});

export type XML<X = {}> = {
  name?: string;
  namespace?: string;
  prefix?: string;
  attibute?: boolean;
} & (X extends { xml: infer T } ? T : {});

export type SecurityScheme<X = {}> = SecuritySchemeBase<X> & SecuritySchemeVariant<X>;

type SecuritySchemeBase<X> = {
  description?: string;
} & (X extends { securityScheme: infer T } ? T : {});

type SecuritySchemeVariant<X> =
  | {
      type: "apiKey";
      name: string;
      in: "query" | "header" | "cookie";
    }
  | {
      type: "http";
      scheme: string;
      bearerFormat?: string;
    }
  | {
      type: "oauth2";
      flows: OAuthFlows<X>;
    }
  | {
      type: "openIdConnect";
      openIdConnectUrl: string;
    };

export type OAuthFlows<X = {}> = {
  implicit?: OAuthFlow<X>;
  password?: OAuthFlow<X>;
  clientCredentials?: OAuthFlow<X>;
  authorizationCode?: OAuthFlow<X>;
} & (X extends { oauthFlows: infer T } ? T : {});

export type OAuthFlow<X = {}> = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Dictionary<string>;
} & (X extends { oauthFlow: infer T } ? T : {});

export type SecurityRequirement<X = {}> = Dictionary<string[]> & (X extends { securityRequirement: infer T } ? T : {});
