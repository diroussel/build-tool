import util from 'util';
import stream from 'stream';
import gulp from 'gulp';
import debug from 'gulp-debug';
import { SrcOptions } from 'vinyl-fs';
import { exclude } from '../util/stream-util';

const pipeline = util.promisify(stream.pipeline);

export interface CopyFileOptions {
  files: string[];
  outputPath: string;
  debug: boolean;
  stripPrefix: boolean;
  exclude: string[];
}

export async function copyFileWithGulp(
  options: CopyFileOptions
): Promise<void> {
  const label = (title: string) => ({ title, showFiles: options.debug });
  const opts: SrcOptions = {
    buffer: false,
    strict: true,
  };
  if (!options.stripPrefix) {
    opts.base = '.';
  }

  console.log('Copying files in', options.files, 'Opts:', opts);

  await pipeline(
    gulp.src(options.files, opts),
    debug(label('found files:')),
    exclude(options.exclude),
    debug(label('copying files:')),
    gulp.dest(options.outputPath)
  );
}
