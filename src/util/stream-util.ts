import { makeRe } from 'micromatch';
import crypto from 'crypto';
import File from 'vinyl';
import { Duplex, PassThrough, Readable, Transform } from 'stream';

/**
 * Drop files from the stream if they match the condition glob
 * @param conditions Glob strings for which files to exclude from the stream
 */
export function exclude(conditions: Array<string>): NodeJS.ReadWriteStream {
  const regexps = conditions.map((condition) => makeRe(condition));
  return new Transform({
    objectMode: true,
    transform: (file: File, enc, next) => {
      const filePathMatchFound = regexps.some((regexp) =>
        regexp.test(file.path)
      );
      if (!filePathMatchFound) {
        next(null, file);
      } else {
        next();
      }
    },
  });
}

/**
 * Write the original data stream into two new dataa streams.  Can be used to calc the hash, the second to pass down the pipeline
 * @param input The stream the data is coming in from
 * @param syphon The side stream to spread a copy of the data into
 * @return Readable A new stream to output a second copy of the data into
 */
export function teeStream(
  input: NodeJS.ReadableStream,
  syphon: NodeJS.ReadWriteStream
): Readable {
  const passThrough = new PassThrough();

  input.on('data', (data) => {
    syphon.write(data);
    passThrough.write(data);
  });

  input.on('end', () => {
    syphon.end();
    passThrough.end();
  });
  syphon.resume();

  return passThrough;
}

/**
 * Log the sha1 hash of the files in the stream
 */
export function logHash(logger: (string) => void): Duplex {
  return new Transform({
    objectMode: true,
    transform: (file: File, enc, next) => {
      if (file.isDirectory()) {
        next(null, file);
        return;
      }

      const hasher = crypto.createHash('sha1');
      hasher.on('end', () => {
        logger(`SHA1 hash sum: ${hasher.digest('hex')}\t${file.relative}`);
      });

      if (file.isStream()) {
        // eslint-disable-next-line no-param-reassign
        file.contents = teeStream(file.contents, hasher);
      } else if (file.isBuffer()) {
        hasher.resume();
        hasher.end(file.contents);
      } else {
        hasher.end();
      }
      next(null, file);
    },
  });
}

function defaultComparator(a: File, b: File) {
  return a.path.localeCompare(b.path);
}

export function sortFiles(): Duplex {
  const files: Array<File> = [];
  return new Transform({
    objectMode: true,
    transform: (file: File, enc, next) => {
      files.push(file);
      next();
    },
    flush(next) {
      // sort array in-place
      files.sort(defaultComparator);
      files.forEach((file) => this.push(file));
      next();
    },
  });
}

export async function waitForStreamToEnd(
  stream: NodeJS.EventEmitter
): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
}
