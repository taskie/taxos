/** 加工済み JSON から TypeScript + axios のクライアントコードを生成する */

import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as glob from "glob";
import { generateDefinitionTs, generatePathTs, generateObjectToFormDataTs, generateApiContextTs } from "@/generateTs";
import { ConvertedAPISpec } from "@/swaggerTypes";

interface Options {
  apiRoot: string;
  apiName: string;
  outPathFilter?: string[];
  swaggerOutDir?: string;
  srcOutDir?: string;
}

function makeHeader(): string {
  return `// Generated by taxos

`;
}

const utilMapperGenerator = (apiName: string, apiSpec: ConvertedAPISpec, src: string, apiRoot: string) => ({
  [path.join(src, apiRoot, "utils", "objectToFormData.ts")]: generateObjectToFormDataTs,
  [path.join(src, apiRoot, apiName, "utils", "apiContext.ts")]: () => generateApiContextTs(apiSpec)
});

export default function generateTsCli(opts: Options) {
  const { apiRoot, apiName, outPathFilter: opf, swaggerOutDir: swaggerOut, srcOutDir: src } = opts;
  let swaggerOutDir = swaggerOut != null ? swaggerOut : "swagger";
  const srcOutDir = src != null ? src : path.join("src");
  let outPathFilter: Set<string> | undefined = undefined;
  if (opf != null) {
    outPathFilter = new Set(opf);
  }
  const apiSpecPath = path.join(swaggerOutDir, apiName, "spec.json");
  const apiSpec = JSON.parse(fs.readFileSync(apiSpecPath, "utf-8"));
  const utilMapper = utilMapperGenerator(apiName, apiSpec, srcOutDir, apiRoot);

  for (let [outPath, generator] of Object.entries(utilMapper)) {
    if (outPathFilter != null && !outPathFilter.has(outPath)) {
      continue;
    }
    console.log("->", outPath);
    const formatted = generator();
    mkdirp.sync(path.dirname(outPath));
    fs.writeFileSync(outPath, makeHeader() + formatted);
  }

  if (swaggerOutDir[swaggerOutDir.length - 1] !== "/") {
    swaggerOutDir += "/";
  }

  const defPaths = glob.sync(path.join(swaggerOutDir, apiName, "definitions", "**", "spec.json"));
  for (let defPath of defPaths) {
    if (defPath.indexOf(swaggerOutDir) !== 0) {
      throw new Error(swaggerOutDir);
    }
    const basePath = path.dirname(path.join(srcOutDir, apiRoot, defPath.slice(swaggerOutDir.length)));
    const outPath = path.join(basePath, "index.d.ts");
    if (outPathFilter != null && !outPathFilter.has(outPath)) {
      continue;
    }
    console.log(defPath, "->", outPath);
    const defSpec = JSON.parse(fs.readFileSync(defPath, "utf-8"));
    const formatted = generateDefinitionTs(defSpec);
    mkdirp.sync(path.dirname(outPath));
    fs.writeFileSync(outPath, makeHeader() + formatted);
  }

  const pathPaths = glob.sync(path.join(swaggerOutDir, apiName, "paths", "**", "spec.json"));
  for (let pathPath of pathPaths) {
    if (pathPath.indexOf(swaggerOutDir) !== 0) {
      throw new Error(swaggerOutDir);
    }
    const basePath = path.dirname(path.join(srcOutDir, apiRoot, pathPath.slice(swaggerOutDir.length)));
    const outPath = path.join(basePath, "index.ts");
    if (outPathFilter != null && !outPathFilter.has(outPath)) {
      continue;
    }
    console.log(pathPath, "->", outPath);
    const pathSpec = JSON.parse(fs.readFileSync(pathPath, "utf-8"));
    const formatted = generatePathTs(pathSpec);
    mkdirp.sync(path.dirname(outPath));
    fs.writeFileSync(outPath, makeHeader() + formatted);
  }
}
