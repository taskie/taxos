import * as commander from "commander";
import * as fs from "fs";

import oasConvertJsonCli from "./oasConvertJsonCli";
import convertJsonCli from "./convertJsonCli";
import generateTsCli from "./generateTsCli";

const program = commander
  .option("-c, --config <value>", "config JSON file", undefined, "taxos.json")
  .parse(process.argv);

let config = {
  oas: false,
  mode: "both",
  apiRoot: "api",
  apiName: "main",
  swaggerPath: "swagger.json",
  outPathFilter: undefined,
  swaggerOutDir: "swagger",
  srcOutDir: "src",
  pathParamReplaceValue: "_$1",
  preferDirectory: true,
  useApiBasePath: false,
  packageRoot: "@",
};

if (program.config != null) {
  const jsonConfig = JSON.parse(fs.readFileSync(program.config, "utf-8"));
  config = { ...config, ...jsonConfig };
}

if (config.oas) {
  oasConvertJsonCli(config);
} else {
  if (config.mode === "json" || config.mode === "both") {
    convertJsonCli(config);
  }

  if (config.mode === "ts" || config.mode === "both") {
    generateTsCli(config);
  }
}
