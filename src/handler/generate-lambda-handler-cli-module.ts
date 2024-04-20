import { type Arguments, type CommandModule } from 'yargs';
import gulp from 'gulp';
import debug from 'gulp-debug';
import { type Manifest, readManifestSync } from '../next-build/manifest';
import { generateHandlers } from './generate-lambda-handler';

type GenHandlerArgs = {
  manifestPath: string;
  outputPath: string;
  debug: boolean;
} & Arguments;

export const genHandlerModule: CommandModule<GenHandlerArgs> = {
  command: 'generate-lambda-handlers',

  describe:
    'Generate wrapper handler function that uses a handler adaptor to be able to ' +
    'pass AWS lambda events to nextjs serverless handler functions',

  builder: (argv) =>
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
        description: 'The directory to write the generated code files',
        required: true,
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enables debug output',
      }),

  handler: function handler(options: Arguments<GenHandlerArgs>) {
    const outdir = options.outputPath;
    console.log(`Generating handlers into ${outdir}`);
    const label = (title: string) => ({ title, showFiles: options.debug });

    if (!outdir) {
      throw new Error('Output path must be specified');
    }

    const manifest: Manifest = readManifestSync(options.manifestPath);
    const stream = generateHandlers(manifest, options.debug);
    stream
      .pipe(gulp.dest(outdir))
      .pipe(debug(label('generated lambda handlers')));
  },
};
