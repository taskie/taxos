/** TypeScript + axios のクライアントコードを生成するために swagger.json を分離・加工する */

import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import stringify from "json-stable-stringify";
import { convert } from "../convertJson";

interface Options {
  apiRoot: string;
  apiName: string;
  swaggerPath: string;
  outPathFilter?: string[];
  swaggerOutDir?: string;
  pathParamReplaceValue?: string;
  useApiBasePath?: boolean;
  packageRoot?: string;
}

export default function convertJsonCli(opts: Options) {
  const { apiName, swaggerPath, outPathFilter: opf, swaggerOutDir: swaggerOut } = opts;
  const swaggerOutDir = swaggerOut != null ? swaggerOut : "swagger";
  let outPathFilter: Set<string> | undefined = undefined;
  if (opf != null) {
    outPathFilter = new Set(opf);
  }
  const j = fs.readFileSync(swaggerPath, "utf-8");
  const pathParamReplaceValue = opts.pathParamReplaceValue || "_$1";
  const useApiBasePath = !!opts.useApiBasePath;

  const converted = convert(JSON.parse(j), {
    apiRoot: opts.apiRoot,
    apiName: opts.apiName,
    packageRoot: opts.packageRoot,
  });

  {
    const { baseURL } = converted;
    let apiInfo = { baseURL };
    let dir = path.join(swaggerOutDir, apiName);
    const outPath = path.join(dir, "spec.json");
    console.log(`${swaggerPath} -> ${outPath}`);
    mkdirp.sync(dir);
    fs.writeFileSync(outPath, stringify(apiInfo, { space: 2 }));
  }

  for (let [pathKey, pathValue] of Object.entries(converted.paths)) {
    let fullPath = pathKey;
    if (useApiBasePath && converted.basePath != null) {
      fullPath = path.join(converted.basePath, pathKey);
    }
    fullPath = fullPath.replace(/\{([a-zA-Z0-9\-_]+)\}/g, pathParamReplaceValue);
    let dir = path.join(swaggerOutDir, apiName, "paths", fullPath);
    const outPath = path.join(dir, "spec.json");
    if (outPathFilter != null && !outPathFilter.has(outPath)) {
      continue;
    }
    console.log(`${swaggerPath} -> ${outPath}`);
    mkdirp.sync(dir);
    fs.writeFileSync(outPath, stringify(pathValue, { space: 2 }));
  }

  for (let [defKey, defValue] of Object.entries(converted.definitions)) {
    let definition = path.join(swaggerOutDir, apiName, "definitions", defKey);
    let outPath = path.join(definition, "spec.json");
    if (outPathFilter != null && !outPathFilter.has(outPath)) {
      continue;
    }
    console.log(`${swaggerPath} -> ${outPath}`);
    mkdirp.sync(definition);
    fs.writeFileSync(outPath, stringify(defValue, { space: 2 }));
  }
}
