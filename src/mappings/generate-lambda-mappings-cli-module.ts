import { Arguments, CommandModule } from "yargs";
import fs from "fs";
import { generateMappingsFromManifest } from "./generate-lambda-mappings";
import { Manifest, readManifestSync } from "../next-build/manifest";

interface GenMappingsArgs extends Arguments {
  manifestPath: string;
  outputPath: string;
  lambdaGroupName: string;
}

export const genMappingsModule: CommandModule<GenMappingsArgs> = {
  command: "generate-lambda-mappings",

  describe:
    "Generate json mapping file that is passed to terraform deployment code",

  builder: (argv) =>
    argv
      .option("manifestPath", {
        alias: "m",
        type: "string",
        description:
          "Path to nextjs page manifest, as output by 'next build' in serverless mode",
        default: ".next/serverless/pages-manifest.json",
      })
      .option("outputPath", {
        alias: "o",
        type: "string",
        description:
          "The path where a json file will be written with ther generated mappings",
        default: "lambda-mappings.json",
      })
      .option("lambdaGroupName", {
        alias: "l",
        type: "string",
        description:
          "The name of the lambda group to be mapped to in terraform",
        default: "lambda_function_group",
      }),

  handler: function handler(argv: GenMappingsArgs) {
    const manifest: Manifest = readManifestSync(argv.manifestPath);

    const lambdaGroup: string = argv.lambdaGroupName;

    const mappings = generateMappingsFromManifest(manifest, lambdaGroup);

    fs.writeFileSync(argv.outputPath, JSON.stringify(mappings, null, 2), {
      encoding: "utf8",
    });
  },
};
