import fs from 'node:fs';
import {
  type Arguments,
  type ArgumentsCamelCase,
  type Argv,
  type CommandModule,
} from 'yargs';
import { type Manifest, readManifestSync } from '../next-build/manifest';
import { generateMappingsFromManifest } from './generate-lambda-mappings';

type GenMappingsArgs = {
  manifestPath: string;
  outputPath: string;
  lambdaGroupName: string;
  buildId: string;
};

export const genMappingsModule: CommandModule<
  GenMappingsArgs,
  GenMappingsArgs
> = {
  command: 'generate-lambda-mappings',

  describe:
    'Generate json mapping file that is passed to terraform deployment code',

  builder: (argv: Argv<GenMappingsArgs>) =>
    argv
      .option('manifestPath', {
        alias: 'm',
        type: 'string',
        description:
          "Path to nextjs page manifest, as output by 'next build' in serverless mode",
        default: '.next/serverless/pages-manifest.json',
      })
      .option('outputPath', {
        alias: 'o',
        type: 'string',
        description:
          'The path where a json file will be written with ther generated mappings',
        default: 'lambda-mappings.json',
      })
      .option('buildId', {
        alias: 'b',
        type: 'string',
        description: 'The buildId to use for _next/data urls',
        default: '',
      })
      .option('lambdaGroupName', {
        alias: 'l',
        type: 'string',
        description:
          'The name of the lambda group to be mapped to in terraform',
        default: 'lambda_function_group',
      }) as Argv<GenMappingsArgs>,

  handler(argv: ArgumentsCamelCase<GenMappingsArgs>) {
    const manifest: Manifest = readManifestSync(argv.manifestPath);

    const lambdaGroup: string = argv.lambdaGroupName;

    const mappings = generateMappingsFromManifest(
      manifest,
      lambdaGroup,
      argv.buildId
    );

    fs.writeFileSync(argv.outputPath, JSON.stringify(mappings, null, 2), {
      encoding: 'utf8',
    });
  },
};
