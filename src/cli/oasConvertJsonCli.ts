/** TypeScript + axios のクライアントコードを生成するために openapi.json を分離・加工する */

import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import stringify from "json-stable-stringify";
import { convert } from "../oasConvertJson";

interface Options {
  apiRoot: string;
  apiName: string;
  swaggerPath: string;
  outPathFilter?: string[];
  swaggerOutDir?: string;
  pathParamReplaceValue?: string;
  basePath?: string;
  packageRoot?: string;
  swagger2openapiEnabled?: boolean;
}

export default async function convertJsonCli(opts: Options) {
  const { apiName, swaggerPath, outPathFilter: opf, swaggerOutDir: swaggerOut } = opts;
  const swaggerOutDir = swaggerOut != null ? swaggerOut : "swagger";
  let outPathFilter: Set<string> | undefined = undefined;
  if (opf != null) {
    outPathFilter = new Set(opf);
  }
  const j = fs.readFileSync(swaggerPath, "utf-8");
  const pathParamReplaceValue = opts.pathParamReplaceValue || "_$1";
  const basePath = opts.basePath;

  const input = JSON.parse(j);

  const converted = convert({
    apiRoot: opts.apiRoot,
    apiName: opts.apiName,
    packageRoot: opts.packageRoot,
  })(input);

  {
    const dir = path.join(swaggerOutDir, apiName);
    const outPath = path.join(dir, "spec.json");
    console.log(`${swaggerPath} -> ${outPath}`);
    mkdirp.sync(dir);
    fs.writeFileSync(outPath, stringify(converted, { space: 2 }));
  }

  for (const [pathKey, pathValue] of Object.entries(converted.paths)) {
    let fullPath = pathKey;
    if (basePath != null) {
      fullPath = path.join(basePath, pathKey);
    }
    fullPath = fullPath.replace(/\{([a-zA-Z0-9\-_]+)\}/g, pathParamReplaceValue);
    const dir = path.join(swaggerOutDir, apiName, "paths", fullPath);
    const outPath = path.join(dir, "spec.json");
    if (outPathFilter != null && !outPathFilter.has(outPath)) {
      continue;
    }
    console.log(`${swaggerPath} -> ${outPath}`);
    mkdirp.sync(dir);
    fs.writeFileSync(outPath, stringify(pathValue, { space: 2 }));
  }

  if (converted.components != null && converted.components.schemas != null) {
    for (const [defKey, defValue] of Object.entries(converted.components.schemas)) {
      const definition = path.join(swaggerOutDir, apiName, "definitions", defKey);
      const outPath = path.join(definition, "spec.json");
      if (outPathFilter != null && !outPathFilter.has(outPath)) {
        continue;
      }
      console.log(`${swaggerPath} -> ${outPath}`);
      mkdirp.sync(definition);
      fs.writeFileSync(outPath, stringify(defValue, { space: 2 }));
    }
  }
}
