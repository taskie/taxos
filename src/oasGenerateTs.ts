import objectToFormDataTs from "@/assets/objectToFormData.ts.txt";
import typesTs from "@/assets/types.ts.txt";
import apiContextTemplate from "@/assets/oasApiContext.ts.hbs";
import definitionTemplate from "@/assets/oasDefinition.ts.hbs";
import pathTemplate from "@/assets/oasPath.ts.hbs";
import * as oas from "./oasTypes";
import { TaxosExt } from "./oasTaxosTypes";

export function generateObjectToFormDataTs(): string {
  return objectToFormDataTs;
}

export function generateTypesTs(): string {
  return typesTs;
}

export function generateApiContextTs(apiSpec: { url: string }): string {
  return apiContextTemplate(apiSpec);
}

export function generateDefinitionTs(schema: oas.Schema<TaxosExt>): string {
  return definitionTemplate(schema);
}

export function generatePathTs(path: oas.PathItem<TaxosExt>): string {
  return pathTemplate(path);
}
