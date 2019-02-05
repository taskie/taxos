import objectToFormDataTs from "@/assets/objectToFormData.ts.txt";
import apiContextTemplate from "@/assets/apiContext.ts.hbs";
import definitionTemplate from "@/assets/definition.ts.hbs";
import pathTemplate from "@/assets/path.ts.hbs";
import { ConvertedDefinition, ConvertedPath, ConvertedAPISpec } from "./swaggerTypes";

export function generateObjectToFormDataTs(): string {
  return objectToFormDataTs;
}

export function generateApiContextTs(apiSpec: ConvertedAPISpec): string {
  return apiContextTemplate(apiSpec);
}

export function generateDefinitionTs(defSpec: ConvertedDefinition): string {
  return definitionTemplate(defSpec);
}

export function generatePathTs(pathSpec: ConvertedPath): string {
  return pathTemplate(pathSpec);
}
