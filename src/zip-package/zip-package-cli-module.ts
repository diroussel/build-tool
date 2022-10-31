import { Arguments, CommandModule } from 'yargs';
import { zipFiles, ZipArgs } from './zip-package-lib';

export const zipPackageModule: CommandModule<ZipArgs> = {
  command: 'zip-package [files..]',

  describe:
    'Add all files and folders listed in [files..] to the <output> zip, with optional include and exclude regular expressions.',

  builder: (argv) =>
    argv
      .option('files', {
        type: 'array',
        description: 'Path to nextjs serverless build output files',
        required: true,
      })
      .option('outputDir', {
        alias: 'o',
        type: 'string',
        description:
          'The folder to write the zip file(s) to.  Default `dist/<component>`',
      })
      .option('zipFile', {
        alias: 'f',
        type: 'string',
        description: 'The name of the zip file to write to',
      })
      .option('component', {
        alias: 'c',
        type: 'string',
        description: 'The name of component we are packaging',
      })
      .option('manifestPath', {
        alias: 'm',
        type: 'string',
        description:
          "Path to nextjs page manifest, as output by 'next build' in serverless mode",
        default: '.next/serverless/pages-manifest.json',
      })
      .option('componentVersion', {
        alias: 'v',
        type: 'string',
        description: 'The version number of component we are packaging',
      })
      .option('baseDir', {
        alias: 's',
        type: 'string',
        description:
          'When set, paths added to the zip will be relative to this path.',
      })
      .option('exclude', {
        alias: 'e',
        type: 'array',
        description:
          'Glob of which files or folders to exclude.  Can be specified multiple times.',
        default: [],
      })
      .option('addDeployScript', {
        type: 'boolean',
        description: 'Add component/<component>/deploy.sh as deploy.sh',
      })
      .option('generateLambdaHandlers', {
        type: 'boolean',
        description: 'Generate lambda handlers, one for each for next.js page.',
      })
      .option('processNextJsStaticFiles', {
        type: 'boolean',
        description:
          'Strip .html extension off filenames, and move static resources into the "_next" folder',
      })
      .option('lambdaGroupName', {
        alias: 'l',
        type: 'string',
        description:
          'The name of the lambda group to be mapped to in terraform',
        default: 'lambda_function_group',
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enables debug output',
      }),

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  handler: async function handler(argv: Arguments<ZipArgs>) {
    await zipFiles(argv);
  },
};
