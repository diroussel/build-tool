import type yargs from 'yargs';
import type { Arguments } from 'yargs';
import { copyFileWithGulp, type CopyFileOptions } from './copy-files-lib';

export const copyFilesModule: yargs.CommandModule<CopyFileOptions> = {
  command: 'copy-files [files..]',

  describe:
    'Copy all files and folders listed in [files..] to the <outputPath>, with optional exclude glob expressions.',

  builder: (argv) =>
    argv
      .option('files', {
        type: 'array',
        description: 'Path to nextjs serverless build output files',
        required: true,
      })
      .option('outputPath', {
        alias: 'o',
        type: 'string',
        description: 'The directory to copy the files to',
        required: true,
      })
      .option('stripPrefix', {
        alias: 's',
        type: 'boolean',
        description:
          'When set, remove the leading path section of from the target path that matches the input path.',
        default: true,
      })
      .option('exclude', {
        alias: 'e',
        type: 'array',
        description:
          'Glob of which files or folders to exclude.  Can be specified multiple times.',
        default: [],
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enables debug output',
      }),

  handler: async function handler(argv: Arguments<CopyFileOptions>) {
    await copyFileWithGulp(argv);
  },
};
