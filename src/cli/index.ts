import * as commander from "commander";
import * as fs from "fs";
import * as path from "path";

import convertJsonCli from "./convertJsonCli";
import generateTsCli from "./generateTsCli";

function collect(val: string, memo: string[]): string[] {
  memo.push(val);
  return memo;
}

const program = commander
  .option("-c, --config [value]", "config JSON file")
  .option("-m, --mode [value]", "mode (json|ts|both)", undefined, "both")
  .option("-n, --apiName [value]", "API name", undefined, "foo")
  .option("-s, --swaggerPath [value]", undefined, "swagger.json")
  .option("-f, --filter [value]", "specify output files", collect, [])
  .option("-S, --swaggerOutDir [value]", "specify JSON output files", undefined, "swagger")
  .option("-r, --srcOutDir [value]", "specify ts src output files", undefined, path.join("src", "api"))
  .parse(process.argv);

const filter = program.filter.length ? program.filter : undefined;

let config = {
  mode: program.mode,
  apiName: program.apiName,
  swaggerPath: program.swaggerPath,
  outPathFilter: filter,
  swaggerOutDir: program.swaggerOutDir,
  srcOutDir: program.srcOutDir
};

if (program.config != null) {
  const jsonConfig = JSON.parse(fs.readFileSync(program.config, "utf-8"));
  config = { ...config, ...jsonConfig };
}

if (config.mode === "json" || config.mode === "both") {
  convertJsonCli(config);
}

if (config.mode === "ts" || config.mode === "both") {
  generateTsCli(config);
}
