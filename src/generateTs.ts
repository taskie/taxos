// import * as prettier from "prettier";

import objectToFormDataTs from "@/assets/objectToFormData.ts.txt";
import apiContextTemplate from "@/assets/apiContext.ts.hbs";
import definitionTemplate from "@/assets/definition.ts.hbs";
import pathTemplate from "@/assets/path.ts.hbs";
import { ConvertedDefinition, ConvertedPath, Swagger } from "./swaggerTypes";

const formatTs = (s: string): string => s; // prettier.format(s, { parser: "typescript", printWidth: 120 });

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
