import * as commander from "commander"

import convertJsonCli from "./convertJsonCli";
import generateTsCli from "./generateTsCli";

function collect(val: string, memo: string[]) {
  memo.push(val);
  return memo;
}

const program = commander
  .option("-m, --mode [value]", "mode (json|ts|both)", undefined, "both")
  .option("-n, --apiName [value]", "API name", undefined, "api")
  .option("-s, --swaggerPath [value]", undefined, "swagger.json")
  .option("-f, --filter [value]", "specify output files", collect, [])
  .option("-S, --swaggerOutDir [value]", "specify JSON output files", undefined, "swagger")
  .option("-r, --srcOutDir [value]", "specify ts src output files", undefined, "src")
  .parse(process.argv)

console.log(program)
const filter = program.filter.length ? program.filter : undefined;

if (program.mode === "json" || program.mode === "both") {
  convertJsonCli({
    apiName: program.apiName,
    swaggerPath: program.swaggerPath,
    outPathFilter: filter,
    swaggerOutDir: program.swaggerOutDir,
  })
}

if (program.mode === "ts" || program.mode === "both") {
  generateTsCli({
    apiName: program.apiName,
    swaggerPath: program.swaggerPath,
    outPathFilter: filter,
    swaggerOutDir: program.swaggerOutDir,
    srcOutDir: program.srcOutDir,
  })
}
