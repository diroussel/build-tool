/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */
import util from 'util';
import stream from 'stream';
import gulp from 'gulp';
import debug from 'gulp-debug';
import rename from 'gulp-rename';
import size from 'gulp-size';
import zip from 'gulp-zip';
import { SrcOptions } from 'vinyl-fs';

import { Manifest, readManifestSync } from '../next-build/manifest';
import { addMappingsFile } from '../mappings/generate-lambda-mappings';
import { generateHandlers } from '../handler/generate-lambda-handler';

import addMetadata from '../util/add-metadata';
import { exclude, logHash, sortFiles } from '../util/stream-util';

const pipeline = util.promisify(stream.pipeline);

// We add all files with the same timestamp, so we get a consistent SHA1 hash of the output file
const fixedTime = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));

export interface ZipArgs {
  files: string[];
  baseDir?: string;
  outputDir: string;
  zipFile: string;
  component?: string;
  componentVersion?: string;
  stripPrefix: boolean;
  exclude: string[];
  addDeployScript: boolean;
  generateLambdaHandlers: boolean;
  processNextJsStaticFiles: boolean;
  stripHtmlExtension: boolean;
  manifestPath: string;
  debug: boolean;
  lambdaGroupName: string;
  buildId: string;
}

const logProgress = (msg: string) => console.log(`  ... ${msg}`);
const label = (title: string, options) => ({
  title,
  showFiles: options.debug,
  logger: logProgress,
});

function processNextJsStaticFiles(stripHtmlExtension: boolean) {
  return rename((path) => {
    if (stripHtmlExtension && path.extname === '.html') {
      path.extname = ''; // eslint-disable-line no-param-reassign
    }
    if (path.dirname.startsWith('static/')) {
      path.dirname = `_next/${path.dirname}`; // eslint-disable-line no-param-reassign
    }
  });
}

export async function zipFiles(options: ZipArgs): Promise<void> {
  let outputDir: string;
  if (!options.outputDir) {
    // apply default outputDir
    if (!options.component) {
      throw new Error('Either component or outputDir options must be set');
    }
    outputDir = `dist/${options.component}`;
  } else {
    outputDir = options.outputDir;
  }

  const opts: SrcOptions = {
    buffer: false,
    silent: false,
    strict: true,
    dot: true,
    debug: options.debug,
  };

  /* eslint-disable sonarjs/no-nested-template-literals */
  console.log(
    `Creating package ${
      options.component ? `for ${options.component}` : ``
    } in ${outputDir}`
  );
  /* eslint-enable sonarjs/no-nested-template-literals */

  if (options.baseDir) {
    opts.base = options.baseDir;
  }

  const streams = [];

  streams.push(
    gulp.src(options.files, opts),
    debug(label('input files:', options)),
    exclude(options.exclude)
  );

  if (options.addDeployScript) {
    logProgress('Adding deployment script');
    streams.push(
      gulp.src(`src/deployment/component/${options.component}/deploy.sh`)
    );
  }
  if (options.componentVersion) {
    logProgress('Adding artifact-metadata.json');
    streams.push(addMetadata(options.componentVersion));
  }

  if (options.generateLambdaHandlers) {
    logProgress('Adding lambda handlers and mappings');
    const manifest: Manifest = readManifestSync(options.manifestPath);
    streams.push(
      addMappingsFile(manifest, options.lambdaGroupName, options.buildId),
      generateHandlers(manifest, options.debug)
    );
  }

  if (options.processNextJsStaticFiles) {
    logProgress('Adding Nextjs static resources');
    streams.push(processNextJsStaticFiles(options.stripHtmlExtension));
  }

  if (options.zipFile) {
    logProgress('Zipping files');
    streams.push(
      sortFiles(),
      debug(label('actual files to add:', options)),
      zip(options.zipFile, { modifiedTime: fixedTime, buffer: false })
    );
  }

  streams.push(
    gulp.dest(outputDir),
    logHash(logProgress),
    size(label('zip files created:', options))
  );

  return await pipeline(streams);
}
