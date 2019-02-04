import * as handlebars from "handlebars";
import * as prettier from "prettier";

import objectToFormDataTs from "raw-loader!@/assets/objectToFormData.ts.txt";
import apiContextTsHbs from "raw-loader!@/assets/apiContext.ts.hbs";
import definitionTsHbs from "raw-loader!@/assets/definition.ts.hbs";
import pathTsHbs from "raw-loader!@/assets/path.ts.hbs";
import { ConvertedDefinition, ConvertedPath, Swagger } from "./swaggerTypes";

export const apiContextTemplate = handlebars.compile(apiContextTsHbs);
export const definitionTemplate = handlebars.compile(definitionTsHbs);
export const pathTemplate = handlebars.compile(pathTsHbs);

const formatTs = (s: string) => prettier.format(s, { parser: "typescript", printWidth: 120 });

export function generateObjectToFormDataTs(): string {
  const formatted = formatTs(objectToFormDataTs);
  return formatted;
}

export function generateApiContextTs(swagger: Swagger): string {
  const result = apiContextTemplate(swagger);
  const formatted = formatTs(result);
  return formatted;
}

export function generateDefinitionTs(defSpec: ConvertedDefinition): string {
  const result = definitionTemplate(defSpec);
  const formatted = formatTs(result);
  return formatted;
}

export function generatePathTs(pathSpec: ConvertedPath): string {
  const result = pathTemplate(pathSpec);
  const formatted = formatTs(result);
  return formatted;
}
