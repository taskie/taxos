/** TypeScript + axios のクライアントコードを生成するために swagger.json を分離・加工する */

import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import stringify from "json-stable-stringify";
import { context, convert } from "../convertJson";

interface Options {
  apiName: string,
  swaggerPath: string,
  outPathFilter?: string[],
  swaggerOutDir?: string,
}

export default function convertJsonCli(opts: Options) {
  const { apiName, swaggerPath, outPathFilter: opf, swaggerOutDir: swaggerOut } = opts;
  const swaggerOutDir = swaggerOut != null ? swaggerOut : "swagger";
  let outPathFilter: Set<string> | undefined = undefined;
  if (opf != null) {
    outPathFilter = new Set(opf);
  }
  const j = fs.readFileSync(swaggerPath, "utf-8");
  const converted = convert(JSON.parse(j));
  for (let [pathKey, pathValue] of Object.entries(converted.paths)) {
    let fullPath = converted.basePath == null ? pathKey : path.join(converted.basePath, pathKey);
    fullPath = fullPath.replace(/\{([a-zA-Z0-9\-_]+)\}/g, "$$$1");
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
};